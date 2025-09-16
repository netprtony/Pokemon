from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.pokemon_set import (
    PokemonSetBase,
    PokemonSetOut,
    PaginatedPokemonSet,
)
from app.schemas.filter import FilterRequest
from app.models import PokemonSet  # Giả sử bạn đã có model này
from app.database import get_db
import os

router = APIRouter(prefix="/pokemon-sets", tags=["Pokemon Sets"])
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

SYMBOL_SET_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/symbol_set")

# Thêm mới
@router.post("/", response_model=PokemonSetOut, status_code=status.HTTP_201_CREATED)
def create_pokemon_set(data: PokemonSetBase, db: Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    data_dict.pop("created_at", None)  # Bỏ trường này nếu có
    db_set = PokemonSet(**data_dict)
    db.add(db_set)
    db.commit()
    db.refresh(db_set)
    return db_set

# Sửa
@router.put("/{set_id}", response_model=PokemonSetOut)
def update_pokemon_set(set_id: str, data: PokemonSetBase, db: Session = Depends(get_db)):
    db_set = db.query(PokemonSet).filter(PokemonSet.set_id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    for key, value in data.dict().items():
        setattr(db_set, key, value)
    db.commit()
    db.refresh(db_set)
    return db_set

# Xóa
@router.delete("/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pokemon_set(set_id: str, db: Session = Depends(get_db)):
    db_set = db.query(PokemonSet).filter(PokemonSet.set_id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")
    db.delete(db_set)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedPokemonSet)
def get_pokemon_sets(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: str = Query(None, description="Từ khóa tìm kiếm tên bộ bài"),
    sort_field: Optional[str] = Query("series_order", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PokemonSet)
    
    if search:
        query = query.filter(
            PokemonSet.set_name_en.ilike(f"%{search}%")
            | PokemonSet.set_name_original.ilike(f"%{search}%")
            | PokemonSet.series.ilike(f"%{search}%")
            | PokemonSet.region.ilike(f"%{search}%")
            | PokemonSet.total_cards.ilike(f"%{search}%")
            | PokemonSet.release_year.ilike(f"%{search}%")
            | PokemonSet.set_id.ilike(f"%{search}%")
            | PokemonSet.series_order.ilike(f"%{search}%")
        )
    # thêm xử lý sort
    valid_sort_fields = {
        "set_id": PokemonSet.set_id,
        "set_name_en": PokemonSet.set_name_en,
        "set_name_original": PokemonSet.set_name_original,
        "series": PokemonSet.series,
        "release_year": PokemonSet.release_year,
        "total_cards": PokemonSet.total_cards,
        "series_order": PokemonSet.series_order,
        "created_at": PokemonSet.created_at,
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
@router.get("/all", response_model=List[PokemonSetOut])
def get_all_pokemon_sets(db: Session = Depends(get_db)):
    return db.query(PokemonSet).order_by(PokemonSet.series_order).all()

@router.post("/filter", response_model=PaginatedPokemonSet)
def filter_pokemon_sets(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("series_order", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PokemonSet)
    # thêm xử lý sort
    valid_sort_fields = {
        "set_id": PokemonSet.set_id,
        "set_name_en": PokemonSet.set_name_en,
        "set_name_original": PokemonSet.set_name_original,
        "series": PokemonSet.series,
        "release_year": PokemonSet.release_year,
        "total_cards": PokemonSet.total_cards,
        "series_order": PokemonSet.series_order,
        "created_at": PokemonSet.created_at,
    }
    # Áp dụng các bộ lọc từ filter_request
    for filter in filter_request.filters:
        field = getattr(PokemonSet, filter.field, None)
        if field is not None:
            # Nếu trường là số, ép kiểu value sang số
            col_type = str(field.type)
            value = filter.value
            if "INTEGER" in col_type or "NUMERIC" in col_type:
                try:
                    value = int(value)
                except Exception:
                    continue  # Bỏ qua filter nếu value không hợp lệ
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
            # Thêm các toán tử khác nếu cần

    
    if sort_field in valid_sort_fields:
        col = valid_sort_fields[sort_field]
        if sort_order == "desc":
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())

    total = query.order_by(None).count()  # loại bỏ order_by khi count để tránh sai số
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    print("DEBUG FILTERS:", filter_request.filters)
    print("DEBUG TOTAL:", total)
    print("DEBUG ITEMS:", len(items))
    return {"items": items, "total": total}

@router.post("/{set_id}/upload-symbol", response_model=PokemonSetOut)
def upload_set_symbol(
    set_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_set = db.query(PokemonSet).filter(PokemonSet.set_id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Set not found")

    # Đảm bảo thư mục tồn tại
    os.makedirs(SYMBOL_SET_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{set_id}_{db_set.set_name_en}".replace(" ", "_").replace("/", "_")
    filename = f"{safe_name}{ext}"
    save_path = os.path.join(SYMBOL_SET_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    db_set.set_symbol_url = f"/symbol_set/{filename}"
    db.commit()
    db.refresh(db_set)
    return db_set