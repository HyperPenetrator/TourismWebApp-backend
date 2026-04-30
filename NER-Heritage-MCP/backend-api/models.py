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
    commissions_requested = relationship("Commission", foreign_keys="Commission.requester_id", back_populates="requester")
    commissions_offered = relationship("Commission", foreign_keys="Commission.artisan_id", back_populates="artisan")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

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

class CommissionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"

class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    budget = Column(String, nullable=True)
    status = Column(SQLEnum(CommissionStatus), default=CommissionStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    requester_id = Column(Integer, ForeignKey("users.id"))
    artisan_id = Column(Integer, ForeignKey("users.id"))

    requester = relationship("User", foreign_keys=[requester_id], back_populates="commissions_requested")
    artisan = relationship("User", foreign_keys=[artisan_id], back_populates="commissions_offered")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Integer, default=0)

    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    commission_id = Column(Integer, ForeignKey("commissions.id"), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")
    commission = relationship("Commission")
