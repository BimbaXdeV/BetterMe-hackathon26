import sys
import os
import asyncio
from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from auth import router as auth_router
from filtering import Filter

# --- МОДЕЛИ ---
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

class PaginatedOrdersResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    orders_count: int
    total_tax: float
    total_revenue: float

# --- ИМПОРТЫ ЛОГИКИ ---
try:
    from tax_service import calculate_order_tax, calculate_bulk_taxes
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from tax_service import calculate_order_tax, calculate_bulk_taxes

app = FastAPI(title="BetterMe Tax API")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# имитация БД
orders_db = []
filtered_orders = []

# Глобальные переменные для кеширования статистики
cached_total_tax = 0.0
cached_total_revenue = 0.0

filter_engine = Filter()

async def refresh_totals():
    """Обновляет кешированную статистику."""
    global cached_total_tax, cached_total_revenue
    
    # Фильтруем базу
    filtered_list = await filter_engine.filter(orders_db)
    filtered_orders[:] = filtered_list[:]
    
    # Считаем суммы
    cached_total_tax = sum(o["tax_amount"] for o in filtered_orders)
    cached_total_revenue = sum(o["total_amount"] for o in filtered_orders)
    return cached_total_tax, cached_total_revenue

@app.get('/')
async def root(): # Сделали асинхронным
    return {
        'status': 'BetterMe API is running', 
        'orders_count': len(orders_db),
        'total_tax': round(cached_total_tax, 2),
        'total_revenue': round(cached_total_revenue, 2)
    }

@app.get('/orders', response_model=PaginatedOrdersResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    county: Optional[str] = None,
    min_subtotal: Optional[float] = None,
    min_tax: Optional[float] = None,
    min_rate: Optional[float] = None,
    to_show_errors: bool = False
):
    # Фильтруем базу данных согласно параметрам
    current_filtered = await filter_engine.filter(
        orders_db, county=county, min_subtotal=min_subtotal, 
        min_tax=min_tax, min_rate=min_rate, to_show_errors=to_show_errors
    )

    filtered_tax_sum = sum(o["tax_amount"] for o in current_filtered)
    filtered_revenue_sum = sum(o["total_amount"] for o in current_filtered)
    # -------------------------------------------------------------

    total_count = len(current_filtered)
    start = (page - 1) * limit
    end = start + limit
    
    paginated_items = current_filtered[start:end]
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return {
        "orders": paginated_items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "orders_count": len(orders_db),
        "total_tax": round(filtered_tax_sum, 2),
        "total_revenue": round(filtered_revenue_sum, 2)
    }

@app.post('/orders', response_model=OrderResponse)
async def create_order(order: Order):
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
            "breakdown": tax_data["breakdown"],
            "jurisdictions": ", ".join(tax_data["jurisdictions"]),
            "isInNewYork": tax_data["isInNewYork"]
        }
        
        orders_db.append(new_order_data)
        
       
        await refresh_totals()
       
        new_order_data['orders_count'] = len(orders_db)
        new_order_data['total_tax'] = round(cached_total_tax, 2)
        new_order_data['total_revenue'] = round(cached_total_revenue, 2)
        
        return new_order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/orders/import', response_model=List[OrderResponse])
async def import_orders(orders: List[Order]):
    print(f"--- Старт импорта: {len(orders)} строк ---")
    start_time = datetime.now()
    
    orders_list = [o.model_dump() for o in orders]
    
    try:
        all_tax_data = await calculate_bulk_taxes(orders_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    final_results = []
    current_len = len(orders_db)
    
    
    for i, (order_obj, tax_data) in enumerate(zip(orders, all_tax_data)):
        order_time = order_obj.timestamp if isinstance(order_obj.timestamp, datetime) else datetime.now()
        
        processed_order = {
            "id": current_len + i + 1,
            "latitude": order_obj.latitude,
            "longitude": order_obj.longitude,
            "subtotal": order_obj.subtotal,
            "timestamp": order_time,
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

    
    await refresh_totals()

    duration = (datetime.now() - start_time).total_seconds()
    print(f"--- Импорт завершен за {duration:.2f} сек. ---")
    return final_results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)