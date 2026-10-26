import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app

client = TestClient(app)


@pytest.fixture
def banco_online():
    # StaticPool + check_same_thread=False: o TestClient roda a rota em outra thread
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    def get_db_sqlite():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = get_db_sqlite
    yield
    app.dependency_overrides.clear()


class SessaoSemBanco:
    def execute(self, *args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("conexão recusada"))


@pytest.fixture
def banco_offline():
    app.dependency_overrides[get_db] = lambda: SessaoSemBanco()
    yield
    app.dependency_overrides.clear()


def test_health(banco_online):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_retorna_503_sem_banco(banco_offline):
    response = client.get("/health")

    assert response.status_code == 503
    assert response.json() == {"status": "erro", "database": "offline"}


def test_cors_libera_origem_do_client(banco_online):
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
