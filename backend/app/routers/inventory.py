from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
    PaginatedInventory,
)
from app.schemas.filter import FilterRequest
from app.models import Inventory, PokemonCardMaster
from app.database import get_db
import os
from PIL import Image

# import io
# import torch
# from unsloth import FastVisionModel
# from transformers import BitsAndBytesConfig
from app.routers.market_price import create_market_price, MarketPriceCreate
# from card_recognizer import ocr_paddleocr
router = APIRouter(prefix="/inventory", tags=["Inventory"])
INVENTORY_IMAGE_DIR = os.path.abspath("d:/Pokemon/frontend/pokemon/public/inventory_images")
# Thêm mới
# === Load model ===
# print("🔄 Loading model... (This may take ~1 minute)")

# base_model = "unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit"
# lora_model_path = "./lora_pokemon_model"

# # Cấu hình 4-bit + CPU offload
# bnb_config = BitsAndBytesConfig(
#     load_in_4bit=True,
#     llm_int8_enable_fp32_cpu_offload=True,
# )

# model, tokenizer = FastVisionModel.from_pretrained(
#     base_model,
#     quantization_config=bnb_config,
#     device_map="auto",
#     use_gradient_checkpointing="unsloth",
# )

# # Load adapter LoRA
# model.load_adapter(lora_model_path)
# FastVisionModel.for_inference(model)

# print("✅ Model loaded and ready!")

@router.post("/", response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory(data: InventoryCreate, db:
    Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    db_item = Inventory(**data_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Gọi trực tiếp hàm tạo market price chỉ với master_card_id
    try:
        create_market_price(
            master_card_id=db_item.master_card_id,
            db=db,
            url=None
        )
    except Exception as e:
        print("Crawl pricecharting error:", e)

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
    # Trả về inventory kèm thông tin card
    return db.query(Inventory).options(joinedload(Inventory.card)).filter(Inventory.inventory_id == db_item.inventory_id).first()

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
    sort_field: Optional[str] = Query("inventory_id", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(Inventory).join(PokemonCardMaster, Inventory.master_card_id == PokemonCardMaster.master_card_id).options(joinedload(Inventory.card))
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
    return db.query(Inventory).options(joinedload(Inventory.card)).order_by(Inventory.date_added).all()

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


from fastapi import UploadFile, File
from fastapi.responses import JSONResponse
from app.models import PokemonCardMaster
# @router.post("/scan-card/")
# async def scan_card_to_inventory(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     image_bytes = await file.read()
#     extracted_data = ocr_paddleocr.process_pokemon_card(image_bytes)
#     if extracted_data.get("name") == "Lỗi":
#         raise HTTPException(status_code=500, detail="Không thể xử lý ảnh.")

#     card_name = extracted_data.get("name")
#     card_number = extracted_data.get("card_number")
#     results = db.query(PokemonCardMaster).filter(
#         PokemonCardMaster.card_number.ilike(f"%{card_number}%")
#     ).all()
#     if not results:
#         results = db.query(PokemonCardMaster).filter(
#             PokemonCardMaster.name_en.ilike(f"%{card_name}%")
#         ).all()
#     # Chuyển kết quả sang dict (chỉ lấy các trường cần thiết)
#     results_dict = [
#         {
#             "master_card_id": r.master_card_id,
#             "name_en": r.name_en,
#             "card_number": r.card_number,
#         }
#         for r in results
#     ]
#     return JSONResponse(content={"card_name": card_name, "card_number": card_number, "results": results_dict})

# @router.post("/predict")
# async def predict_card(file: UploadFile = File(...)):
#     try:
#         # Đọc file ảnh
#         image_bytes = await file.read()
#         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

#         # Tạo prompt để model hiểu nhiệm vụ
#         prompt = "Extract the English Pokémon card name and card number from this image."

#         # Thực hiện suy luận
#         output = model.chat(
#             tokenizer,
#             image=image,
#             query=prompt,
#             max_new_tokens=150,
#         )

#         return JSONResponse({
#             "filename": file.filename,
#             "result": output
#         })

#     except Exception as e:
#         return JSONResponse({
#             "error": str(e)
#         }, status_code=500)
