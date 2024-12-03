# backend/app/api/routes.py

from typing import List  # Imported List
from fastapi import APIRouter, HTTPException, status
from app.schemas.contact import ContactForm
from app.core.database import contacts_collection
from app.models.contact import Contact
from app.core.logging import logger
from bson.objectid import ObjectId

router = APIRouter()

@router.post("/contact", status_code=status.HTTP_201_CREATED)
async def handle_contact(form: ContactForm):
    try:
        contact = Contact(
            name=form.name,
            email=form.email,
            message=form.message
        )
        result = await contacts_collection.insert_one(contact.to_dict())
        logger.info(f"Saved contact form submission from {form.email} with id {result.inserted_id}")
        return {"status": "success", "message": "Form submitted successfully."}
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/contacts", response_model=List[ContactForm])  # Uses List for response_model
async def get_contacts():
    contacts = []
    async for contact in contacts_collection.find():
        contacts.append(ContactForm(**contact))
    return contacts
