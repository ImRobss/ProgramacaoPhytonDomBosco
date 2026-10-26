import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Area, Coleta, Empresa, Modalidade, Nivel, StatusColeta, Vaga


@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_vaga_relaciona_empresa_area_e_coleta(session):
    empresa = Empresa(nome="Acme")
    area = Area(nome="Backend")
    coleta = Coleta(fonte="vagas.com")
    vaga = Vaga(
        titulo="Dev Python",
        url="https://exemplo.com/vaga/1",
        nivel=Nivel.JUNIOR,
        modalidade=Modalidade.REMOTO,
        empresa=empresa,
        area=area,
        coleta=coleta,
    )
    session.add(vaga)
    session.commit()

    assert empresa.vagas == [vaga]
    assert area.vagas == [vaga]
    assert coleta.vagas == [vaga]
    assert vaga.coletada_em is not None


def test_coleta_comeca_pendente_e_sem_vagas(session):
    coleta = Coleta(fonte="vagas.com")
    session.add(coleta)
    session.commit()

    assert coleta.status is StatusColeta.PENDENTE
    assert coleta.total_vagas == 0
    assert coleta.iniciada_em is not None


def test_enums_sao_gravados_pelo_valor(session):
    session.add(
        Vaga(
            titulo="Dev",
            url="https://exemplo.com/vaga/2",
            nivel=Nivel.SENIOR,
            modalidade=Modalidade.HIBRIDO,
            empresa=Empresa(nome="Acme"),
        )
    )
    session.commit()

    linha = session.execute(text("SELECT nivel, modalidade FROM vagas")).one()

    assert tuple(linha) == ("senior", "hibrido")
