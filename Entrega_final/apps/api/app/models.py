from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Nivel(StrEnum):
    ESTAGIO = "estagio"
    JUNIOR = "junior"
    PLENO = "pleno"
    SENIOR = "senior"
    ESPECIALISTA = "especialista"


class Modalidade(StrEnum):
    PRESENCIAL = "presencial"
    HIBRIDO = "hibrido"
    REMOTO = "remoto"


class StatusColeta(StrEnum):
    PENDENTE = "pendente"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    FALHOU = "falhou"


def _enum_coluna(enum: type[StrEnum]) -> Enum:
    # Grava o valor ("junior") em vez do nome ("JUNIOR") e usa VARCHAR em vez de tipo nativo
    # do Postgres, o que simplifica as migrations quando um valor novo for adicionado.
    return Enum(
        enum,
        native_enum=False,
        length=20,
        values_callable=lambda membros: [membro.value for membro in membros],
    )


class Area(Base):
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True)

    vagas: Mapped[list["Vaga"]] = relationship(back_populates="area")

    def __str__(self) -> str:
        return self.nome


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), unique=True)
    site: Mapped[str | None] = mapped_column(String(500))

    vagas: Mapped[list["Vaga"]] = relationship(back_populates="empresa")

    def __str__(self) -> str:
        return self.nome


class Coleta(Base):
    __tablename__ = "coletas"

    id: Mapped[int] = mapped_column(primary_key=True)
    fonte: Mapped[str] = mapped_column(String(100))
    status: Mapped[StatusColeta] = mapped_column(
        _enum_coluna(StatusColeta), default=StatusColeta.PENDENTE
    )
    iniciada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finalizada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_vagas: Mapped[int] = mapped_column(default=0)
    erro: Mapped[str | None] = mapped_column(Text)

    vagas: Mapped[list["Vaga"]] = relationship(back_populates="coleta")

    def __str__(self) -> str:
        return f"{self.fonte} #{self.id}"


class Vaga(Base):
    __tablename__ = "vagas"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(300))
    descricao: Mapped[str | None] = mapped_column(Text)
    url: Mapped[str] = mapped_column(String(1000), unique=True)
    localizacao: Mapped[str | None] = mapped_column(String(200))
    nivel: Mapped[Nivel | None] = mapped_column(_enum_coluna(Nivel))
    modalidade: Mapped[Modalidade | None] = mapped_column(_enum_coluna(Modalidade))
    salario_min: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    salario_max: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    publicada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    coletada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id", ondelete="CASCADE"))
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", ondelete="SET NULL"))
    coleta_id: Mapped[int | None] = mapped_column(ForeignKey("coletas.id", ondelete="SET NULL"))

    empresa: Mapped[Empresa] = relationship(back_populates="vagas")
    area: Mapped[Area | None] = relationship(back_populates="vagas")
    coleta: Mapped[Coleta | None] = relationship(back_populates="vagas")

    def __str__(self) -> str:
        return self.titulo
