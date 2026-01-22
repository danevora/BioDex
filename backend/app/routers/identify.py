from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
import io

from app.services.ai_service import ai_service

router = APIRouter(prefix="/api", tags=["identify"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_SIZE_MB = 10


@router.post("/identify")
async def identify_animal(image: UploadFile = File(...)):
    """
    Identify an animal in the uploaded image.

    Accepts JPEG, PNG, GIF, or WebP images up to 10MB.
    Returns match result with animal_id if found in BioDex catalog.
    """
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    image_data = await image.read()

    if len(image_data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Image too large. Maximum size: {MAX_SIZE_MB}MB",
        )

    try:
        img = Image.open(io.BytesIO(image_data))
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file",
        )

    result = ai_service.identify_animal(image_data, image.content_type)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Identification failed"),
        )

    return result
