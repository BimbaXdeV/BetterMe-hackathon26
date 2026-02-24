import json
import asyncio
import math
import geopandas as gpd
from shapely.geometry import Point

_cache = {
    "gdf": None,
    "json": None
}
_lock = asyncio.Lock()
_lock = asyncio.Lock()


async def get_all_data(gdf_path, json_path):
    async with _lock:
        # Загружаем GeoPandas, если еще не загружен
        if _cache["gdf"] is None:
            _cache["gdf"] = await asyncio.to_thread(gpd.read_file, gdf_path)
            print('Читаем геофайл')

        # Загружаем JSON, если еще не загружен
        if _cache["json"] is None:
            def load_json():
                with open(json_path, 'r', encoding='utf-8') as f:
                    print('Читаем джсон')
                    return json.load(f)

            _cache["json"] = await asyncio.to_thread(load_json)

    return _cache["gdf"], _cache["json"]

async def calculate_order_tax(lat: float, lon: float, subtotal: float) -> dict:
    ny, TAX_DATA = await get_all_data('new-york-counties.geojson', 'ny_taxes.json')
    # Создаем точку из координат
    point = Point(lon, lat)

    county_name = 'Вне Нью Йорка'

    # Проверяем, в какой полигон (округ) попадает точка
    for index, row in ny.iterrows():
        if row['geometry'].contains(point):
            county_name = row['name'][:-7]

    print(point, county_name)

    # данные из JSON
    tax_info = TAX_DATA.get(county_name, {
        "composite_rate": 0.08, "state_rate": 0.04, "county_rate": 0.04, "special_rate": 0
    })

    tax_amount = round(subtotal * tax_info["composite_rate"], 2)
    
    return {
        "composite_tax_rate": tax_info["composite_rate"],
        "tax_amount": tax_amount,
        "total_amount": round(subtotal + tax_amount, 2),
        "breakdown": {
            "state_rate": tax_info["state_rate"],
            "county_rate": tax_info["county_rate"],
            "city_rate": 0,
            "special_rates": tax_info.get("special_rate", 0)
        },
        "jurisdictions": [county_name, "New York State"]
    }
    
###########################################################################################
#                                                                                         #
#   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗██╗  ██╗██╗   ██╗██████╗              #
#  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██║   ██║██╔══██╗             #
#  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║██║   ██║██████╔╝             #
#  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║██║   ██║██╔══██╗             #
#  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║╚██████╔╝██████╔╝             #
#   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝              #
###########################################################################################