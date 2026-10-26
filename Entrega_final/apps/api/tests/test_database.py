from sqlalchemy import make_url
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import engine, get_db


def test_engine_usa_database_url_das_configuracoes():
    # Compara como URL, porque o SQLAlchemy reordena os parâmetros da query string
    assert engine.url == make_url(get_settings().database_url)


def test_get_db_entrega_sessao_ligada_ao_engine():
    gen = get_db()
    session = next(gen)

    assert isinstance(session, Session)
    assert session.get_bind() is engine

    gen.close()
