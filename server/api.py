from server.connector import AsyncSQLiteConnector

from contextlib import asynccontextmanager
from fastapi import FastAPI


db = AsyncSQLiteConnector('BetterMe.db')


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.connect()
        yield
    finally:
        await db.disconnect()


app = FastAPI(lifespan=lifespan)
