from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    TRAVELER = "Traveler"
    PROVIDER = "Provider"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.TRAVELER)

    posts = relationship("Post", back_populates="owner")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    image_url = Column(String, nullable=True)
    is_service = Column(Integer, default=0)  # 0 for normal post, 1 for service
    whatsapp_number = Column(String, nullable=True)
    price = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    category_tag = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="posts")
