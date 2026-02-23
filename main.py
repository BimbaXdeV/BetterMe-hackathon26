from tax_service import calculate_order_tax

from server.models import *
from server.api import *


@app.get('/')
def root():
    return {'Invalid': 'Hello World!(print)'}


@app.get('/orders', response_model=List[OrderResponse])
async def get_orders(
    offset: int = 0,
    limit: int = 50,
    min_total: Optional[float] = None
):
    # there will be a request to the database
    return {}


@app.post('/orders', response_model=List[OrderResponse])
async def create_order(order: Order):
    tax_data = await calculate_order_tax(order.latitude, order.longitude, order.subtotal)

