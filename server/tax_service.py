import json
import asyncio
import os
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

# --- ОПРЕДЕЛЕНИЕ ПУТЕЙ (Критически важно для Heroku) ---
# Получаем абсолютный путь к папке, где лежит этот файл
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
GEOJSON_PATH = os.path.join(CURRENT_DIR, 'new-york-counties.geojson')
TAX_JSON_PATH = os.path.join(CURRENT_DIR, 'ny_taxes.json')

_cache = {"gdf": None, "json": None}
_lock = asyncio.Lock()

async def get_all_data():
    async with _lock:
        if _cache["gdf"] is None:
            # Используем абсолютный путь для загрузки GeoJSON
            _cache["gdf"] = await asyncio.to_thread(gpd.read_file, GEOJSON_PATH)
        if _cache["json"] is None:
            def load_json():
                # Используем абсолютный путь для загрузки TAX JSON
                with open(TAX_JSON_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            _cache["json"] = await asyncio.to_thread(load_json)
    return _cache["gdf"], _cache["json"]

async def calculate_bulk_taxes(orders_data: list) -> list:
    """
    (Spatial Join) для максимальной скорости.
    """
    # Вызываем данные без передачи аргументов, так как пути определены глобально
    ny_map, TAX_DATA = await get_all_data()

    # Конвертация входящих данных в GeoDataFrame
    df = pd.DataFrame(orders_data)
    geometry = [Point(xy) for xy in zip(df.longitude, df.latitude)]
    points_gdf = gpd.GeoDataFrame(df, geometry=geometry, crs=ny_map.crs)

    # Применяем Spatial Join: сопоставляем точки с полигонами округов
    joined = gpd.sjoin(points_gdf, ny_map, how="left", predicate="within")

    results = []
    for _, row in joined.iterrows():
        raw_name = row.get('name')
        if pd.notna(raw_name):
            # Логика выделения имени округа из GeoJSON
            county_name = raw_name[:-7] if raw_name.endswith(' County') else raw_name

            tax_info = TAX_DATA.get(county_name, {
                "composite_rate": 0.08, "state_rate": 0.04, "county_rate": 0.04, "special_rate": 0
            })

            tax_amount = round(row['subtotal'] * tax_info["composite_rate"], 2)

            results.append({
                "composite_tax_rate": tax_info["composite_rate"],
                "tax_amount": tax_amount,
                "total_amount": round(row['subtotal'] + tax_amount, 2),
                "breakdown": {
                    "state_rate": tax_info["state_rate"],
                    "county_rate": tax_info["county_rate"],
                    "city_rate": 0,
                    "special_rates": tax_info.get("special_rate", 0)
                },
                "jurisdictions": [county_name, "New York State"],
                "isInNewYork": True
            })
        else:
            results.append({
                "composite_tax_rate": 0,
                "tax_amount": 0,
                "total_amount": row['subtotal'],
                "breakdown": {
                    "state_rate": 0, "county_rate": 0, "city_rate": 0, "special_rates": 0
                },
                "jurisdictions": ['Поза Нью-Йорком (сума без урахування податків)'],
                "isInNewYork": False
            })
    
    return results

async def calculate_order_tax(lat: float, lon: float, subtotal: float) -> dict:
    """Одиночный расчет для формы ручного ввода."""
    results = await calculate_bulk_taxes([{"latitude": lat, "longitude": lon, "subtotal": subtotal}])
    return results[0]