from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
    PaginatedInventory,
)
from app.schemas.filter import FilterRequest
from app.models import Inventory
from app.database import get_db
import os
import json

router = APIRouter(prefix="/inventory", tags=["Inventory"])
INVENTORY_IMAGE_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/inventory_images")

# Thêm mới
@router.post("/", response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory(data: InventoryCreate, db: Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    db_item = Inventory(**data_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Sửa
@router.put("/{inventory_id}", response_model=InventoryOut)
def update_inventory(inventory_id: int, data: InventoryUpdate, db: Session = Depends(get_db)):
    db_item = db.query(Inventory).filter(Inventory.inventory_id == inventory_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# Xóa
@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    db_item = db.query(Inventory).filter(Inventory.inventory_id == inventory_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory not found")
    db.delete(db_item)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedInventory)
def get_inventory(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: str = Query(None, description="Từ khóa tìm kiếm"),
    sort_field: Optional[str] = Query("date_added", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(Inventory)
    if search:
        query = query.filter(
            Inventory.storage_location.ilike(f"%{search}%")
            | Inventory.notes.ilike(f"%{search}%")
            | Inventory.language.ilike(f"%{search}%")
        )
    valid_sort_fields = {
        "inventory_id": Inventory.inventory_id,
        "master_card_id": Inventory.master_card_id,
        "total_quantity": Inventory.total_quantity,
        "quantity_sold": Inventory.quantity_sold,
        "avg_purchase_price": Inventory.avg_purchase_price,
        "avg_selling_price": Inventory.avg_selling_price,
        "storage_location": Inventory.storage_location,
        "language": Inventory.language,
        "date_added": Inventory.date_added,
        "last_updated": Inventory.last_updated
    }
    if sort_field in valid_sort_fields:
        col = valid_sort_fields[sort_field]
        if sort_order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}

# Lấy tất cả danh sách (không phân trang)
@router.get("/all", response_model=List[InventoryOut])
def get_all_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).order_by(Inventory.date_added).all()

# Filter nâng cao
@router.post("/filter", response_model=PaginatedInventory)
def filter_inventory(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("date_added", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(Inventory)
    valid_sort_fields = {
        "inventory_id": Inventory.inventory_id,
        "master_card_id": Inventory.master_card_id,
        "quantity_in_stock": Inventory.quantity_in_stock,
        "purchase_price": Inventory.purchase_price,
        "date_added": Inventory.date_added,
        "last_updated": Inventory.last_updated,
    }
    for filter in filter_request.filters:
        field = getattr(Inventory, filter.field, None)
        if field is not None:
            col_type = str(field.type)
            value = filter.value
            if "INTEGER" in col_type or "NUMERIC" in col_type:
                try:
                    value = int(value)
                except Exception:
                    continue
            if filter.operator == "eq":
                query = query.filter(field == value)
            elif filter.operator == "ne":
                query = query.filter(field != value)
            elif filter.operator == "lt":
                query = query.filter(field < value)
            elif filter.operator == "le":
                query = query.filter(field <= value)
            elif filter.operator == "gt":
                query = query.filter(field > value)
            elif filter.operator == "ge":
                query = query.filter(field >= value)
            elif filter.operator == "like":
                query = query.filter(field.ilike(f"%{value}%"))
    if sort_field in valid_sort_fields:
        col = valid_sort_fields[sort_field]
        if sort_order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
    total = query.order_by(None).count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total}

# Upload hình cho inventory photo_avatar
@router.post("/{inventory_id}/upload-photo", response_model=InventoryOut)
def upload_inventory_photo(
    inventory_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_item = db.query(Inventory).filter(Inventory.inventory_id == inventory_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory not found")

    os.makedirs(INVENTORY_IMAGE_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{inventory_id}_{db_item.master_card_id}".replace(" ", "_").replace("/", "_")
    filename = f"{safe_name}{ext}"
    save_path = os.path.join(INVENTORY_IMAGE_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    # Chỉ lưu 1 hình ảnh đại diện
    db_item.photo_avatar = f"/inventory_images/{filename}"
    db.commit()
    db.refresh(db_item)
    return db_item