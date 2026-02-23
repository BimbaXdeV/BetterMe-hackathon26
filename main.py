from server.connector import AsyncSQLiteConnector
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
    raw_orders = await db.fetch_all('SELECT * FROM transactions WHERE subtotal >= ? ORDER BY id ASC LIMIT ? OFFSET ?', (min_total or 0, offset, limit))

    completed_orders = []
    for o in raw_orders:
        tax_data = await calculate_order_tax(o['latitude'], o['longitude'], o['subtotal'])
        order = {
            **o,
            "composite_tax_rate": tax_data["composite_rate"],
            "tax_amount": tax_data["tax_amount"],
            "total_amount": o['subtotal'] + tax_data["tax_amount"],
            "state_rate": tax_data["state_rate"],
            "county_rate": tax_data["county_rate"],
            "city_rate": tax_data["city_rate"],
            "special_rates": tax_data["special_rates"],
            "jurisdictions": tax_data["jurisdiction_name"]
        }
        completed_orders.append(order)
    return completed_orders


@app.post('/orders', response_model=List[OrderResponse])
async def create_order(order: Order):
    tax_data = await calculate_order_tax(order.latitude, order.longitude, order.subtotal)

    last_id = await db.fetch_one('SELECT id FROM transactions ORDER BY DESC')
    print(last_id)
    created_timestamp = order.timestamp or datetime.now()
    await db.execute_query('INSERT INTO transactions(id, longitude, latitude, timestamp, subtotal) VALUES(?, ?, ?, ?)', (last_id + 1, order.longitude, order.latitude, str(created_timestamp), order.subtotal))
    new_order_response = {
        "id": last_id + 1,
        "latitude": order.latitude,
        "longitude": order.longitude,
        "subtotal": order.subtotal,
        "timestamp": created_timestamp,
        "composite_tax_rate": tax_data["composite_rate"],
        "tax_amount": tax_data["tax_amount"],
        "total_amount": order.subtotal + tax_data["tax_amount"],
        "state_rate": tax_data["state_rate"],
        "county_rate": tax_data["county_rate"],
        "city_rate": tax_data["city_rate"],
        "special_rates": tax_data["special_rates"],
        "jurisdictions": tax_data["jurisdiction_name"]
    }
    return new_order_response

