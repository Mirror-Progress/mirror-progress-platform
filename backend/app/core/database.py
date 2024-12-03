# backend/app/core/database.py

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client['mp-platform']

# Collections
contacts_collection = db.get_collection("contacts")
