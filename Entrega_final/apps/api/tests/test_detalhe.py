from pathlib import Path

import pytest
import requests
from bs4 import BeautifulSoup

from app.scraper import linkedin
from app.scraper.linkedin import URL_DETALHE, LimiteDeRequisicoes, buscar_detalhe
from app.scraper.parser import TAGS_PERMITIDAS, extrair_detalhe

FIXTURE = Path(__file__).parent / "fixtures" / "detalhe_vaga_4295469402.html"


@pytest.fixture
def detalhe():
    return extrair_detalhe(FIXTURE.read_text(encoding="utf-8"))


def _pagina(descricao: str, extra: str = "") -> str:
    return f'<div class="show-more-less-html__markup">{descricao}</div>{extra}'


# --- extrair_detalhe com a página real salva ---


def test_extrai_descricao_completa(detalhe):
    texto = detalhe["descricao_texto"]

    assert texto.startswith("Descrição:")
    assert "Node com Nest.js, integrações API" in texto
    assert "• Otimizar consultas em bancos de dados PostgreSQL" in texto
    assert len(texto) > 1000


def test_extrai_criterios(detalhe):
    assert detalhe["criterios"] == [
        {"nome": "Nível de experiência", "valor": "Pleno-sênior"},
        {"nome": "Tipo de emprego", "valor": "Tempo integral"},
        {"nome": "Setores", "valor": "Atividades de serviços financeiros"},
    ]


def test_extrai_candidatos_e_tempo_de_publicacao(detalhe):
    assert detalhe["candidatos"] == "Seja um dos 25 primeiros a se candidatar"
    assert detalhe["publicada_ha"] == "Há 1 ano"


def test_descricao_html_so_tem_tags_permitidas_e_sem_atributos(detalhe):
    soup = BeautifulSoup(detalhe["descricao_html"], "html.parser")
    tags = soup.find_all(True)

    assert tags
    assert {tag.name for tag in tags} <= TAGS_PERMITIDAS
    assert all(tag.attrs == {} for tag in tags)
    assert "<ul>" in detalhe["descricao_html"]
    assert "<strong>" in detalhe["descricao_html"]


def test_texto_sem_espacos_nem_linhas_vazias_sobrando(detalhe):
    texto = detalhe["descricao_texto"]

    assert "\n\n\n" not in texto
    assert all(linha == linha.strip() for linha in texto.split("\n"))


# --- limpeza da descrição (o front renderiza esse HTML) ---


def test_remove_script_estilo_e_atributos_perigosos():
    html = _pagina(
        '<p onclick="roubar()" class="x">Olá <a href="javascript:alert(1)">aqui</a></p>'
        "<script>alert(1)</script><style>p{}</style>"
        '<img src="x" onerror="alert(1)"><iframe src="https://mal.com"></iframe>'
        "<strong style='color:red'>forte</strong>"
    )

    resultado = extrair_detalhe(html)["descricao_html"]

    assert resultado == "<p>Olá aqui</p><strong>forte</strong>"


def test_tags_desconhecidas_viram_so_texto():
    resultado = extrair_detalhe(_pagina("<div><span>um</span> <h2>dois</h2></div>"))

    assert resultado["descricao_html"] == "um dois"


def test_texto_de_lista_e_paragrafos():
    resultado = extrair_detalhe(_pagina("<p>Requisitos:</p><ul><li>Python</li><li>SQL</li></ul>"))

    assert resultado["descricao_texto"] == "Requisitos:\n• Python\n• SQL"


def test_campos_opcionais_ausentes():
    resultado = extrair_detalhe(_pagina("<p>Vaga</p>"))

    assert resultado["criterios"] == []
    assert resultado["candidatos"] is None
    assert resultado["publicada_ha"] is None


def test_pagina_sem_descricao_devolve_none():
    assert extrair_detalhe("<html><body>Erro</body></html>") is None
    assert extrair_detalhe(_pagina("   <br/>  ")) is None


# --- buscar_detalhe ---


class RespostaFalsa:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")


class SessaoFalsa:
    def __init__(self, respostas):
        self.respostas = list(respostas)
        self.urls: list[str] = []

    def get(self, url, **kwargs):
        self.urls.append(url)
        return self.respostas.pop(0)


@pytest.fixture
def esperas(monkeypatch):
    registro: list[float] = []
    monkeypatch.setattr(linkedin.time, "sleep", registro.append)
    return registro


def test_busca_o_detalhe_pelo_id(esperas):
    sessao = SessaoFalsa([RespostaFalsa(200, FIXTURE.read_text(encoding="utf-8"))])

    detalhe = buscar_detalhe("4295469402", session=sessao)

    assert sessao.urls == [URL_DETALHE.format(linkedin_id="4295469402")]
    assert detalhe["publicada_ha"] == "Há 1 ano"
    assert esperas == []


def test_no_429_espera_dobrando_e_tenta_de_novo(esperas):
    sessao = SessaoFalsa(
        [RespostaFalsa(429), RespostaFalsa(429), RespostaFalsa(200, _pagina("<p>Vaga</p>"))]
    )

    detalhe = buscar_detalhe("1", session=sessao, tentativas=3, espera_inicial=10)

    assert detalhe["descricao_texto"] == "Vaga"
    assert esperas == [10, 20]


def test_429_em_todas_as_tentativas_levanta_erro(esperas):
    sessao = SessaoFalsa([RespostaFalsa(429)] * 3)

    with pytest.raises(LimiteDeRequisicoes):
        buscar_detalhe("1", session=sessao, tentativas=3, espera_inicial=10)

    # Não espera depois da última tentativa
    assert esperas == [10, 20]


def test_vaga_que_nao_existe_mais_devolve_none(esperas):
    assert buscar_detalhe("1", session=SessaoFalsa([RespostaFalsa(404)])) is None


def test_outros_erros_sobem(esperas):
    with pytest.raises(requests.HTTPError):
        buscar_detalhe("1", session=SessaoFalsa([RespostaFalsa(500)]))
