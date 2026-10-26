import json
from pathlib import Path

import pytest

from app.models import Modalidade, Nivel
from app.scraper.classificador import (
    PALAVRAS_CHAVE_POR_AREA,
    classificar,
    classificar_area,
    detectar_modalidade,
    detectar_nivel,
    normalizar,
)

AREAS_JSON = Path(__file__).resolve().parent.parent / "seeds" / "areas.json"

BACK = "Backend"
FRONT = "Frontend"
FULL = "Full Stack"
MOB = "Mobile"
DADOS = "Dados"
OPS = "DevOps e Cloud"
QA = "Qualidade (QA)"
SEG = "Segurança da Informação"
UX = "UX/UI Design"
# É de TI, mas o título não diz a área: entra na listagem com area=None
GERAL = "TI geral"

ESTAGIO, JR, PL, SR, ESP = (
    Nivel.ESTAGIO,
    Nivel.JUNIOR,
    Nivel.PLENO,
    Nivel.SENIOR,
    Nivel.ESPECIALISTA,
)
REM, HIB, PRES = Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL

# Títulos e locais reais coletados no endpoint jobs-guest do LinkedIn em 26/10/2026.
# (título, local, área esperada, nível esperado, modalidade esperada).
# Área GERAL = é de TI sem área definida; área None = não é TI e é descartada.
TITULOS_REAIS = [
    # Backend
    ("Desenvolvedor Backend Python", "Greater Curitiba", BACK, None, None),
    ("Python Junior Developer - Remote Work | REF#283516", "Campo Grande, MS", BACK, JR, REM),
    ("Engenheiro de software Python (Especialista)", "Greater São Paulo Area", BACK, ESP, None),
    ("Software Engineer Backend -Sênior", "Florianópolis, SC", BACK, SR, None),
    ("Engenheiro de Software Sr. (Python)", "São Paulo, SP", BACK, SR, None),
    (
        "Analista Desenvolvedor(a) Python (1 vaga) (Home Based) - "
        "[Open to internal and external applicants]",
        "Brasília, DF",
        BACK,
        None,
        REM,
    ),
    ("Brazil - Remote: Senior Backend Engineer (Python)", "Greater Rio de Janeiro", BACK, SR, REM),
    ("Desenvolvedor Python Pleno", "São Paulo, SP", BACK, PL, None),
    ("Python Tech Lead - Remote Work", "Salvador, BA", BACK, None, REM),
    ("Senior Python Backend Engineer | AWS", "Indaiatuba, SP", BACK, SR, None),
    (
        "[Tech] Especialista em Engenharia de Software - Python/Inteligência Artificial",
        "São Paulo, Brazil",
        BACK,
        ESP,
        None,
    ),
    ("Dev Back-end (Python)", "Florianópolis, SC", BACK, None, None),
    # Full Stack
    ("Desenvolvedor Fullstack Senior - Foco em Python", "São Paulo, SP", FULL, SR, None),
    ("Full Stack Web Engineer (Python & React)", "Greater Fortaleza", FULL, None, None),
    (
        "Senior Full-Stack Developer (Python) - COM INGLÊS - Remoto",
        "São Paulo, SP",
        FULL,
        SR,
        REM,
    ),
    # Frontend
    ("Front-End Developer - Remote Work | REF#284091", "Duque de Caxias, BA", FRONT, None, REM),
    ("Senior Front-end Developer - React", "Florianópolis, SC", FRONT, SR, None),
    (
        "Desenvolvedor(a) Front-end Angular | Pleno e Sênior | Inglês Avançado",
        "São Paulo, SP",
        FRONT,
        PL,
        None,
    ),
    ("Desenvolvedor Front End Pl", "Barueri, SP", FRONT, PL, None),
    ("DESENVOLVEDOR FRONT-END SR (REACT)", "Campinas e Região", FRONT, SR, None),
    # Mobile
    ("DEVELOPER MOBILE IOS/ANDROID (Pl, Sr & Spec) | Recife", "Recife, PE", MOB, PL, None),
    ("Mid iOS Mobile Developer", "Brasil", MOB, PL, None),
    (
        "28705 | Pessoa Analista de Desenvolvimento de Produtos II - Android ou iOS",
        "São José, SC",
        MOB,
        None,
        None,
    ),
    ("Senior Mobile Developer ( Kotlin and Android SDK )", "Brasil", MOB, SR, None),
    # Dados
    ("ENGENHEIRO DE DADOS Sênior", "Nova Lima, MG", DADOS, SR, None),
    (
        "Senior Data Engineer (Azure Databricks) - Remote Work | REF#302231",
        "Rio de Janeiro e Região",
        DADOS,
        SR,
        REM,
    ),
    ("Engenheiro (a) de Dados Cloud Sr", "Goiânia, GO", DADOS, SR, None),
    ("Engenheiro(a) de Dados Databricks | Pleno/Sênior (Remoto)", "São Paulo, SP", DADOS, PL, REM),
    # DevOps e Cloud
    ("Semi Senior DevOps - Remote Work | REF#305644", "Rio de Janeiro e Região", OPS, PL, REM),
    ("Senior DevOps/Platform Engineer", "Brasília, DF", OPS, SR, None),
    (
        "(BANCO DE TALENTOS) Especialista DevOps | Infraestrutura",
        "Rio de Janeiro e Região",
        OPS,
        ESP,
        None,
    ),
    ("DevOps Engineer (100% remote)", "Brasil", OPS, None, REM),
    # Qualidade (QA)
    ("Software Quality Analyst I (soluções mobile) - 11868", "Blumenau, SC", QA, None, None),
    ("Junior QA Analyst / R + D - Remote Work | REF#284138", "Duque de Caxias, BA", QA, JR, REM),
    (
        "Software Tester (QA) / Research + Development - Trabalho Remoto | REF#189925",
        "Joinville, SC",
        QA,
        None,
        REM,
    ),
    ("Analista de QA Jr - Joinville", "Joinville, SC", QA, JR, None),
    ("QA Analyst Mid/Sr - Talent Pool", "Recife, PE", QA, PL, None),
    # Segurança da Informação
    ("Pessoa Analista de Segurança da Informação Sênior", "São Paulo, SP", SEG, SR, None),
    ("Cyber Analyst II", "São Paulo, SP", SEG, None, None),
    ("ANALISTA DE SEGURANÇA DA INFORMAÇÃO (SOC)", "Rio de Janeiro, RJ", SEG, None, None),
    ("Analista de Cyber Security - Trabalho Remoto", "Curitiba, PR", SEG, None, REM),
    ("Senior Info Security Analyst", "Recife, PE", SEG, SR, None),
    # UX/UI Design
    ("UI/UX DESIGNER JÚNIOR/PLENO", "Florianópolis, SC", UX, JR, None),
    ("Senior Product Designer (UX/UI)", "Agudos, SP", UX, SR, None),
    ("UI Designer - Remote work | REF#300434", "Brasil", UX, None, REM),
    # Estágio (buscas "intern" e "estágio" de 27/10/2026)
    (
        "Software Engineering Intern (Brazil) - Year Round 2027",
        "São Paulo, SP",
        BACK,
        ESTAGIO,
        None,
    ),
    ("Estagiário em Desenvolvimento de Software", "São Paulo, SP", BACK, ESTAGIO, None),
    (
        "Pessoa Desenvolvedora de Software - Banco de Talentos - Estágio (Modelo Híbrido)",
        "Recife, PE",
        BACK,
        ESTAGIO,
        HIB,
    ),
    ("Estágio em Desenvolvimento Back-End Java", "Curitiba, PR", BACK, ESTAGIO, None),
    ("Desenvolvedor Fullstack (Estágio)", "Campinas, SP", FULL, ESTAGIO, None),
    ("R&D Intern (student) - iOS development", "Manaus, AM", MOB, ESTAGIO, None),
    ("ESTAGIÁRIO DE INFRAESTRUTURA - TI", "Belo Horizonte, MG", OPS, ESTAGIO, None),
    ("Estagiário de TI - Segurança da Informação", "São Paulo, SP", SEG, ESTAGIO, None),
    # Estágio genérico de TI: sem palavra de nenhuma das 9 áreas, mas é de TI
    ("Estágio em Tecnologia da Informação", "Juiz de Fora, MG", GERAL, ESTAGIO, None),
    ("Tech Internship Program", "São Paulo, SP", GERAL, ESTAGIO, None),
    ("Estágio em TI e Suporte Operacional", "São Paulo, SP", GERAL, ESTAGIO, None),
    ("Estagiário(a) de Desenvolvimento (Trainee)", "Recife, PE", GERAL, ESTAGIO, None),
    ("[BANCO DE TALENTOS] Estágio de Desenvolvedor (a)", "São Paulo, SP", GERAL, ESTAGIO, None),
    # Não é TI: descartar
    ("Vendedor de Veículos - BAIC Blumenau", "Blumenau, SC", None, None, None),
    ("Consultor de Vendas Jr.", "Aracaju, SE", None, None, None),
    (
        "Enfermeiro(a) - Centro Cirúrgico - Hospital de Caridade",
        "Florianópolis, SC",
        None,
        None,
        None,
    ),
    ("ANALISTA FINANCEIRO SENIOR", "São Paulo, SP", None, None, None),
    (
        "Analista Sênior de FP&A | Digital & Corporate Finance",
        "São Paulo, Brasil",
        None,
        None,
        None,
    ),
    # Genérico demais para saber a área, mas é de TI
    ("Desenvolvedor III", "Bento Gonçalves, RS", GERAL, None, None),
    # "Segurança" sozinho pode ser segurança do trabalho: sem sinal de TI, descarta
    ("ANALISTA DE SEGURANÇA", "Brasília, DF", None, None, None),
]


def test_lista_tem_pelo_menos_30_titulos():
    assert len(TITULOS_REAIS) >= 30


@pytest.mark.parametrize(
    ("titulo", "local", "area", "nivel", "modalidade"), TITULOS_REAIS, ids=lambda v: str(v)[:40]
)
def test_classifica_titulos_reais(titulo, local, area, nivel, modalidade):
    resultado = classificar(titulo, local)

    if area == GERAL:
        assert resultado == {"area": None, "nivel": nivel, "modalidade": modalidade}
    elif area is None:
        assert resultado is None
    else:
        assert resultado == {"area": area, "nivel": nivel, "modalidade": modalidade}


def test_areas_do_classificador_sao_as_do_seed():
    nomes_seed = json.loads(AREAS_JSON.read_text(encoding="utf-8"))

    assert sorted(PALAVRAS_CHAVE_POR_AREA) == sorted(nomes_seed)


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("Desenvolvedor Sênior", "desenvolvedor senior"),
        ("ENGENHEIRO DE DADOS", "engenheiro de dados"),
        ("Híbrido   –  São Paulo", "hibrido – sao paulo"),
        ("Front-End", "front end"),
        ("Estágio em TI", "estagio em ti"),
    ],
)
def test_normalizar(texto, esperado):
    assert normalizar(texto) == esperado


def test_palavra_chave_nao_casa_dentro_de_outra_palavra():
    # "java" não pode casar em "javascript", nem "ui" em "guia"
    assert classificar_area("Desenvolvedor JavaScript") == FRONT
    assert classificar_area("Guia de Turismo") is None


def test_intern_nao_casa_em_internal():
    assert detectar_nivel("Open to internal applicants") is None


@pytest.mark.parametrize(
    ("titulo", "esperado"),
    [
        ("Estágio em Desenvolvimento Python", ESTAGIO),
        ("Estagiário(a) de Dados", ESTAGIO),
        ("Software Engineering Intern", ESTAGIO),
        ("Internship Program - Data", ESTAGIO),
        ("Programa de Estágios 2027", ESTAGIO),
        ("Vagas para Estagiários de TI", ESTAGIO),
        ("Summer Interns - Engineering", ESTAGIO),
        ("Desenvolvedor Júnior", JR),
        ("Desenvolvedor Python Jr", JR),
        ("Analista de Dados Pleno", PL),
        ("Engenheiro de Software Sênior", SR),
        ("Especialista em Cloud", ESP),
        ("Desenvolvedor Python", None),
    ],
)
def test_detectar_nivel(titulo, esperado):
    assert detectar_nivel(titulo) is esperado


@pytest.mark.parametrize(
    ("titulo", "local", "esperado"),
    [
        ("Desenvolvedor Python - Remoto", "São Paulo, SP", REM),
        ("Desenvolvedor Python (Híbrido)", "São Paulo, SP", HIB),
        ("Hybrid Data Engineer", None, HIB),
        ("Analista de QA - Presencial", "Recife, PE", PRES),
        ("Desenvolvedor Python", "São Paulo, SP (Híbrido)", HIB),
        ("Desenvolvedor Python", "Brasil (Remote)", REM),
        ("Desenvolvedor Python - Remoto", "São Paulo (Presencial)", REM),
        ("Desenvolvedor Python", "São Paulo, SP", None),
        ("Desenvolvedor Python", None, None),
    ],
)
def test_detectar_modalidade_no_titulo_e_no_local(titulo, local, esperado):
    assert detectar_modalidade(titulo, local) is esperado


@pytest.mark.parametrize(
    "titulo",
    [
        "Desenvolvedor de Negócios",
        "Business Developer",
        "Tech Recruiter",
        "Analista Comercial de Tecnologia",
        "Executivo de Vendas - Software",
        "Analista de Desenvolvimento Humano",
    ],
)
def test_termos_de_fora_anulam_o_sinal_geral_de_ti(titulo):
    assert classificar(titulo) is None


def test_termo_de_fora_nao_anula_palavra_de_area():
    # "comercial" não tira a vaga de TI quando a área está clara
    assert classificar("Desenvolvedor Python - Sistema Comercial")["area"] == BACK


@pytest.mark.parametrize(
    "titulo",
    [
        "IT Support Analyst",
        "Analista de Sistemas Pleno",
        "Técnico de Suporte Técnico",
        "Estágio em TI",
    ],
)
def test_sinais_gerais_de_ti_entram_sem_area(titulo):
    resultado = classificar(titulo)

    assert resultado is not None
    assert resultado["area"] is None
