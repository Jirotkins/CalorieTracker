import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from PIL import Image, ImageOps
import io

from api.deps import get_current_user
from models.user import User

router = APIRouter()

UPLOAD_DIR = "/app/static/photos"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_DIMENSION = 800  # px
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Nahraje fotku, resizuje ji na max 800px a vrátí URL."""

    # Kontrola MIME typu
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Nepodporovaný formát souboru. Povolené: JPEG, PNG, WebP."
        )

    # Přečte soubor do paměti
    contents = await file.read()

    # Kontrola velikosti (max 10 MB)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Soubor je příliš velký. Maximum je 10 MB."
        )

    # Otevře obrázek pomocí Pillow a aplikuje EXIF otočení
    try:
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.exif_transpose(image)
    except Exception:
        raise HTTPException(status_code=400, detail="Soubor nelze přečíst jako obrázek.")

    # Převede do RGB (HEIC, PNG s průhledností → JPEG)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Resizuje na max 800×800 px, zachová poměr stran
    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    # Vytvoří složku pokud neexistuje
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Unikátní jméno souboru
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Uloží jako JPEG s kvalitou 85%
    image.save(filepath, "JPEG", quality=85, optimize=True)

    return {"url": f"/static/photos/{filename}"}


class DeletePhotoRequest(BaseModel):
    url: str

@router.delete("/upload")
async def delete_photo(
    req: DeletePhotoRequest,
    current_user: User = Depends(get_current_user)
):
    """Smaže fotku podle její URL adresy (pokud existuje)."""
    if not req.url or not req.url.startswith("/static/photos/"):
        return {"status": "ignored", "message": "Není lokální fotka"}
    
    filename = req.url.split("/")[-1]
    
    # Bezpečnostní kontrola, aby nešlo mazat mimo složku
    if not filename or ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Neplatný název souboru.")
        
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            return {"status": "deleted"}
        except Exception as e:
            print(f"Chyba při mazání souboru {filepath}: {e}")
            raise HTTPException(status_code=500, detail="Nelze smazat soubor.")
            
    return {"status": "not_found"}

