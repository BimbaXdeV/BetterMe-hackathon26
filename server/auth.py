import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# --- ЛОГИКА ОПРЕДЕЛЕНИЯ ПУТИ: Ищем ключи от замка ---
# Находим папку server/ и наш секретный список админов
current_dir = os.path.dirname(os.path.abspath(__file__))
admins_path = os.path.join(current_dir, 'Admins.json')

# Пытаемся загрузить список избранных
fake_users = {}
if os.path.exists(admins_path):
    try:
        with open(admins_path, 'r', encoding='utf-8') as f:
            fake_users = json.load(f)
        print(f"✅ База админов загружена: {len(fake_users)} пользователей.")
    except Exception as e:
        print(f"❌ ОШИБКА: JSON битый или пустой {admins_path}: {e}")
else:
    # На хакатоне это обычно означает, что кто-то забыл сделать git add для JSON-файла
    print(f"⚠️ ВНИМАНИЕ: Файл {admins_path} не найден! Вход будет невозможен.")

# --- МОДЕЛИ: Чтобы FastAPI знал, что мы ждем на вход ---
class LoginRequest(BaseModel):
    username: str
    password: str

# --- ЭНДПОИНТЫ: Пропускной пункт ---
@router.post("/login")
async def login(request: LoginRequest):
    """
    Проверяем учетки. 
    Помни: хранить пароли в открытом JSON — это грех, но для хакатона сойдет!
    """
    # Проверяем наличие пользователя
    stored_password = fake_users.get(request.username)
    
    if stored_password and stored_password == request.password:
        # Если пароль совпал — открываем ворота
        return {
            "success": True, 
            "message": f"Вітаємо, {request.username}! Доступ дозволено."
        }
    
    # Если юзер ошибся — вежливо (или не очень) отказываем
    print(f"Неудачная попытка входа: {request.username}")
    raise HTTPException(
        status_code=401, 
        detail="Невірний логін або пароль. Спробуйте ще раз!"
    )