# backend/app/models/contact.py

from typing import Optional
from datetime import datetime
from bson import ObjectId

class Contact:
    def __init__(self, name: str, email: str, message: str, id: Optional[str] = None, created_at: Optional[datetime] = None):
        self.id = id or str(ObjectId())
        self.name = name
        self.email = email
        self.message = message
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "created_at": self.created_at
        }
