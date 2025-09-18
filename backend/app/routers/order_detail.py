from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.order_detail import (
    OrderDetailBase,
    OrderDetailCreate,
    OrderDetailUpdate,
    OrderDetailOut,
    PaginatedOrderDetail,
)
from app.schemas.filter import FilterRequest
from app.models import OrderDetail
from app.database import get_db

router = APIRouter(prefix="/order-details", tags=["Order Details"])

# Thêm mới
@router.post("/", response_model=OrderDetailOut, status_code=status.HTTP_201_CREATED)
def create_order_detail(data: OrderDetailCreate, db: Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    db_item = OrderDetail(**data_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Sửa
@router.put("/{detail_id}", response_model=OrderDetailOut)
def update_order_detail(detail_id: int, data: OrderDetailUpdate, db: Session = Depends(get_db)):
    db_item = db.query(OrderDetail).filter(OrderDetail.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Order detail not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# Xóa
@router.delete("/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_detail(detail_id: int, db: Session = Depends(get_db)):
    db_item = db.query(OrderDetail).filter(OrderDetail.detail_id == detail_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Order detail not found")
    db.delete(db_item)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedOrderDetail)
def get_order_details(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo order_id"),
    sort_field: Optional[str] = Query("detail_id", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(OrderDetail)
    if search:
        query = query.filter(OrderDetail.order_id == int(search))
    valid_sort_fields = {
        "detail_id": OrderDetail.detail_id,
        "order_id": OrderDetail.order_id,
        "inventory_id": OrderDetail.inventory_id,
        "quantity_ordered": OrderDetail.quantity_ordered,
        "unit_price": OrderDetail.unit_price,
        "subtotal": OrderDetail.subtotal,
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
@router.get("/all", response_model=List[OrderDetailOut])
def get_all_order_details(db: Session = Depends(get_db)):
    return db.query(OrderDetail).order_by(OrderDetail.detail_id.desc()).all()

# Filter nâng cao
@router.post("/filter", response_model=PaginatedOrderDetail)
def filter_order_details(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("detail_id", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(OrderDetail)
    valid_sort_fields = {
        "detail_id": OrderDetail.detail_id,
        "order_id": OrderDetail.order_id,
        "inventory_id": OrderDetail.inventory_id,
        "quantity_ordered": OrderDetail.quantity_ordered,
        "unit_price": OrderDetail.unit_price,
        "subtotal": OrderDetail.subtotal,
    }
    for filter in filter_request.filters:
        field = getattr(OrderDetail, filter.field, None)
        if field is not None:
            col_type = str(field.type)
            value = filter.value
            if "INTEGER" in col_type or "NUMERIC" in col_type or "FLOAT" in col_type:
                try:
                    value = float(value)
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