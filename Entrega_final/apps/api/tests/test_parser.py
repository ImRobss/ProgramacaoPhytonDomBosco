from datetime import date
from pathlib import Path

import pytest

from app.scraper.parser import extrair_vagas

FIXTURES = Path(__file__).parent / "fixtures"
PAGINAS = sorted(FIXTURES.glob("linkedin_*.html"))
CAMPOS = {"linkedin_id", "titulo", "empresa", "local", "data", "link"}


def _ler(caminho: Path) -> str:
    return caminho.read_text(encoding="utf-8")


def test_existem_paginas_salvas():
    assert len(PAGINAS) >= 2


@pytest.mark.parametrize("pagina", PAGINAS, ids=lambda p: p.name)
def test_extrai_os_6_campos_de_cada_vaga(pagina):
    vagas = extrair_vagas(_ler(pagina))

    assert len(vagas) == 10
    for vaga in vagas:
        assert set(vaga) == CAMPOS
        assert vaga["linkedin_id"].isdigit()
        assert vaga["titulo"]
        assert vaga["empresa"]
        assert vaga["local"]
        assert isinstance(vaga["data"], date)
        assert vaga["link"].startswith("https://")
        assert "linkedin.com/jobs/view/" in vaga["link"]


@pytest.mark.parametrize("pagina", PAGINAS, ids=lambda p: p.name)
def test_link_sem_parametros_de_rastreio_e_com_o_id(pagina):
    for vaga in extrair_vagas(_ler(pagina)):
        assert "?" not in vaga["link"]
        assert vaga["link"].endswith(vaga["linkedin_id"])


@pytest.mark.parametrize("pagina", PAGINAS, ids=lambda p: p.name)
def test_textos_sem_espacos_sobrando(pagina):
    for vaga in extrair_vagas(_ler(pagina)):
        for campo in ("titulo", "empresa", "local"):
            assert vaga[campo] == " ".join(vaga[campo].split())


def test_ids_unicos_dentro_da_pagina():
    vagas = extrair_vagas(_ler(PAGINAS[0]))

    assert len({vaga["linkedin_id"] for vaga in vagas}) == len(vagas)


CARD_MINIMO = """
<li>
  <div class="base-search-card" data-entity-urn="urn:li:jobPosting:123">
    <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/dev-123?refId=x"></a>
    <h3 class="base-search-card__title">  Dev   Python  </h3>
    <h4 class="base-search-card__subtitle"><a>Acme</a></h4>
    <span class="job-search-card__location">São Paulo, SP</span>
    <time class="job-search-card__listdate--new" datetime="2026-10-25">1 dia</time>
  </div>
</li>
"""


def test_card_minimo():
    assert extrair_vagas(CARD_MINIMO) == [
        {
            "linkedin_id": "123",
            "titulo": "Dev Python",
            "empresa": "Acme",
            "local": "São Paulo, SP",
            "data": date(2026, 10, 25),
            "link": "https://www.linkedin.com/jobs/view/dev-123",
        }
    ]


def test_campos_opcionais_ausentes_viram_none():
    html = """
    <div class="base-search-card" data-entity-urn="urn:li:jobPosting:9">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/x-9"></a>
      <h3 class="base-search-card__title">Dev</h3>
    </div>
    """
    [vaga] = extrair_vagas(html)

    assert vaga["empresa"] is None
    assert vaga["local"] is None
    assert vaga["data"] is None


def test_id_vem_do_link_quando_falta_o_urn():
    html = """
    <div class="base-search-card">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/dev-456?position=1"></a>
      <h3 class="base-search-card__title">Dev</h3>
    </div>
    """
    assert extrair_vagas(html)[0]["linkedin_id"] == "456"


def test_ignora_card_sem_titulo():
    html = """
    <div class="base-search-card" data-entity-urn="urn:li:jobPosting:1">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/x-1"></a>
    </div>
    """
    assert extrair_vagas(html) == []


def test_html_vazio_nao_tem_vagas():
    assert extrair_vagas("") == []
