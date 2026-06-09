from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import Priority


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True
    

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[Priority] = Priority.medium
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    priority: Priority
    due_date: Optional[datetime]
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str