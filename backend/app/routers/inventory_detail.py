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

router = APIRouter(prefix="/detail-inventory", tags=["DetailInventory"])
DETAIL_IMAGE_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/detail_inventory_images")

# Thêm mới
@router.post("/", response_model=DetailInventoryOut, status_code=status.HTTP_201_CREATED)
def create_detail_inventory(data: DetailInventoryCreate, db: Session = Depends(get_db)):
    db_item = DetailInventory(**data.dict(exclude_unset=True))
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Sửa
@router.put("/{detail_id}", response_model=DetailInventoryOut)
def update_detail_inventory(detail_id: int, data: DetailInventoryUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DetailInventory).filter(DetailInventory.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="DetailInventory not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# Xóa
@router.delete("/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_detail_inventory(detail_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DetailInventory).filter(DetailInventory.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="DetailInventory not found")
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
    return query.order_by(DetailInventory.date_added.desc()).all()

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

    os.makedirs(DETAIL_IMAGE_DIR, exist_ok=True)
    saved_files = []
    for idx, file in enumerate(files):
        ext = os.path.splitext(file.filename)[1]
        angle = angles[idx] if idx < len(angles) else f"angle{idx+1}"
        safe_angle = angle.replace(" ", "_").replace("/", "_")
        base_name = f"{inventory_id}_{detail_id}_{safe_angle}{ext}"
        save_path = os.path.join(DETAIL_IMAGE_DIR, base_name)
        # Nếu trùng tên file, thêm hậu tố số
        count = 1
        orig_save_path = save_path
        while os.path.exists(save_path):
            base_name = f"{inventory_id}_{detail_id}_{safe_angle}_{count}{ext}"
            save_path = os.path.join(DETAIL_IMAGE_DIR, base_name)
            count += 1
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)
        saved_files.append(f"{base_name}")

    # Cập nhật card_photos
    photos = db_item.card_photos or []
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    photos.extend(saved_files)
    # Nếu cột card_photos là ARRAY thì gán trực tiếp, nếu là TEXT thì lưu json.dumps
    if hasattr(DetailInventory, "card_photos") and str(DetailInventory.card_photos.type).lower().find("array") >= 0:
        db_item.card_photos = photos
    else:
        db_item.card_photos = json.dumps(photos)

    db.commit()
    db.refresh(db_item)

    # Trả về card_photos là mảng
    result = db_item.__dict__.copy()
    if isinstance(result["card_photos"], str):
        try:
            result["card_photos"] = json.loads(result["card_photos"])
        except Exception:
            result["card_photos"] = []
    return result


@router.get("/by-inventory/{inventory_id}", response_model=List[DetailInventoryOut])
def get_details_by_inventory_id(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    details = db.query(DetailInventory).filter(DetailInventory.inventory_id == inventory_id).order_by(DetailInventory.date_added.desc()).all()
    # Chuyển card_photos thành list nếu là string
    for item in details:
        if isinstance(item.card_photos, str):
            item.card_photos = json.loads(item.card_photos)
    return details


