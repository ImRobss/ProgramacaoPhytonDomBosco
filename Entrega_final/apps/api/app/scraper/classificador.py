import re
import unicodedata
from typing import TypedDict

from app.models import Modalidade, Nivel


def normalizar(texto: str) -> str:
    """Deixa o texto em minúsculas, sem acentos e com hífens trocados por espaço.

    Assim "Front-End Sênior" e "front end senior" viram o mesmo texto.
    """
    sem_acentos = unicodedata.normalize("NFKD", texto)
    sem_acentos = "".join(c for c in sem_acentos if not unicodedata.combining(c))
    sem_acentos = sem_acentos.lower().replace("-", " ").replace("_", " ")
    return " ".join(sem_acentos.split())


def _compilar(termos: list[str]) -> re.Pattern[str]:
    # Termos mais longos primeiro, para "semi senior" ganhar de "senior" na mesma posição.
    # As bordas impedem que "ui" case dentro de "guia" ou "sr" dentro de "srta".
    normalizados = sorted({normalizar(t) for t in termos}, key=len, reverse=True)
    alternativas = "|".join(re.escape(t) for t in normalizados)
    return re.compile(rf"(?<![a-z0-9])(?:{alternativas})(?![a-z0-9])")


# A ordem importa: vale a primeira área com palavra-chave no título. As mais específicas
# vêm antes, por exemplo "Engenheiro de Dados Cloud" é Dados (e não Cloud) e
# "Full Stack (Python & React)" é Full Stack (e não Backend ou Frontend).
# Os nomes são os mesmos de seeds/areas.json.
PALAVRAS_CHAVE_POR_AREA: dict[str, list[str]] = {
    "Qualidade (QA)": [
        "qa",
        "quality assurance",
        "quality analyst",
        "quality engineer",
        "qualidade de software",
        "teste",
        "testes",
        "tester",
        "testing",
    ],
    "Segurança da Informação": [
        "segurança da informação",
        "segurança cibernética",
        "cibersegurança",
        "cyber",
        "cybersecurity",
        "security",
        "infosec",
        "soc",
        "pentest",
    ],
    "UX/UI Design": [
        "ux",
        "ui",
        "ui/ux",
        "ux/ui",
        "product designer",
        "user experience",
    ],
    "Dados": [
        "dados",
        "data",
        "bi",
        "business intelligence",
        "analytics",
        "databricks",
        "machine learning",
        "data scientist",
        "cientista de dados",
        "etl",
    ],
    "DevOps e Cloud": [
        "devops",
        "sre",
        "site reliability",
        "cloud engineer",
        "engenheiro de cloud",
        "platform engineer",
        "infraestrutura",
        "kubernetes",
    ],
    "Full Stack": [
        "full stack",
        "fullstack",
    ],
    "Mobile": [
        "mobile",
        "android",
        "ios",
        "flutter",
        "react native",
        "kotlin",
        "swift",
    ],
    "Frontend": [
        "front end",
        "frontend",
        "react",
        "angular",
        "vue",
        "javascript",
        "typescript",
    ],
    "Backend": [
        "back end",
        "backend",
        "python",
        "java",
        "node",
        "node.js",
        "c#",
        ".net",
        "php",
        "golang",
        "ruby",
        "django",
        "spring",
        "engenheiro de software",
        "engenheira de software",
        "engenheiro(a) de software",
        "engenharia de software",
        "software engineer",
        "software engineering",
        "software developer",
        "software development",
        "desenvolvimento de software",
        "desenvolvedor de software",
        "desenvolvedora de software",
        "desenvolvedor(a) de software",
        "programador",
    ],
}

# Sinais de que a vaga é de TI mesmo sem dizer a área ("Estágio em TI", "Desenvolvedor III").
# Só são consultados quando nenhuma área bateu.
TERMOS_TI_GERAL = [
    "ti",
    "t.i",
    "t.i.",
    "it",
    "tecnologia da informação",
    "tecnologia",
    "tech",
    "desenvolvedor",
    "desenvolvedora",
    "desenvolvedor(a)",
    "developer",
    "desenvolvimento",
    "software",
    "sistemas",
    "programação",
    "informática",
    "computação",
    "suporte técnico",
    "help desk",
    "service desk",
]

# Anulam os sinais gerais acima: "Desenvolvedor de Negócios", "Tech Recruiter", "Analista
# Comercial de Tecnologia" não são vagas de TI. Não anulam as palavras-chave das áreas.
TERMOS_NAO_TI = [
    "negócios",
    "negocio",
    "business",
    "vendas",
    "sales",
    "comercial",
    "recursos humanos",
    "rh",
    "recrutador",
    "recrutadora",
    "recruiter",
    "desenvolvimento humano",
    "desenvolvimento organizacional",
]

TERMOS_POR_NIVEL: dict[Nivel, list[str]] = {
    Nivel.ESTAGIO: [
        "estágio",
        "estágios",
        "estagiário",
        "estagiária",
        "estagiario(a)",
        "estagiários",
        "estagiárias",
        "intern",
        "interns",
        "internship",
    ],
    Nivel.JUNIOR: ["júnior", "jr", "jr."],
    Nivel.PLENO: ["pleno", "pl", "mid", "mid level", "semi senior"],
    Nivel.SENIOR: ["sênior", "sr", "sr."],
    Nivel.ESPECIALISTA: ["especialista", "specialist", "spec"],
}

TERMOS_POR_MODALIDADE: dict[Modalidade, list[str]] = {
    Modalidade.REMOTO: ["remoto", "remota", "remote", "home office", "home based", "anywhere"],
    Modalidade.HIBRIDO: ["híbrido", "híbrida", "hybrid"],
    Modalidade.PRESENCIAL: ["presencial", "on site", "onsite", "in office"],
}

_PADROES_AREA = {area: _compilar(termos) for area, termos in PALAVRAS_CHAVE_POR_AREA.items()}
_PADRAO_TI_GERAL = _compilar(TERMOS_TI_GERAL)
_PADRAO_NAO_TI = _compilar(TERMOS_NAO_TI)


def _padrao_com_rotulos(termos_por_rotulo: dict) -> tuple[re.Pattern[str], dict[str, object]]:
    rotulo_do_termo = {normalizar(t): r for r, termos in termos_por_rotulo.items() for t in termos}
    return _compilar(list(rotulo_do_termo)), rotulo_do_termo


_PADRAO_NIVEL, _NIVEL_DO_TERMO = _padrao_com_rotulos(TERMOS_POR_NIVEL)
_PADRAO_MODALIDADE, _MODALIDADE_DO_TERMO = _padrao_com_rotulos(TERMOS_POR_MODALIDADE)


def classificar_area(titulo: str) -> str | None:
    """Devolve o nome da primeira área cujas palavras-chave aparecem no título, ou None."""
    texto = normalizar(titulo)
    for area, padrao in _PADROES_AREA.items():
        if padrao.search(texto):
            return area
    return None


def eh_ti(titulo: str) -> bool:
    """A vaga é de TI se bate com alguma área ou tem um sinal geral de TI (sem termo de fora)."""
    if classificar_area(titulo) is not None:
        return True
    texto = normalizar(titulo)
    return bool(_PADRAO_TI_GERAL.search(texto)) and not _PADRAO_NAO_TI.search(texto)


def detectar_nivel(titulo: str) -> Nivel | None:
    """Devolve o nível do primeiro termo que aparece no título ("Pleno e Sênior" vira pleno)."""
    encontrado = _PADRAO_NIVEL.search(normalizar(titulo))
    return _NIVEL_DO_TERMO[encontrado.group()] if encontrado else None


def detectar_modalidade(titulo: str, local: str | None = None) -> Modalidade | None:
    """Procura a modalidade primeiro no título e, se não achar, no local."""
    for texto in (titulo, local or ""):
        encontrado = _PADRAO_MODALIDADE.search(normalizar(texto))
        if encontrado:
            return _MODALIDADE_DO_TERMO[encontrado.group()]
    return None


class Classificacao(TypedDict):
    # None = é de TI, mas o título não diz a área ("Estágio em TI")
    area: str | None
    nivel: Nivel | None
    modalidade: Modalidade | None


def classificar(titulo: str, local: str | None = None) -> Classificacao | None:
    """Classifica a vaga. Devolve None só quando não é de TI de jeito nenhum: descartar.

    Vaga de TI sem área identificável volta com area=None e continua valendo.
    """
    if not eh_ti(titulo):
        return None
    area = classificar_area(titulo)
    return {
        "area": area,
        "nivel": detectar_nivel(titulo),
        "modalidade": detectar_modalidade(titulo, local),
    }
