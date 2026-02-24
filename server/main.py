import sys
import os
import asyncio
from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
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

orders_db = []

@app.get('/')
def root():
    return {'status': 'BetterMe API is running', 'orders_count': len(orders_db)}

@app.get('/orders', response_model=List[OrderResponse])
async def get_orders():
    return orders_db

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
    
    # Подготовка данных для Spatial Join
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