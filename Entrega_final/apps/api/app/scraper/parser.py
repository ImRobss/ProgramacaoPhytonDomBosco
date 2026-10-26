import re
from datetime import date
from typing import TypedDict

from bs4 import BeautifulSoup, Tag

from app.scraper import seletores

_ID_NO_LINK = re.compile(r"-(\d+)(?:\?|$)")


# Tags que sobrevivem na descrição. Todo o resto é desembrulhado (fica só o texto) e nenhum
# atributo é mantido, então o HTML resultante pode ser renderizado no front sem risco de
# script, link malicioso ou estilo injetado.
TAGS_PERMITIDAS = {"p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"}
TAGS_REMOVIDAS_COM_CONTEUDO = {"script", "style", "iframe", "noscript", "template", "button"}


class VagaLinkedin(TypedDict):
    linkedin_id: str
    titulo: str
    empresa: str | None
    local: str | None
    data: date | None
    link: str


def extrair_vagas(html: str) -> list[VagaLinkedin]:
    """Recebe o HTML de uma página do jobs-guest e devolve as vagas encontradas."""
    soup = BeautifulSoup(html, "html.parser")
    vagas = []
    for card in soup.select(seletores.CARD):
        vaga = _extrair_card(card)
        if vaga is not None:
            vagas.append(vaga)
    return vagas


def _extrair_card(card: Tag) -> VagaLinkedin | None:
    link_tag = card.select_one(seletores.LINK)
    link = _limpar_link(link_tag.get("href", "")) if link_tag else ""
    titulo = _texto(card, seletores.TITULO)
    linkedin_id = _extrair_id(card, link)

    # Sem id, título ou link a vaga não serve para nada, então o card é ignorado
    if not (linkedin_id and titulo and link):
        return None

    return {
        "linkedin_id": linkedin_id,
        "titulo": titulo,
        "empresa": _texto(card, seletores.EMPRESA),
        "local": _texto(card, seletores.LOCAL),
        "data": _extrair_data(card),
        "link": link,
    }


def _texto(card: Tag, seletor: str) -> str | None:
    tag = card.select_one(seletor)
    if tag is None:
        return None
    return " ".join(tag.get_text().split()) or None


def _extrair_id(card: Tag, link: str) -> str | None:
    urn = card.get(seletores.ATRIBUTO_URN, "")
    if urn:
        return urn.rsplit(":", 1)[-1]
    encontrado = _ID_NO_LINK.search(link)
    return encontrado.group(1) if encontrado else None


def _extrair_data(card: Tag) -> date | None:
    tag = card.select_one(seletores.DATA)
    if tag is None or not tag.get("datetime"):
        return None
    try:
        return date.fromisoformat(tag["datetime"])
    except ValueError:
        return None


def _limpar_link(href: str) -> str:
    # Os parâmetros (position, refId, trackingId) mudam a cada busca; sem eles o link é estável
    return href.split("?", 1)[0]


class Criterio(TypedDict):
    nome: str
    valor: str


class DetalheVaga(TypedDict):
    descricao_html: str
    descricao_texto: str
    criterios: list[Criterio]
    candidatos: str | None
    publicada_ha: str | None


def extrair_detalhe(html: str) -> DetalheVaga | None:
    """Recebe o HTML da página de detalhe de uma vaga e devolve a descrição e os critérios.

    Devolve None quando a página não tem descrição (página de erro, 429 ou layout novo).
    """
    soup = BeautifulSoup(html, "html.parser")
    descricao = soup.select_one(seletores.DETALHE_DESCRICAO)
    if descricao is None:
        return None

    descricao_html = limpar_descricao(descricao)
    texto = _texto_da_descricao(BeautifulSoup(descricao_html, "html.parser"))
    if not texto:
        return None

    return {
        "descricao_html": descricao_html,
        "descricao_texto": texto,
        "criterios": _extrair_criterios(soup),
        "candidatos": _texto(soup, seletores.DETALHE_CANDIDATOS),
        "publicada_ha": _texto(soup, seletores.DETALHE_PUBLICADA_HA),
    }


def limpar_descricao(descricao: Tag) -> str:
    """Devolve o HTML interno da descrição só com as TAGS_PERMITIDAS e sem atributos."""
    # Trabalha numa cópia para não mexer na árvore original
    copia = BeautifulSoup(str(descricao), "html.parser").find()
    for tag in copia.find_all(TAGS_REMOVIDAS_COM_CONTEUDO):
        tag.decompose()
    for tag in copia.find_all(True):
        if tag.name in TAGS_PERMITIDAS:
            tag.attrs = {}
        else:
            tag.unwrap()
    html = copia.decode_contents().strip()
    # Tira as quebras de linha soltas e os <br/> sobrando no começo e no fim
    html = re.sub(r"\s*\n\s*", " ", html)
    html = re.sub(r"^(?:\s*<br/>)+|(?:<br/>\s*)+$", "", html)
    return html.strip()


def _texto_da_descricao(soup: BeautifulSoup) -> str:
    # Quebra de linha onde o HTML quebra (br, fim de parágrafo e de item de lista)
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for bloco in soup.find_all(["p", "li"]):
        prefixo = "• " if bloco.name == "li" else ""
        bloco.insert(0, prefixo)
        bloco.append("\n")
    linhas = [" ".join(linha.split()) for linha in soup.get_text().split("\n")]
    # Junta linhas vazias repetidas numa só
    return re.sub(r"\n{3,}", "\n\n", "\n".join(linhas)).strip()


def _extrair_criterios(soup: BeautifulSoup) -> list[Criterio]:
    criterios = []
    for item in soup.select(seletores.DETALHE_CRITERIO):
        nome = _texto(item, seletores.DETALHE_CRITERIO_NOME)
        valor = _texto(item, seletores.DETALHE_CRITERIO_VALOR)
        if nome and valor:
            criterios.append({"nome": nome, "valor": valor})
    return criterios
