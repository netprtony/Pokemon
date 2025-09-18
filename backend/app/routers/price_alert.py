from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.price_alert import (
    PriceAlertBase,
    PriceAlertCreate,
    PriceAlertUpdate,
    PriceAlertOut,
    PaginatedPriceAlert,
)
from app.schemas.filter import FilterRequest
from app.models import PriceAlert
from app.database import get_db

router = APIRouter(prefix="/price-alerts", tags=["Price Alerts"])

# Thêm mới
@router.post("/", response_model=PriceAlertOut, status_code=status.HTTP_201_CREATED)
def create_price_alert(data: PriceAlertCreate, db: Session = Depends(get_db)):
    data_dict = data.dict(exclude_unset=True)
    db_item = PriceAlert(**data_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Sửa
@router.put("/{alert_id}", response_model=PriceAlertOut)
def update_price_alert(alert_id: int, data: PriceAlertUpdate, db: Session = Depends(get_db)):
    db_item = db.query(PriceAlert).filter(PriceAlert.alert_id == alert_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Price alert not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# Xóa
@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price_alert(alert_id: int, db: Session = Depends(get_db)):
    db_item = db.query(PriceAlert).filter(PriceAlert.alert_id == alert_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Price alert not found")
    db.delete(db_item)
    db.commit()
    return

# Lấy danh sách phân trang
@router.get("/", response_model=PaginatedPriceAlert)
def get_price_alerts(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    search: str = Query(None, description="Tìm kiếm theo alert_message"),
    sort_field: Optional[str] = Query("alert_date", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PriceAlert)
    if search:
        query = query.filter(PriceAlert.alert_message.ilike(f"%{search}%"))
    valid_sort_fields = {
        "alert_id": PriceAlert.alert_id,
        "inventory_id": PriceAlert.inventory_id,
        "alert_type": PriceAlert.alert_type,
        "alert_date": PriceAlert.alert_date,
        "price_difference": PriceAlert.price_difference,
        "percentage_change": PriceAlert.percentage_change,
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
@router.get("/all", response_model=List[PriceAlertOut])
def get_all_price_alerts(db: Session = Depends(get_db)):
    return db.query(PriceAlert).order_by(PriceAlert.alert_date.desc()).all()

# Filter nâng cao
@router.post("/filter", response_model=PaginatedPriceAlert)
def filter_price_alerts(
    filter_request: FilterRequest,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, description="Số mục trên mỗi trang"),
    sort_field: Optional[str] = Query("alert_date", description="Trường để sắp xếp"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
):
    query = db.query(PriceAlert)
    valid_sort_fields = {
        "alert_id": PriceAlert.alert_id,
        "inventory_id": PriceAlert.inventory_id,
        "alert_type": PriceAlert.alert_type,
        "alert_date": PriceAlert.alert_date,
        "price_difference": PriceAlert.price_difference,
        "percentage_change": PriceAlert.percentage_change,
    }
    for filter in filter_request.filters:
        field = getattr(PriceAlert, filter.field, None)
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