import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_active_user
from app.core.config import MAX_IMAGE_SIZE_MB
from app.core.database import get_db
from app.models.product import ProductImage

router = APIRouter(prefix="/produtos", tags=["imagens"])

UPLOAD_DIR = Path("media/imagens")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def save_image(file: UploadFile, product_id: int) -> str:
    """Valida e persiste um arquivo de imagem no disco, retornando o caminho salvo."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Tipo não permitido: {file.content_type}"
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(
            status_code=400, detail=f"Arquivo muito grande: {size_mb:.1f}MB"
        )

    filename = f"{product_id}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(content)
    return str(file_path)


@router.post("/{product_id}/images")
async def upload_images(
    product_id: int,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(current_active_user),
):
    """Recebe múltiplos arquivos, salva no disco e registra os caminhos no banco."""
    paths = await asyncio.gather(*[save_image(f, product_id) for f in files])

    images = [ProductImage(product_id=product_id, path=p) for p in paths]
    db.add_all(images)
    await db.commit()

    return {"urls": [f"/media/{Path(p).name}" for p in paths]}
