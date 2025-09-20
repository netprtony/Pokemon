from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    pokemon_set_router,
    pokemon_card_router,
    market_price_router,
    order_detail_router,
    order_router,
    inventory_router,
    price_alert_router,
)  
app = FastAPI()


# ✅ Cấu hình CORS:
origins = [
    "http://localhost:3000",  # React Vite FE
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn (thay đổi theo nhu cầu)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(pokemon_set_router)
app.include_router(pokemon_card_router)
app.include_router(market_price_router)
app.include_router(order_detail_router)
app.include_router(order_router)
app.include_router(inventory_router)
app.include_router(price_alert_router)
@app.get("/")
def read_root():
    return {"message": "CORS đã bật thành công"}

