import json
import httpx

# подгружаем JSON
with open('ny_taxes.json', 'r', encoding='utf-8') as f:
    TAX_DATA = json.load(f)

async def calculate_order_tax(lat: float, lon: float, subtotal: float) -> dict:
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {"User-Agent": "InstantWellnessKits/1.0 (FastAPI Hackathon App)"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

        # округ
        address = data.get("address", {})
        county = address.get("county")

        # фолбэк для центра Нью-Йорка
        if not county and address.get("city") == "New York":
            county = "New York"

        # убираем слово "Country"
        clean_county_name = county.replace(" County", "") if county else ""

        # ищем ключ в JSON
        tax_info = TAX_DATA.get(clean_county_name)

        # фолбэк, если округ не найден
        if not tax_info:
            print(f"Округ {clean_county_name} не найден. Применяем 8%.")
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

        # считаем налоги (округляем до 2 знаков)
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
                "special_rates": tax_info["special_rate"]
            },
            "jurisdictions": [clean_county_name, "New York State"]
        }

    except Exception as e:
        print(f"Geocoding error: {e}")
        raise Exception("Failed to calculate tax for these coordinates")