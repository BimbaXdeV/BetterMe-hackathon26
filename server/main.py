import sys
import os
import asyncio
import pandas as pd
from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --- МОДЕЛИ ---
class Order(BaseModel):
    latitude: float
    longitude: float
    subtotal: float
    timestamp: Optional[Union[datetime, str]] = None

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

# Модель для ответа с пагинацией
class PaginatedOrdersResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int

# --- ИМПОРТЫ ЛОГИКИ ---
try:
    from tax_service import calculate_order_tax, calculate_bulk_taxes
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from tax_service import calculate_order_tax, calculate_bulk_taxes

app = FastAPI(title="BetterMe Tax API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# имитация БД
orders_db = []

@app.get('/')
def root():
    """Возвращает общую статистику по всей базе заказов."""
    total_tax = sum(o["tax_amount"] for o in orders_db)
    total_revenue = sum(o["total_amount"] for o in orders_db)
    
    return {
        'status': 'BetterMe API is running', 
        'orders_count': len(orders_db),
        'total_tax': round(total_tax, 2),
        'total_revenue': round(total_revenue, 2)
    }

@app.get('/orders', response_model=PaginatedOrdersResponse)
async def get_orders(
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(50, ge=1, le=100, description="Количество заказов на страницу"),
    county: Optional[str] = None,
    min_subtotal: Optional[float] = None,
    min_tax: Optional[float] = None,
    min_rate: Optional[float] = None
):
    df = pd.DataFrame(orders_db)

    # Создаем маску (набор условий)
    mask = True

    if None != county:
        mask &= df['jurisdictions'].str.contains(county)
    if None != min_subtotal:
        mask &= df['subtotal'] >= min_subtotal
    if None != min_tax:
        mask &= df['tax_amount'] >= min_tax
    if None != min_rate:
        mask &= df['composite_tax_rate'] >= min_rate

    try:
        filtered_orders = df[mask].to_dict('records')
    except:
        filtered_orders = orders_db

    """Получение списка заказов с пагинацией."""
    total_count = len(filtered_orders)
    start = (page - 1) * limit
    end = start + limit
    
    paginated_items = filtered_orders[start:end]
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return {
        "orders": paginated_items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@app.post('/orders', response_model=OrderResponse)
async def create_order(order: Order):
    """Создание одного заказа (из ручной формы)."""
    try:
        tax_data = await calculate_order_tax(order.latitude, order.longitude, order.subtotal)
        order_time = order.timestamp if isinstance(order.timestamp, datetime) else datetime.now()

        new_order_data = {
            "id": len(orders_db) + 1,
            "latitude": order.latitude,
            "longitude": order.longitude,
            "subtotal": order.subtotal,
            "timestamp": order_time,
            "composite_tax_rate": tax_data["composite_tax_rate"],
            "tax_amount": tax_data["tax_amount"],
            "total_amount": tax_data["total_amount"],
            "state_rate": tax_data["breakdown"]["state_rate"],
            "county_rate": tax_data["breakdown"]["county_rate"],
            "city_rate": tax_data["breakdown"]["city_rate"],
            "special_rates": tax_data["breakdown"]["special_rates"],
            "jurisdictions": ", ".join(tax_data["jurisdictions"])
        }
        orders_db.append(new_order_data)
        return new_order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/orders/bulk', response_model=List[OrderResponse])
async def create_orders_bulk(orders: List[Order]):
    """Массовый импорт с использованием векторизации GeoPandas."""
    print(f"--- Старт массового импорта: {len(orders)} строк ---")
    start_time = datetime.now()
    
    orders_list = [o.dict() for o in orders]
    
    try:
        all_tax_data = await calculate_bulk_taxes(orders_list)
    except Exception as e:
        print(f"Ошибка в bulk-обработке: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    final_results = []
    for order_obj, tax_data in zip(orders, all_tax_data):
        order_time = order_obj.timestamp if isinstance(order_obj.timestamp, datetime) else datetime.now()
        
        processed_order = {
            "id": len(orders_db) + 1,
            "latitude": order_obj.latitude,
            "longitude": order_obj.longitude,
            "subtotal": order_obj.subtotal,
            "timestamp": order_time,
            **tax_data,
            "state_rate": tax_data["breakdown"]["state_rate"],
            "county_rate": tax_data["breakdown"]["county_rate"],
            "city_rate": tax_data["breakdown"]["city_rate"],
            "special_rates": tax_data["breakdown"]["special_rates"],
            "jurisdictions": ", ".join(tax_data["jurisdictions"])
        }
        orders_db.append(processed_order)
        final_results.append(processed_order)

    duration = (datetime.now() - start_time).total_seconds()
    print(f"--- Успешно! Обработано за {duration:.2f} сек. ---")
    return final_results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)