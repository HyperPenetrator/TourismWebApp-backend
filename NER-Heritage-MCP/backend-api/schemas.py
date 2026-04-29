from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import UserRole

class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None
    category_tag: Optional[str] = None
    is_service: bool = False
    whatsapp_number: Optional[str] = None
    price: Optional[str] = None

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    timestamp: datetime
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    posts: List[Post] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
