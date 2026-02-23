from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


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
