"""cria tabelas areas empresas coletas vagas

Revision ID: 0001
Revises:
Create Date: 2026-10-26 11:53:50.566148

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "areas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_table(
        "coletas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("fonte", sa.String(length=100), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pendente",
                "em_andamento",
                "concluida",
                "falhou",
                name="statuscoleta",
                native_enum=False,
                length=20,
            ),
            nullable=False,
        ),
        sa.Column(
            "iniciada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("finalizada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_vagas", sa.Integer(), nullable=False),
        sa.Column("erro", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "empresas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("site", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_table(
        "vagas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=300), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("localizacao", sa.String(length=200), nullable=True),
        sa.Column(
            "nivel",
            sa.Enum(
                "estagio",
                "junior",
                "pleno",
                "senior",
                "especialista",
                name="nivel",
                native_enum=False,
                length=20,
            ),
            nullable=True,
        ),
        sa.Column(
            "modalidade",
            sa.Enum(
                "presencial", "hibrido", "remoto", name="modalidade", native_enum=False, length=20
            ),
            nullable=True,
        ),
        sa.Column("salario_min", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("salario_max", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("publicada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "coletada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("area_id", sa.Integer(), nullable=True),
        sa.Column("coleta_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["coleta_id"], ["coletas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )


def downgrade() -> None:
    op.drop_table("vagas")
    op.drop_table("empresas")
    op.drop_table("coletas")
    op.drop_table("areas")
