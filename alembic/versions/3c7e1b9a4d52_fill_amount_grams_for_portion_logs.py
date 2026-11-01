"""Fill amount_grams for portion logs

Revision ID: 3c7e1b9a4d52
Revises: afc6cf09e76b
Create Date: 2026-11-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '3c7e1b9a4d52'
down_revision: Union[str, Sequence[str], None] = 'afc6cf09e76b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Doplní gramy starým záznamům zalogovaným jen porcí.

    Gramy jsou od teď zdroj pravdy, takže pozdější úprava nebo smazání porce
    nezmění historii v deníčku.
    """
    op.execute(
        """
        UPDATE meal_log
        SET amount_grams = (SELECT weight_grams FROM food_portions WHERE food_portions.id = meal_log.portion_id)
        WHERE amount_grams IS NULL AND portion_id IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE meal_log
        SET amount_grams = (SELECT weight_grams FROM recipe_portions WHERE recipe_portions.id = meal_log.recipe_portion_id)
        WHERE amount_grams IS NULL AND recipe_portion_id IS NOT NULL
        """
    )


def downgrade() -> None:
    """Datová migrace — doplněné gramy odpovídají váze porce, není co vracet."""
    pass
