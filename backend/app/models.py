from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee") # 'admin' or 'employee'
    
    requests = relationship("Request", back_populates="requester")
    subscriptions = relationship("Subscription", back_populates="owner")

class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # software, leave, food, grocery
    status = Column(String, default="Pending") # Pending, Approved, Rejected
    admin_note = Column(String, nullable=True)
    details = Column(JSON) # Stores flexible data (cost, dates, items)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    requester_id = Column(Integer, ForeignKey("users.id"))
    requester = relationship("User", back_populates="requests")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cost = Column(Float)
    category = Column(String)
    renewal_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active")
    custom_attributes = Column(JSON, default={})
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="subscriptions")