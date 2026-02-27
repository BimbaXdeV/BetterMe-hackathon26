from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json

router = APIRouter()

admins = 'Admins.json' #.json файл вида {"Login":"Password"}

with open(admins, 'r', encoding='utf-8') as f:
    fake_users = json.load(f)


class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    if fake_users.get(request.username) == request.password:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid credentials")