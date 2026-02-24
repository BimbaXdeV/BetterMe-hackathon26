import json
import asyncio
import math
import geopandas as gpd
from shapely.geometry import Point


try:
    with open('ny_taxes.json', 'r', encoding='utf-8') as f:
        TAX_DATA = json.load(f)
except:
    TAX_DATA = {}

# Загружаем карту округов
ny = gpd.read_file('new-york-counties.geojson')

async def calculate_order_tax(lat: float, lon: float, subtotal: float, geojson_path = 'new-york-counties.geojson') -> dict:
    # Создаем точку из координат
    point = Point(lon, lat)

    county_name = 'Вне Нью Йорка'

    # Проверяем, в какой полигон (округ) попадает точка
    for index, row in ny.iterrows():
        if row['geometry'].contains(point):
            county_name = row['name'][:-7]

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