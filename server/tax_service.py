import json
import asyncio
import math

# Кэш
geocoding_cache = {}

# Центроиды (база координат)
NY_CENTROIDS = {
    # Город Нью-Йорк (5 районов)
    "Bronx": (40.84, -73.86), "Kings": (40.63, -73.94), "New York": (40.78, -73.97),
    "Queens": (40.72, -73.79), "Richmond": (40.57, -74.15),
    
    # Лонг-Айленд и пригороды
    "Nassau": (40.73, -73.58), "Suffolk": (40.88, -72.84), "Westchester": (41.12, -73.79),
    "Rockland": (41.15, -74.02), "Putnam": (41.42, -73.74), "Orange": (41.40, -74.31),
    "Dutchess": (41.77, -73.74), "Sullivan": (41.72, -74.77), "Ulster": (41.89, -74.26),

    # Столичный регион и восток
    "Albany": (42.60, -73.97), "Rensselaer": (42.71, -73.51), "Saratoga": (43.11, -73.86),
    "Schenectady": (42.82, -73.96), "Columbia": (42.24, -73.68), "Greene": (42.28, -74.12),
    "Warren": (43.56, -73.84), "Washington": (43.32, -73.43),

    # Центр и Южный ярус
    "Broome": (42.15, -75.83), "Chenango": (42.49, -75.54), "Cortland": (42.59, -76.08),
    "Delaware": (42.19, -74.96), "Otsego": (42.63, -74.97), "Schoharie": (42.59, -74.44),
    "Tioga": (42.17, -76.30), "Tompkins": (42.45, -76.47), "Chemung": (42.13, -76.76),
    "Schuyler": (42.39, -76.87), "Steuben": (42.38, -77.38),

    # Запад (Баффало, Рочестер, Фингер-Лейкс)
    "Erie": (42.88, -78.77), "Niagara": (43.20, -78.79), "Chautauqua": (42.22, -79.31),
    "Cattaraugus": (42.24, -78.67), "Allegany": (42.25, -78.02), "Genesee": (43.00, -78.19),
    "Wyoming": (42.70, -78.22), "Orleans": (43.25, -78.23), "Monroe": (43.15, -77.61),
    "Livingston": (42.73, -77.77), "Ontario": (42.85, -77.30), "Seneca": (42.78, -76.88),
    "Wayne": (43.15, -77.05), "Yates": (42.64, -77.10), "Cayuga": (42.94, -76.56),

    # Сиракьюс и Север
    "Onondaga": (43.01, -76.20), "Madison": (42.91, -75.67), "Oneida": (43.24, -75.44),
    "Herkimer": (43.43, -74.96), "Fulton": (43.11, -74.42), "Montgomery": (42.90, -74.44),
    "Clinton": (44.74, -73.55), "Franklin": (44.59, -74.30), "St. Lawrence": (44.49, -75.07),
    "Jefferson": (43.99, -75.89), "Lewis": (43.78, -75.45), "Essex": (44.11, -73.68),
    "Hamilton": (43.66, -74.40), "Oswego": (43.46, -76.20)
}

try:
    with open('ny_taxes.json', 'r', encoding='utf-8') as f:
        TAX_DATA = json.load(f)
except:
    TAX_DATA = {}

async def calculate_order_tax(lat: float, lon: float, subtotal: float) -> dict:
   
    cache_key = (round(lat, 3), round(lon, 3))
    
    if cache_key in geocoding_cache:
        county_name = geocoding_cache[cache_key]
    else:
       
        closest_county = "New York"
        min_dist = float('inf')
        
        for county, coords in NY_CENTROIDS.items():
            # Квадрат расстояния 
            dist = (lat - coords[0])**2 + (lon - coords[1])**2
            if dist < min_dist:
                min_dist = dist
                closest_county = county
        
        county_name = closest_county
        geocoding_cache[cache_key] = county_name

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