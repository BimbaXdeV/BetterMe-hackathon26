import sys
import os
import asyncio
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --- МОДЕЛИ ---
class Order(BaseModel):
    latitude: float
    longitude: float
    subtotal: float
    timestamp: Optional[datetime] = None

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

# --- ИМПОРТ СЕРВИСА ---
try:
    from tax_service import calculate_order_tax
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from tax_service import calculate_order_tax

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
    try:
        tax_data = await calculate_order_tax(order.latitude, order.longitude, order.subtotal)
        
        new_order_data = {
            "id": len(orders_db) + 1,
            "latitude": order.latitude,
            "longitude": order.longitude,
            "subtotal": order.subtotal,
            "timestamp": order.timestamp or datetime.now(),
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
        print(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/orders/bulk', response_model=List[OrderResponse])
async def create_orders_bulk(orders: List[Order]):
    """
    Ускоренная обработка больших файлов.
    Обрабатывает заказы пачками по 50 штук одновременно.
    """
    print(f"--- Начинаю импорт {len(orders)} строк ---")
    
    results = []
    chunk_size = 50  # Размер пачки для параллельной обработки
    
    for i in range(0, len(orders), chunk_size):
        chunk = orders[i : i + chunk_size]
        
        # Создаем список задач для текущей пачки
        tasks = [calculate_order_tax(o.latitude, o.longitude, o.subtotal) for o in chunk]
        
        # Запускаем расчеты пачки параллельно
        chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for order, tax_data in zip(chunk, chunk_results):
            if isinstance(tax_data, Exception):
                continue
            
            new_id = len(orders_db) + 1
            processed_order = {
                "id": new_id,
                "latitude": order.latitude,
                "longitude": order.longitude,
                "subtotal": order.subtotal,
                "timestamp": order.timestamp or datetime.now(),
                "composite_tax_rate": tax_data["composite_tax_rate"],
                "tax_amount": tax_data["tax_amount"],
                "total_amount": tax_data["total_amount"],
                "state_rate": tax_data["breakdown"]["state_rate"],
                "county_rate": tax_data["breakdown"]["county_rate"],
                "city_rate": tax_data["breakdown"]["city_rate"],
                "special_rates": tax_data["breakdown"]["special_rates"],
                "jurisdictions": ", ".join(tax_data["jurisdictions"])
            }
            orders_db.append(processed_order)
            results.append(processed_order)
        
        print(f"Обработано: {min(i + chunk_size, len(orders))} из {len(orders)}")

    print(f"--- Импорт завершен. Всего в базе: {len(orders_db)} ---")
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)