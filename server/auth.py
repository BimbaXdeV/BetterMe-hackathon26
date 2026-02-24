from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json

router = APIRouter()

with open('Admins.env', 'r', encoding='utf-8') as f:
    fake_users = json.loads(f.read())

print(fake_users)

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    if fake_users.get(request.username) == request.password:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid credentials")