import logging
import time

import requests

from app.scraper.parser import DetalheVaga, VagaLinkedin, extrair_detalhe, extrair_vagas

logger = logging.getLogger(__name__)

URL_BUSCA = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
URL_DETALHE = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{linkedin_id}"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9",
}


def buscar_vagas(
    termo: str,
    local: str,
    max_paginas: int = 5,
    pausa: float = 2.0,
    session: requests.Session | None = None,
) -> list[VagaLinkedin]:
    """Busca vagas no LinkedIn página por página e devolve todas sem repetir.

    Para quando: atinge max_paginas, uma página vem vazia, o start passa do fim dos
    resultados (o LinkedIn responde 400) ou o LinkedIn responde 429 (muitas requisições).
    """
    session = session or requests.Session()
    vagas: dict[str, VagaLinkedin] = {}
    start = 0

    for pagina in range(max_paginas):
        if pagina > 0:
            time.sleep(pausa)

        resposta = session.get(
            URL_BUSCA,
            params={"keywords": termo, "location": local, "start": start},
            headers=HEADERS,
            timeout=15,
        )

        if resposta.status_code == 429:
            logger.warning("LinkedIn respondeu 429 no start=%s; parando a busca.", start)
            break
        if resposta.status_code == 400:
            break
        resposta.raise_for_status()

        encontradas = extrair_vagas(resposta.text)
        if not encontradas:
            break

        for vaga in encontradas:
            vagas.setdefault(vaga["linkedin_id"], vaga)
        # O start avança pelo número de cards da página (hoje são 10 por página)
        start += len(encontradas)

    return list(vagas.values())


class LimiteDeRequisicoes(Exception):
    """O LinkedIn continuou respondendo 429 mesmo depois de todas as tentativas."""


def buscar_detalhe(
    linkedin_id: str,
    session: requests.Session | None = None,
    tentativas: int = 3,
    espera_inicial: float = 15.0,
) -> DetalheVaga | None:
    """Busca a página de detalhe de uma vaga e devolve a descrição completa e os critérios.

    No 429 espera e tenta de novo, dobrando a espera a cada vez (15s, 30s...). Se ainda
    assim levar 429, levanta LimiteDeRequisicoes para quem chamou decidir se para.
    Devolve None quando a vaga não existe mais (404) ou a página veio sem descrição.
    """
    session = session or requests.Session()
    espera = espera_inicial

    for tentativa in range(tentativas):
        resposta = session.get(
            URL_DETALHE.format(linkedin_id=linkedin_id), headers=HEADERS, timeout=15
        )
        if resposta.status_code == 429:
            if tentativa < tentativas - 1:
                logger.warning("429 no detalhe da vaga %s; esperando %.0fs.", linkedin_id, espera)
                time.sleep(espera)
                espera *= 2
            continue
        if resposta.status_code in (404, 410):
            return None
        resposta.raise_for_status()
        return extrair_detalhe(resposta.text)

    raise LimiteDeRequisicoes(f"LinkedIn respondeu 429 {tentativas} vezes na vaga {linkedin_id}")
