from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str # Important for Frontend to know if Admin

class RequestCreate(BaseModel):
    type: str 
    details: Dict[str, Any]

class RequestOut(BaseModel):
    id: int
    type: str
    status: str
    details: Dict[str, Any]
    admin_note: Optional[str] = None
    requester_id: int
    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    name: str
    cost: float
    category: Optional[str] = None
    renewal_date: Optional[datetime] = None
    custom_attributes: Optional[Dict[str, Any]] = {}

class SubscriptionOut(SubscriptionCreate):
    id: int
    status: str
    renewal_date: datetime
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None