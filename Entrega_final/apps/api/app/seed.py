import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Area

AREAS_JSON = Path(__file__).resolve().parent.parent / "seeds" / "areas.json"


def carregar_areas(session: Session, caminho: Path = AREAS_JSON) -> int:
    """Insere as áreas do JSON que ainda não existem no banco e devolve quantas foram criadas."""
    nomes = json.loads(caminho.read_text(encoding="utf-8"))
    existentes = set(session.scalars(select(Area.nome)))
    novas = [Area(nome=nome) for nome in nomes if nome not in existentes]
    session.add_all(novas)
    session.commit()
    return len(novas)


if __name__ == "__main__":
    with SessionLocal() as session:
        criadas = carregar_areas(session)
    print(f"{criadas} área(s) criada(s).")
