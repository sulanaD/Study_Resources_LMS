from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# ============================================
# USER MODEL
# ============================================
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="student")  # student, tutor, admin
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    resources = relationship("Resource", back_populates="author")
    resource_requests = relationship("ResourceRequest", back_populates="requester")
    posts = relationship("Post", back_populates="author")
    tutor_profile = relationship("Tutor", back_populates="user", uselist=False)

# ============================================
# CATEGORY MODEL
# ============================================
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    resources = relationship("Resource", back_populates="category")
    posts = relationship("Post", back_populates="category")

# ============================================
# RESOURCE MODEL
# ============================================
class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    file_url = Column(String, nullable=True)
    file_type = Column(String, nullable=True)  # pdf, video, notes, past_paper, link, other
    tags = Column(JSON, default=list)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    download_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="resources")
    author = relationship("User", back_populates="resources")

# ============================================
# RESOURCE REQUEST MODEL
# ============================================
class ResourceRequest(Base):
    __tablename__ = "resource_requests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    topic = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    preferred_format = Column(String, default="any")  # pdf, video, notes, past_paper, any
    status = Column(String, default="pending")  # pending, in_progress, fulfilled, closed
    requested_by = Column(String, ForeignKey("users.id"), nullable=False)
    fulfilled_by = Column(String, nullable=True)
    fulfilled_resource_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    requester = relationship("User", back_populates="resource_requests")

# ============================================
# TUTOR MODEL
# ============================================
class Tutor(Base):
    __tablename__ = "tutors"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    subjects = Column(JSON, default=list)
    bio = Column(Text, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    availability = Column(JSON, default=dict)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    contact_email = Column(String, nullable=True)
    booking_link = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tutor_profile")

# ============================================
# POST MODEL
# ============================================
class Post(Base):
    __tablename__ = "posts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    post_type = Column(String, nullable=False)  # resource, help_request, tutor_flyer, announcement
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    attachment_urls = Column(JSON, default=list)
    is_pinned = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="posts")
    author = relationship("User", back_populates="posts")

# ============================================
# TUTOR REQUEST MODEL
# ============================================
class TutorRequest(Base):
    __tablename__ = "tutor_requests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    preferred_schedule = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, matched, closed
    matched_tutor_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
