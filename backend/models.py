from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="traveler")
    created_at = Column(DateTime, server_default=func.now())

    posts = relationship("Post", back_populates="owner")
    items = relationship("MarketplaceItem", back_populates="seller")
    engagements = relationship("Engagement", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient", foreign_keys="Notification.user_id")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    category_tag = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="posts")
    engagements = relationship("Engagement", back_populates="post")


class MarketplaceItem(Base):
    __tablename__ = "marketplace_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    tags = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    seller_id = Column(Integer, ForeignKey("users.id"))

    seller = relationship("User", back_populates="items")


class Engagement(Base):
    __tablename__ = "engagements"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("marketplace_items.id"), nullable=True)
    action_type = Column(String(20), nullable=False)
    text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="engagements")
    post = relationship("Post", back_populates="engagements")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # recipient
    message = Column(String(500), nullable=False)
    type = Column(String(50), default="new_order")
    read = Column(Boolean, default=False)
    item_id = Column(Integer, ForeignKey("marketplace_items.id"), nullable=True)
    buyer_username = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    recipient = relationship("User", back_populates="notifications", foreign_keys=[user_id])
