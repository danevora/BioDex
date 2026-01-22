import base64
import io
import json
import os

import anthropic
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

MAX_IMAGE_DIMENSION = 512  # Resize images to max 512px on longest side

BIODEX_CATALOG = [
    {"id": "dog", "commonName": "Dog", "scientificName": "Canis lupus familiaris"},
    {"id": "cat", "commonName": "Cat", "scientificName": "Felis catus"},
    {"id": "frog", "commonName": "Common Frog", "scientificName": "Rana temporaria"},
]

CATALOG_IDS = {animal["id"] for animal in BIODEX_CATALOG}
CATALOG_NAMES = {animal["commonName"].lower(): animal["id"] for animal in BIODEX_CATALOG}


def get_catalog_description() -> str:
    """Generate a description of available animals in the catalog."""
    lines = ["The BioDex catalog contains the following animals:"]
    for animal in BIODEX_CATALOG:
        lines.append(f"- {animal['commonName']} ({animal['scientificName']}) [id: {animal['id']}]")
    return "\n".join(lines)


IDENTIFICATION_PROMPT = f"""You are an animal identification assistant for BioDex, a Pokédex-style app for real animals.

{get_catalog_description()}

Analyze the provided image and determine:
1. What animal (if any) is shown in the image
2. Whether it matches any animal in our BioDex catalog

Respond with a JSON object in this exact format:
{{
    "is_animal": true/false,
    "detected_animal": "name of animal detected or null",
    "matched_id": "catalog id if matched or null",
    "confidence": 0.0-1.0
}}

Rules:
- If no animal is visible, set is_animal to false and other fields to null/0
- If an animal is detected but not in our catalog, set matched_id to null
- Only match to catalog entries if you're confident it's that specific animal
- For dogs: any breed of domestic dog should match "dog"
- For cats: any domestic cat should match "cat"
- For frogs: common frogs or similar species should match "frog"
- Be generous with matching - if it looks like a dog, cat, or frog, match it

Respond ONLY with the JSON object, no other text."""


def resize_image(image_data: bytes, max_dim: int = MAX_IMAGE_DIMENSION) -> tuple[bytes, str]:
    """
    Resize image to reduce API token usage.

    Args:
        image_data: Raw image bytes
        max_dim: Maximum dimension (width or height)

    Returns:
        Tuple of (resized image bytes, media type)
    """
    img = Image.open(io.BytesIO(image_data))

    # Convert RGBA to RGB if needed (for JPEG output)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Calculate new dimensions maintaining aspect ratio
    width, height = img.size
    if width > max_dim or height > max_dim:
        if width > height:
            new_width = max_dim
            new_height = int(height * (max_dim / width))
        else:
            new_height = max_dim
            new_width = int(width * (max_dim / height))
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Save as JPEG for smaller file size
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85)
    return output.getvalue(), "image/jpeg"


class AIService:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.model = "claude-sonnet-4-20250514"

    def identify_animal(self, image_data: bytes, media_type: str) -> dict:
        """
        Identify an animal in the provided image using Claude Vision.

        Args:
            image_data: Raw image bytes
            media_type: MIME type (e.g., "image/jpeg", "image/png")

        Returns:
            dict with identification results
        """
        # Resize image to reduce token usage
        resized_data, resized_type = resize_image(image_data)
        base64_image = base64.standard_b64encode(resized_data).decode("utf-8")

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=256,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": resized_type,
                                    "data": base64_image,
                                },
                            },
                            {
                                "type": "text",
                                "text": IDENTIFICATION_PROMPT,
                            },
                        ],
                    }
                ],
            )

            response_text = message.content[0].text
            result = json.loads(response_text)

            if result.get("matched_id") and result["matched_id"] in CATALOG_IDS:
                return {
                    "success": True,
                    "matched": True,
                    "animal_id": result["matched_id"],
                    "confidence": result.get("confidence", 0.9),
                }
            elif result.get("is_animal") and result.get("detected_animal"):
                return {
                    "success": True,
                    "matched": False,
                    "detected_animal": result["detected_animal"],
                }
            else:
                return {
                    "success": True,
                    "matched": False,
                    "detected_animal": None,
                }

        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Failed to parse AI response",
            }
        except anthropic.APIError as e:
            return {
                "success": False,
                "error": f"API error: {str(e)}",
            }


ai_service = AIService()
