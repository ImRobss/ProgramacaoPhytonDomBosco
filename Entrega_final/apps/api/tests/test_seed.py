import json

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Area
from app.seed import AREAS_JSON, carregar_areas


@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_arquivo_de_seeds_tem_9_areas_unicas():
    nomes = json.loads(AREAS_JSON.read_text(encoding="utf-8"))

    assert len(nomes) == 9
    assert len(set(nomes)) == 9


def test_carregar_areas_insere_as_9_areas(session):
    assert carregar_areas(session) == 9
    assert session.scalar(select(func.count()).select_from(Area)) == 9


def test_carregar_areas_e_idempotente(session):
    carregar_areas(session)

    assert carregar_areas(session) == 0
    assert session.scalar(select(func.count()).select_from(Area)) == 9
