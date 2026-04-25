from sqlalchemy import event
from slugify import slugify


def _generate_slug(mapper, connection, target):
    """Gera slug automaticamente a partir do nome antes de inserir ou atualizar."""
    if target.name and not target.slug:
        target.slug = slugify(target.name)


class SlugMixin:
    """Mixin que registra automaticamente o listener de slug ao ser herdado."""

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        event.listens_for(cls, "before_insert", _generate_slug)
        event.listens_for(cls, "before_update", _generate_slug)