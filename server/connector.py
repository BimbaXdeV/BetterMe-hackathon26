import aiosqlite
import logging


class AsyncSQLiteConnector:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None

    async def connect(self):
        """Установка соединения с базой данных."""
        if self.connection is None:
            self.connection = await aiosqlite.connect(self.db_path)
            # Включаем получение результатов в виде словарей (опционально)
            self.connection.row_factory = aiosqlite.Row
            print(f"Подключено к БД: {self.db_path}")

    async def disconnect(self):
        """Закрытие соединения."""
        if self.connection:
            await self.connection.close()
            self.connection = None
            print("Соединение с БД закрыто.")

    async def execute_query(self, sql: str, parameters: tuple = None):
        """Выполнение запросов типа INSERT, UPDATE, DELETE."""
        if self.connection is None:
            await self.connect()

        try:
            async with self.connection.execute(sql, parameters or ()) as cursor:
                await self.connection.commit()
                return cursor.lastrowid
        except Exception as e:
            logging.error(f"Ошибка при выполнении запроса: {e}")
            await self.connection.rollback()
            raise

    async def fetch_all(self, sql: str, parameters: tuple = None):
        """Получение всех записей (SELECT)."""
        if self.connection is None:
            await self.connect()

        async with self.connection.execute(sql, parameters or ()) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def fetch_one(self, sql: str, parameters: tuple = None):
        """Получение одной записи (SELECT)."""
        if self.connection is None:
            await self.connect()

        async with self.connection.execute(sql, parameters or ()) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None