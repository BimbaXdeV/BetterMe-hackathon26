from server.connector import *


class Database:
    def __init__(self):
        self.db: AsyncSQLiteConnector | None = None
