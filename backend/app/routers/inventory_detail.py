from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
from app.schemas.inventory_detail import (
    DetailInventoryCreate,
    DetailInventoryUpdate,
    DetailInventoryOut,
)
from app.models import DetailInventory
from app.database import get_db
from cloudinary import config as cloudinary_config
from cloudinary.uploader import upload as cloudinary_upload, destroy as cloudinary_destroy

router = APIRouter(prefix="/detail-inventory", tags=["DetailInventory"])
DETAIL_IMAGE_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/detail_inventory_images")
# Configure Cloudinary via env (recommended) or explicit keys
cloudinary_config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)
CLOUDINARY_FOLDER = "detail_inventory_images"

def cloudinary_public_id_from_url(url: str) -> Optional[str]:
    """Extract Cloudinary public_id from secure_url/url."""
    try:
        # strip query
        clean = url.split("?")[0]
        # split by /upload/
        parts = clean.split("/upload/")
        if len(parts) < 2:
            return None
        tail = parts[1]
        # remove leading version v123456...
        segs = tail.split("/")
        if segs and segs[0].startswith("v") and segs[0][1:].isdigit():
            segs = segs[1:]
        path = "/".join(segs)
        # remove extension
        public_id, _ = os.path.splitext(path)
        return public_id
    except Exception:
        return None

def parse_card_photos(row):
    photos = row.get("card_photos")
    if isinstance(photos, str):
        try:
            row["card_photos"] = json.loads(photos)
        except Exception:
            row["card_photos"] = []
    return row

# Thêm mới
@router.post("/", response_model=DetailInventoryOut, status_code=status.HTTP_201_CREATED)
def create_detail_inventory(data: DetailInventoryCreate, db: Session = Depends(get_db)):
    filtered_data = data.dict(exclude_unset=True)
    # Cho phép nhận photo_count từ client
    db_item = DetailInventory(**filtered_data)
    photos = db_item.card_photos or []
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    # Nếu client gửi photo_count thì dùng, nếu không thì tự tính
    db_item.photo_count = filtered_data.get("photo_count", len(photos) if photos else 0)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    result = db_item.__dict__.copy()
    result = parse_card_photos(result)
    result["photo_count"] = db_item.photo_count
    return result

# Sửa
@router.put("/{detail_id}", response_model=DetailInventoryOut)
def update_detail_inventory(detail_id: int, data: DetailInventoryUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DetailInventory).filter(DetailInventory.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="DetailInventory not found")
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    photos = db_item.card_photos or []
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    # Nếu client gửi photo_count thì dùng, nếu không thì tự tính
    db_item.photo_count = update_data.get("photo_count", len(photos) if photos else 0)
    db.commit()
    db.refresh(db_item)
    result = db_item.__dict__.copy()
    result = parse_card_photos(result)
    result["photo_count"] = db_item.photo_count
    return result

# Xóa
@router.delete("/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_detail_inventory(detail_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DetailInventory).filter(DetailInventory.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="DetailInventory not found")

    # Delete images on Cloudinary before removing DB row
    photos = db_item.card_photos or []
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    if isinstance(photos, list):
        for url in photos:
            public_id = cloudinary_public_id_from_url(str(url))
            if public_id:
                try:
                    cloudinary_destroy(public_id, invalidate=True, resource_type="image")
                except Exception:
                    # ignore errors to ensure DB delete still succeeds
                    pass

    db.delete(db_item)
    db.commit()
    return

# Lấy tất cả, có tìm kiếm và filter
@router.get("/all", response_model=List[DetailInventoryOut])
def get_all_detail_inventory(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Tìm kiếm ghi chú hoặc vị trí"),
    inventory_id: Optional[int] = Query(None, description="Lọc theo inventory_id"),
    is_sold: Optional[bool] = Query(None, description="Lọc theo trạng thái bán"),
    physical_condition_us: Optional[str] = Query(None, description="Lọc theo tình trạng US"),
    is_graded: Optional[bool] = Query(None, description="Lọc theo đã chấm điểm"),
):
    query = db.query(DetailInventory)
    if inventory_id is not None:
        query = query.filter(DetailInventory.inventory_id == inventory_id)
    if is_sold is not None:
        query = query.filter(DetailInventory.is_sold == is_sold)
    if physical_condition_us is not None:
        query = query.filter(DetailInventory.physical_condition_us == physical_condition_us)
    if is_graded is not None:
        query = query.filter(DetailInventory.is_graded == is_graded)
    if search:
        query = query.filter(
            (DetailInventory.notes.ilike(f"%{search}%"))
        )
    details = query.order_by(DetailInventory.date_added.desc()).all()
    results = []
    for item in details:
        row = item.__dict__.copy()
        row = parse_card_photos(row)
        results.append(row)
    return results

@router.post("/{detail_id}/upload-photos", response_model=DetailInventoryOut)
async def upload_detail_photos(
    detail_id: int,
    inventory_id: int = Query(..., description="ID inventory cha"),
    angles: List[str] = Query(..., description="Danh sách góc chụp, ví dụ: front,back,corner1,corner2,..."),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    db_item = db.query(DetailInventory).filter(DetailInventory.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="DetailInventory not found")

    # Upload to Cloudinary instead of saving locally
    saved_files: List[str] = []
    for idx, file in enumerate(files):
        angle = angles[idx] if idx < len(angles) else f"angle{idx+1}"
        safe_angle = angle.replace(" ", "_").replace("/", "_")
        public_id = f"{inventory_id}_{detail_id}_{safe_angle}"

        # Read stream once for upload
        content = await file.read()
        try:
            up_res = cloudinary_upload(
                content,
                folder=CLOUDINARY_FOLDER,
                public_id=public_id,         # base id
                overwrite=False,             # don't overwrite if exists
                use_filename=True,           # keep original name base
                unique_filename=True,        # Cloudinary will append a unique suffix
                resource_type="image",
            )
            url = up_res.get("secure_url") or up_res.get("url")
            if url:
                saved_files.append(url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {e}")

    photos = db_item.card_photos or []
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    photos.extend(saved_files)

    # Persist as ARRAY or JSON string depending on model column type
    if hasattr(DetailInventory, "card_photos") and str(DetailInventory.card_photos.type).lower().find("array") >= 0:
        db_item.card_photos = photos
    else:
        db_item.card_photos = json.dumps(photos)

    # Update photo_count
    db_item.photo_count = len(photos)

    db.commit()
    db.refresh(db_item)

    result = db_item.__dict__.copy()
    result = parse_card_photos(result)
    return result

@router.get("/by-inventory/{inventory_id}", response_model=List[DetailInventoryOut])
def get_details_by_inventory_id(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    from app.models import Inventory  # Import để join với bảng inventory
    
    # Join với bảng Inventory để lấy master_card_id
    details = (
        db.query(DetailInventory, Inventory.master_card_id)
        .join(Inventory, DetailInventory.inventory_id == Inventory.inventory_id)
        .filter(DetailInventory.inventory_id == inventory_id)
        .order_by(DetailInventory.date_added.desc())
        .all()
    )
    
    results = []
    for item, master_card_id in details:
        row = item.__dict__.copy()
        row = parse_card_photos(row)
        # Thêm master_card_id vào kết quả
        row["master_card_id"] = master_card_id
        results.append(row)
    return results


