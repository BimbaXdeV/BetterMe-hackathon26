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
        
        # Проверка даты
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
        print(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/orders/bulk', response_model=List[OrderResponse])
async def create_orders_bulk(orders: List[Order]):
    """
    Ускоренная обработка больших файлов.
    Обрабатывает заказы пачками одновременно.
    """
    print(f"--- Начинаю импорт {len(orders)} строк ---")
    
    results = []
    chunk_size = 100
    
    for i in range(0, len(orders), chunk_size):
        chunk = orders[i : i + chunk_size]
        
        # Создаем задачи
        tasks = [calculate_order_tax(o.latitude, o.longitude, o.subtotal) for o in chunk]
        
        # Выполняем пачку
        chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for order, tax_data in zip(chunk, chunk_results):
            # Если в конкретной строке ошибка — скипаем её, а не весь файл
            if isinstance(tax_data, Exception) or not tax_data:
                continue
            
            # Валидация времени
            order_time = order.timestamp if isinstance(order.timestamp, datetime) else datetime.now()

            new_id = len(orders_db) + 1
            processed_order = {
                "id": new_id,
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
            orders_db.append(processed_order)
            results.append(processed_order)
        
        # прогресс в консоль раз в 1000 строк
        if (i + chunk_size) % 1000 == 0 or i + chunk_size >= len(orders):
            print(f"Прогресс: {min(i + chunk_size, len(orders))} из {len(orders)} (chunk: {chunk_size})")

    print(f"--- Импорт завершен успешно. Всего заказов: {len(orders_db)} ---")
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
    
    
###########################################################################################
#                                                                                         #
#   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗██╗  ██╗██╗   ██╗██████╗              #
#  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██║   ██║██╔══██╗             #
#  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║██║   ██║██████╔╝             #
#  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║██║   ██║██╔══██╗             #
#  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║╚██████╔╝██████╔╝             #
#   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝              #
###########################################################################################