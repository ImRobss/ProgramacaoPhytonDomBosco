"""Gera um retrato da coleta em JSON para o front visualizar, sem depender da API nem do banco.

Uso (dentro de apps/api):
    uv run python -m app.scraper.exportar ../client/src/data/vagas.json
        busca as vagas de novo e depois o detalhe (descrição completa) de cada uma
    uv run python -m app.scraper.exportar ../client/src/data/vagas.json --so-detalhes
        não refaz a busca: só completa os detalhes que ainda faltam no JSON
    uv run python -m app.scraper.exportar ../client/src/data/vagas.json --reclassificar
        não acessa o LinkedIn: só reaplica o classificador (depois de mudar as palavras-chave)

Os detalhes já baixados são reaproveitados, então rodar de novo só busca o que falta.
"""

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import requests

from app.scraper.classificador import PALAVRAS_CHAVE_POR_AREA, classificar
from app.scraper.linkedin import LimiteDeRequisicoes, buscar_detalhe, buscar_vagas

# Um termo por área, os de estágio, e alguns de fora de TI para mostrar o descarte do classificador
TERMOS = [
    "desenvolvedor backend",
    "desenvolvedor frontend",
    "desenvolvedor full stack",
    "desenvolvedor mobile",
    "engenheiro de dados",
    "devops",
    "analista de qa",
    "segurança da informação",
    "ux ui designer",
    "intern",
    "internship",
    "vendedor",
    "analista financeiro",
]

PAUSA_ENTRE_TERMOS = 5.0
# Um termo que volta vazio quase sempre levou 429; tenta de novo uma vez depois desta pausa
PAUSA_ANTES_DE_REPETIR = 30.0
PAUSA_ENTRE_DETALHES = 3.0
SALVAR_A_CADA = 10


def exportar(saida: Path, local: str = "Brazil", max_paginas: int = 1) -> dict:
    """Refaz a busca de todos os TERMOS e depois completa os detalhes de cada vaga.

    Se um termo não trouxer nada nem na segunda tentativa (quase sempre 429), as vagas que
    o JSON anterior tinha para ele são mantidas, para o retrato não encolher por bloqueio.
    """
    anterior = _ler(saida).get("vagas", [])
    vistas: dict[str, dict] = {}
    for indice, termo in enumerate(TERMOS):
        if indice > 0:
            time.sleep(PAUSA_ENTRE_TERMOS)
        encontradas = buscar_vagas(termo, local, max_paginas=max_paginas)
        if not encontradas:
            time.sleep(PAUSA_ANTES_DE_REPETIR)
            encontradas = buscar_vagas(termo, local, max_paginas=max_paginas)
        if not encontradas:
            mantidas = [
                v for v in anterior if v["termo"] == termo and v["linkedin_id"] not in vistas
            ]
            for vaga in mantidas:
                vistas[vaga["linkedin_id"]] = _reclassificar(vaga)
            print(f"{termo}: LinkedIn não respondeu; mantidas {len(mantidas)} vaga(s) anteriores")
            continue
        for vaga in encontradas:
            if vaga["linkedin_id"] in vistas:
                continue
            vistas[vaga["linkedin_id"]] = _reclassificar(
                {
                    **vaga,
                    "data": vaga["data"].isoformat() if vaga["data"] else None,
                    "termo": termo,
                }
            )
        print(f"{termo}: {len(vistas)} vaga(s) no total")

    # Reaproveita os detalhes que o JSON anterior já tinha
    detalhes_antigos = {
        vaga["linkedin_id"]: vaga["detalhe"] for vaga in anterior if "detalhe" in vaga
    }
    for linkedin_id, vaga in vistas.items():
        if linkedin_id in detalhes_antigos:
            vaga["detalhe"] = detalhes_antigos[linkedin_id]

    retrato = {
        "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "local": local,
        "termos": TERMOS,
        "areas": list(PALAVRAS_CHAVE_POR_AREA),
        "vagas": list(vistas.values()),
    }
    _salvar(saida, retrato)
    return completar_detalhes(saida)


def completar_detalhes(saida: Path, session: requests.Session | None = None) -> dict:
    """Busca o detalhe das vagas do JSON que ainda não têm, começando pelas de TI.

    Vaga sem a chave "detalhe" ainda não foi buscada. "detalhe": null quer dizer que o
    LinkedIn não devolveu descrição (vaga encerrada, por exemplo) e não se tenta de novo.
    """
    retrato = _ler(saida)
    if not retrato:
        sys.exit(f"{saida} não existe; rode sem --so-detalhes primeiro.")

    session = session or requests.Session()
    pendentes = sorted(
        (vaga for vaga in retrato["vagas"] if "detalhe" not in vaga),
        key=lambda vaga: not vaga.get("ti", vaga["area"] is not None),
    )
    print(f"{len(pendentes)} vaga(s) sem detalhe.")

    for indice, vaga in enumerate(pendentes, start=1):
        if indice > 1:
            time.sleep(PAUSA_ENTRE_DETALHES)
        try:
            vaga["detalhe"] = buscar_detalhe(vaga["linkedin_id"], session=session)
        except LimiteDeRequisicoes:
            _salvar(saida, retrato)
            faltam = len(pendentes) - indice + 1
            print(
                f"O LinkedIn bloqueou as requisições (429). Faltaram {faltam} vaga(s); "
                "espere alguns minutos e rode de novo com --so-detalhes."
            )
            return retrato
        situacao = "ok" if vaga["detalhe"] else "sem descrição"
        print(f"[{indice}/{len(pendentes)}] {vaga['titulo'][:60]}: {situacao}")
        if indice % SALVAR_A_CADA == 0:
            _salvar(saida, retrato)

    _salvar(saida, retrato)
    return retrato


def _reclassificar(vaga: dict) -> dict:
    """Recalcula área, nível e modalidade, para refletir mudanças no classificador."""
    classificacao = classificar(vaga["titulo"], vaga["local"])
    return {
        **vaga,
        # false = não é de TI: descartada, aparece só na visão geral do painel
        "ti": classificacao is not None,
        "area": classificacao["area"] if classificacao else None,
        "nivel": classificacao["nivel"] if classificacao else None,
        "modalidade": classificacao["modalidade"] if classificacao else None,
    }


def reclassificar(saida: Path) -> dict:
    """Reaplica o classificador a todas as vagas do JSON, sem acessar o LinkedIn."""
    retrato = _ler(saida)
    if not retrato:
        sys.exit(f"{saida} não existe; rode sem --reclassificar primeiro.")
    retrato["vagas"] = [_reclassificar(vaga) for vaga in retrato["vagas"]]
    _salvar(saida, retrato)
    de_ti = sum(vaga["ti"] for vaga in retrato["vagas"])
    sem_area = sum(vaga["ti"] and vaga["area"] is None for vaga in retrato["vagas"])
    print(
        f"{len(retrato['vagas'])} vaga(s): {de_ti} de TI ({sem_area} sem área definida), "
        f"{len(retrato['vagas']) - de_ti} descartada(s)."
    )
    return retrato


def _ler(caminho: Path) -> dict:
    if not caminho.exists():
        return {}
    return json.loads(caminho.read_text(encoding="utf-8"))


def _salvar(caminho: Path, retrato: dict) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(retrato, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    argumentos = sys.argv[1:]
    opcoes = {a for a in argumentos if a.startswith("--")}
    caminhos = [a for a in argumentos if not a.startswith("--")]
    if len(caminhos) != 1 or not opcoes <= {"--so-detalhes", "--reclassificar"}:
        sys.exit(
            "Uso: python -m app.scraper.exportar <arquivo.json> [--so-detalhes | --reclassificar]"
        )
    if "--reclassificar" in opcoes:
        reclassificar(Path(caminhos[0]))
    elif "--so-detalhes" in opcoes:
        completar_detalhes(Path(caminhos[0]))
    else:
        exportar(Path(caminhos[0]))
