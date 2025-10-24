from tcgdexsdk import Language, TCGdex, Query
from tcgdexsdk.enums import Quality, Extension
import asyncio
import cv2
import numpy as np
import base64
import requests
from io import BytesIO
from PIL import Image

async def main():
    sdk = TCGdex("ja")
    card = None
    try:
        card = await sdk.card.get('SV2P-001')
    except Exception as e:
        print(f"Warning: {e}")
    if card is None:
        print("Không lấy được thông tin card.")
        return
    try:
        # Lấy URL ảnh (nếu muốn)
        image_url = card.get_image_url(Quality.HIGH, Extension.WEBP)
        print("Image URL:", image_url)
        # Lấy dữ liệu ảnh trực tiếp
        img_data = card.get_image(Quality.HIGH, Extension.WEBP)
    except Exception as e:
        print(f"Error fetching image: {e}")
        return
    print(f"img_data type: {type(img_data)}")  # Debug line

    # decode bytes / url / base64 / file-like / PIL Image
    if isinstance(img_data, (bytes, bytearray)):
        buf = np.frombuffer(img_data, dtype=np.uint8)
        img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
    elif isinstance(img_data, str):
        if img_data.startswith("http://") or img_data.startswith("https://"):
            resp = requests.get(img_data)
            resp.raise_for_status()
            buf = np.frombuffer(resp.content, dtype=np.uint8)
            img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
        else:
            b = base64.b64decode(img_data)
            buf = np.frombuffer(b, dtype=np.uint8)
            img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
    elif hasattr(img_data, "read"):
        b = img_data.read()
        buf = np.frombuffer(b, dtype=np.uint8)
        img = cv2.imdecode(buf, cv2.IMREAD_UNCHANGED)
    elif isinstance(img_data, Image.Image):
        pil = img_data.convert("RGBA") if img_data.mode in ("LA","RGBA") else img_data.convert("RGB")
        arr = np.array(pil)
        if arr.shape[2] == 3:
            img = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        else:
            img = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA)
    else:
        print(f"Unsupported image format: {type(img_data)}")  # More info
        return

    window_name = getattr(card, "id", "card") if card else "card"
    cv2.imshow(window_name, img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
if __name__ == "__main__":
    asyncio.run(main())