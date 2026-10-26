from pathlib import Path

import pytest
import requests

from app.scraper import linkedin
from app.scraper.linkedin import URL_BUSCA, buscar_vagas

FIXTURES = Path(__file__).parent / "fixtures"
PAGINAS = [p.read_text(encoding="utf-8") for p in sorted(FIXTURES.glob("linkedin_*.html"))]


class RespostaFalsa:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")


class SessaoFalsa:
    """Devolve as respostas na ordem e guarda os parâmetros de cada chamada."""

    def __init__(self, respostas: list[RespostaFalsa]):
        self.respostas = list(respostas)
        self.chamadas: list[dict] = []

    def get(self, url, params=None, **kwargs):
        assert url == URL_BUSCA
        self.chamadas.append(params)
        return self.respostas.pop(0)


@pytest.fixture
def pausas(monkeypatch):
    registro: list[float] = []
    monkeypatch.setattr(linkedin.time, "sleep", registro.append)
    return registro


def test_pagina_pelo_parametro_start(pausas):
    sessao = SessaoFalsa([RespostaFalsa(200, html) for html in PAGINAS])

    vagas = buscar_vagas("python", "Brazil", max_paginas=3, session=sessao)

    assert [c["start"] for c in sessao.chamadas] == [0, 10, 20]
    assert all(c["keywords"] == "python" and c["location"] == "Brazil" for c in sessao.chamadas)
    assert len(vagas) == len({v["linkedin_id"] for v in vagas})
    assert len(vagas) > 10


def test_pausa_entre_requisicoes(pausas):
    sessao = SessaoFalsa([RespostaFalsa(200, html) for html in PAGINAS])

    buscar_vagas("python", "Brazil", max_paginas=3, pausa=1.5, session=sessao)

    # Não espera antes da primeira página, só entre elas
    assert pausas == [1.5, 1.5]


def test_respeita_limite_de_paginas(pausas):
    sessao = SessaoFalsa([RespostaFalsa(200, html) for html in PAGINAS])

    vagas = buscar_vagas("python", "Brazil", max_paginas=1, session=sessao)

    assert len(sessao.chamadas) == 1
    assert len(vagas) == 10


def test_para_no_429_e_devolve_o_que_ja_coletou(pausas):
    sessao = SessaoFalsa([RespostaFalsa(200, PAGINAS[0]), RespostaFalsa(429), RespostaFalsa(200)])

    vagas = buscar_vagas("python", "Brazil", max_paginas=3, session=sessao)

    assert len(sessao.chamadas) == 2
    assert len(vagas) == 10


def test_para_quando_passa_do_fim_dos_resultados(pausas):
    # Com start além do fim, o LinkedIn responde 400 com corpo vazio
    sessao = SessaoFalsa([RespostaFalsa(200, PAGINAS[0]), RespostaFalsa(400), RespostaFalsa(200)])

    vagas = buscar_vagas("python", "Brazil", max_paginas=3, session=sessao)

    assert len(sessao.chamadas) == 2
    assert len(vagas) == 10


def test_para_em_pagina_vazia(pausas):
    sessao = SessaoFalsa([RespostaFalsa(200, ""), RespostaFalsa(200, PAGINAS[0])])

    assert buscar_vagas("python", "Brazil", session=sessao) == []
    assert len(sessao.chamadas) == 1


def test_outros_erros_sobem(pausas):
    sessao = SessaoFalsa([RespostaFalsa(500)])

    with pytest.raises(requests.HTTPError):
        buscar_vagas("python", "Brazil", session=sessao)
