from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.pokemon_card import (
    PokemonCardBase,
    PokemonCardCreate,
    PokemonCardUpdate,
    PokemonCardOut,
    PaginatedPokemonCard,
)
from app.schemas.filter import FilterRequest
from app.models import PokemonCardMaster
from app.database import get_db
import os

router = APIRouter(prefix="/pokemon-cards", tags=["Pokemon Cards"])
CARD_IMAGE_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/card_images")

# Thêm mới
@router.post("/", response_model=PokemonCardOut, status_code=status.HTTP_201_CREATED)
def create_pokemon_card(data: PokemonCardCreate, db: Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    db_card = PokemonCardMaster(**data_dict)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

# Sửa
@router.put("/{master_card_id}", response_model=PokemonCardOut)
def update_pokemon_card(master_card_id: str, data: PokemonCardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(PokemonCardMaster).filter(PokemonCardMaster.master_card_id == master_card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_card, key, value)
    db.commit()
    db.refresh(db_card)
    return db_card

# Xóa
@router.delete("/{master_card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pokemon_card(master_card_id: str, db: Session = Depends(get_db)):
    db_card = db.query(PokemonCardMaster).filter(PokemonCardMaster.master_card_id == master_card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(db_card)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedPokemonCard)
def get_pokemon_cards(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: str = Query(None, description="Từ khóa tìm kiếm tên thẻ"),
    sort_field: Optional[str] = Query("release_year", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PokemonCardMaster)
    if search:
        query = query.filter(
            PokemonCardMaster.name_en.ilike(f"%{search}%")
            | PokemonCardMaster.name_original.ilike(f"%{search}%")
            | PokemonCardMaster.rarity.ilike(f"%{search}%")
            | PokemonCardMaster.set_id.ilike(f"%{search}%")
            | PokemonCardMaster.card_number.ilike(f"%{search}%")
        )
    valid_sort_fields = {
        "master_card_id": PokemonCardMaster.master_card_id,
        "set_id": PokemonCardMaster.set_id,
        "card_number": PokemonCardMaster.card_number,
        "name_en": PokemonCardMaster.name_en,
        "release_year": PokemonCardMaster.release_year,
        "rarity": PokemonCardMaster.rarity,
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
@router.get("/all", response_model=List[PokemonCardOut])
def get_all_pokemon_cards(db: Session = Depends(get_db)):
    return db.query(PokemonCardMaster).order_by(PokemonCardMaster.release_year).all()

# Filter nâng cao
@router.post("/filter", response_model=PaginatedPokemonCard)
def filter_pokemon_cards(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("release_year", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PokemonCardMaster)
    valid_sort_fields = {
        "master_card_id": PokemonCardMaster.master_card_id,
        "set_id": PokemonCardMaster.set_id,
        "card_number": PokemonCardMaster.card_number,
        "name_en": PokemonCardMaster.name_en,
        "release_year": PokemonCardMaster.release_year,
        "rarity": PokemonCardMaster.rarity,
    }
    for filter in filter_request.filters:
        field = getattr(PokemonCardMaster, filter.field, None)
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

# Upload hình cho reference_image_url
@router.post("/{master_card_id}/upload-image", response_model=PokemonCardOut)
def upload_card_image(
    master_card_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_card = db.query(PokemonCardMaster).filter(PokemonCardMaster.master_card_id == master_card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")

    os.makedirs(CARD_IMAGE_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{master_card_id}_{db_card.name_en}".replace(" ", "_").replace("/", "_")
    filename = f"{safe_name}{ext}"
    save_path = os.path.join(CARD_IMAGE_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    db_card.reference_image_url = f"/card_images/{filename}"
    db.commit()
    db.refresh(db_card)
    return db_card