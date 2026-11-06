"""Add final_weight_grams to recipe

Revision ID: 8d2f4a6c1e93
Revises: 3c7e1b9a4d52
Create Date: 2026-11-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d2f4a6c1e93'
down_revision: Union[str, Sequence[str], None] = '3c7e1b9a4d52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Váha hotového jídla (po uvaření) — nutná pro přepočet maker při úpravě receptu
    with op.batch_alter_table('recipes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('final_weight_grams', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('recipes', schema=None) as batch_op:
        batch_op.drop_column('final_weight_grams')
