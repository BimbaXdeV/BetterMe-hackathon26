import json
import httpx
import asyncio

# Кэш в оперативной памяти: {(lat, lon): "County Name"}
geocoding_cache = {}

# Подгружаем JSON с налоговыми ставками
try:
    with open('ny_taxes.json', 'r', encoding='utf-8') as f:
        TAX_DATA = json.load(f)
except FileNotFoundError:
    print("Критическая ошибка: файл ny_taxes.json не найден!")
    TAX_DATA = {}

async def calculate_order_tax(lat: float, lon: float, subtotal: float) -> dict:
    # 1. КЭШИРОВАНИЕ: Округляем до 3 знаков (точность ~110 метров). 
    # Это позволит сгруппировать тысячи заказов в сотни уникальных локаций.
    cache_key = (round(lat, 3), round(lon, 3))
    
    clean_county_name = ""
    
    if cache_key in geocoding_cache:
        clean_county_name = geocoding_cache[cache_key]
    else:
        # 2. ОГРАНИЧЕНИЕ: Если данных нет в кэше, идем в API
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "BetterMe-Hackathon-App/1.0 (Student Project)"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Добавляем небольшую задержку, чтобы API нас не забанило при массовой загрузке
                # Если файл очень большой, Nominatim требует паузу 1 сек между запросами.
                # Для хакатона оставим 0.1, но если будут ошибки 429 — увеличь до 1.0.
                await asyncio.sleep(0.1) 
                
                response = await client.get(url, headers=headers)
                
                if response.status_code == 429:
                    print("ВНИМАНИЕ: Nominatim заблокировал запросы (Too Many Requests)")
                    clean_county_name = "New York" # Включаем фолбэк при блокировке
                else:
                    response.raise_for_status()
                    data = response.json()
                    address = data.get("address", {})
                    county = address.get("county")

                    # Фолбэк для центра Нью-Йорка
                    if not county and address.get("city") == "New York":
                        county = "New York"

                    clean_county_name = county.replace(" County", "") if county else ""
                    
                    # Сохраняем в кэш
                    geocoding_cache[cache_key] = clean_county_name

        except Exception as e:
            print(f"Geocoding error for {lat}, {lon}: {e}")
            clean_county_name = "" # Оставляем пустым для применения дефолтной ставки

    # 3. ПОИСК СТАВКИ В JSON
    tax_info = TAX_DATA.get(clean_county_name)

    # Если округ не найден или ошибка API — применяем дефолтные 8%
    if not tax_info:
        default_rate = 0.08
        tax_amount = round(subtotal * default_rate, 2)
        return {
            "composite_tax_rate": default_rate,
            "tax_amount": tax_amount,
            "total_amount": round(subtotal + tax_amount, 2),
            "breakdown": {
                "state_rate": 0.04,
                "county_rate": 0.04,
                "city_rate": 0,
                "special_rates": 0
            },
            "jurisdictions": ["New York State (Default)"]
        }

    # Считаем налоги на основе данных из JSON
    tax_amount = round(subtotal * tax_info["composite_rate"], 2)
    total_amount = round(subtotal + tax_amount, 2)

    return {
        "composite_tax_rate": tax_info["composite_rate"],
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "breakdown": {
            "state_rate": tax_info["state_rate"],
            "county_rate": tax_info["county_rate"],
            "city_rate": 0,
            "special_rates": tax_info.get("special_rate", 0)
        },
        "jurisdictions": [clean_county_name, "New York State"]
    }