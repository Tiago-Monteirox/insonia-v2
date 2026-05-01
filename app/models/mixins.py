from slugify import slugify
from sqlalchemy import event


def _get_slug_on_insert(mapper, connection, target):
    """Gera slug apenas na inserção."""
    if target.name and not target.slug:
        target.slug = slugify(target.name)


def _set_slug_on_update(mapper, connection, target):
    """Regenera slug sempre que o nome mudar em um update."""
    if target.name:
        target.slug = slugify(target.name)


class SlugMixin:
    """Mixin que registra automaticamente o listener de slug ao ser herdado."""

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        event.listen(cls, "before_insert", _get_slug_on_insert)
        event.listen(cls, "before_update", _set_slug_on_update)
