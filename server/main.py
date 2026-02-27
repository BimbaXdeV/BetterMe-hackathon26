import sys
import os

# Добавляем текущую директорию в путь, чтобы Python не делал вид, что не знает свои же файлы
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import asyncio
from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

# Наши локальные модули (надеемся, они не упадут в самый ответственный момент)
from auth import router as auth_router
from filtering import Filter

try:
    from tax_service import calculate_order_tax, calculate_bulk_taxes
except ImportError:
    # Повторная попытка для тех, у кого странная структура папок
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from tax_service import calculate_order_tax, calculate_bulk_taxes

app = FastAPI(title="BetterMe Tax API - Hackathon Final Edition")

# CORS: открываем двери всем, потому что на хакатоне нет времени на паранойю
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS: Описываем данные, чтобы Pydantic не ругался ---

class Order(BaseModel):
    latitude: float
    longitude: float
    subtotal: float
    timestamp: Optional[Union[datetime, str]] = None

class TaxBreakdown(BaseModel):
    state_rate: float
    county_rate: float
    city_rate: float
    special_rates: float

class OrderResponse(Order):
    id: int
    composite_tax_rate: float
    tax_amount: float
    total_amount: float
    state_rate: float
    county_rate: float
    city_rate: float
    special_rates: float
    jurisdictions: Optional[str] = None
    breakdown: Optional[TaxBreakdown] = None
    isInNewYork: bool

class PaginatedOrdersResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    orders_count: int
    total_tax: float
    total_revenue: float

# --- DATABASE & ENGINE: Наше временное хранилище ---
# Помним: если Heroku уснет — данные улетят в цифровой рай.
orders_db = []
filter_engine = Filter()

# --- ROUTES: Сами эндпоинты ---

@app.get('/api/stats')
async def get_stats():
    """Отдает общую статистику. Нужна для тех красивых карточек вверху фронта."""
    total_tax = sum(o.get("tax_amount", 0) for o in orders_db)
    total_revenue = sum(o.get("total_amount", 0) for o in orders_db)
    return {
        "orders_count": len(orders_db),
        "total_tax": round(total_tax, 2),
        "total_revenue": round(total_revenue, 2)
    }

@app.get('/orders', response_model=PaginatedOrdersResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    county: Optional[str] = None,
    min_subtotal: Optional[float] = None,
    min_tax: Optional[float] = None,
    min_rate: Optional[float] = None,
    to_show_errors: bool = False):
    """
    Главный рабочий эндпоинт. Тут мы фильтруем, считаем и отдаем заказы.
    Если фронт прислал ставку 8%, мы превращаем её в 0.08 для фильтра.
    """
    actual_min_rate = min_rate / 100.0 if min_rate is not None else None

    # Наш фильтр теперь на чистом Python, должен летать!
    current_filtered = await filter_engine.filter(
        orders_db,
        county=county,
        min_subtotal=min_subtotal,
        min_tax=min_tax,
        min_rate=actual_min_rate, 
        to_show_errors=to_show_errors
    )

    total_count = len(current_filtered)
    start = (page - 1) * limit
    end = start + limit

    # Считаем итоги только для отфильтрованных данных
    filtered_tax = sum(o.get("tax_amount", 0) for o in current_filtered)
    filtered_revenue = sum(o.get("total_amount", 0) for o in current_filtered)

    return {
        "orders": current_filtered[start:end],
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "orders_count": len(orders_db),
        "total_tax": round(filtered_tax, 2),
        "total_revenue": round(filtered_revenue, 2)
    }

@app.post('/orders', response_model=OrderResponse)
async def create_order(order: Order):
    """Создает один заказ. Гео-сервис в этот момент может знатно притормаживать."""
    try:
        tax_data = await calculate_order_tax(order.latitude, order.longitude, order.subtotal)
        
        new_order = {
            "id": len(orders_db) + 1,
            **order.model_dump(),
            "composite_tax_rate": tax_data["composite_tax_rate"],
            "tax_amount": tax_data["tax_amount"],
            "total_amount": tax_data["total_amount"],
            "state_rate": tax_data["breakdown"]["state_rate"],
            "county_rate": tax_data["breakdown"]["county_rate"],
            "city_rate": tax_data["breakdown"]["city_rate"],
            "special_rates": tax_data["breakdown"]["special_rates"],
            "breakdown": tax_data["breakdown"],
            "jurisdictions": ", ".join(tax_data["jurisdictions"]),
            "isInNewYork": tax_data.get("isInNewYork", True)
        }
        
        # Вставляем в начало, чтобы юзер сразу видел свой новый заказ
        orders_db.insert(0, new_order) 
        return new_order
    except Exception as e:
        print(f"Ошибка гео-сервиса: {e}")
        raise HTTPException(status_code=500, detail="Не вдалося розрахувати податок для цих координат.")

@app.post('/orders/import', response_model=List[OrderResponse])
async def import_orders(orders: List[Order]):
    """Пакетный импорт. Когда залетает 20к строк — держитесь крепче!"""
    orders_list = [o.model_dump() for o in orders]
    all_tax_data = await calculate_bulk_taxes(orders_list)
    
    final_results = []
    current_len = len(orders_db)
    
    for i, (order_obj, tax_data) in enumerate(zip(orders, all_tax_data)):
        processed_order = {
            "id": current_len + i + 1,
            **order_obj.model_dump(),
            "composite_tax_rate": tax_data["composite_tax_rate"],
            "tax_amount": tax_data["tax_amount"],
            "total_amount": tax_data["total_amount"],
            "breakdown": tax_data["breakdown"],
            "state_rate": tax_data["breakdown"]["state_rate"],
            "county_rate": tax_data["breakdown"]["county_rate"],
            "city_rate": tax_data["breakdown"]["city_rate"],
            "special_rates": tax_data["breakdown"]["special_rates"],
            "jurisdictions": ", ".join(tax_data["jurisdictions"]),
            "isInNewYork": tax_data["isInNewYork"]
        }
        final_results.append(processed_order)
    
    orders_db.extend(final_results)
    return final_results

# Подключаем авторизацию (чтобы никто чужой не смотрел наши миллионы)
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# --- STATIC FILES: Раздаем фронтенд ---
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_path = os.path.join(base_dir, "client", "dist")

if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

if __name__ == "__main__":
    # Порт для Heroku берем из переменной окружения
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)