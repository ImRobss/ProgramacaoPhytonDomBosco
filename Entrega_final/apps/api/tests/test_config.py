from app.config import Settings


def test_cors_origins_aceita_lista_separada_por_virgula(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000, http://127.0.0.1:3000")

    settings = Settings(_env_file=None)

    assert settings.cors_origins == ["http://localhost:3000", "http://127.0.0.1:3000"]
