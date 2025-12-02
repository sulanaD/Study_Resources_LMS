"""
Production-level Pydantic schemas with strict validation for Student LMS.
All inputs are sanitized to prevent XSS, injection, and other attacks.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re
import html


# ============================================
# VALIDATION HELPERS
# ============================================

def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input to prevent XSS"""
    if not value:
        return ""
    value = value.strip()[:max_length]
    value = html.escape(value)
    value = value.replace('\x00', '')
    return value


def validate_url(url: str) -> str:
    """Validate and sanitize URL"""
    if not url:
        return ""
    url = url.strip()
    
    # Only allow http/https
    if not url.startswith(('http://', 'https://')):
        raise ValueError('URL must start with http:// or https://')
    
    # Check for XSS patterns
    dangerous = ['javascript:', 'data:', 'vbscript:', '<script', 'onclick', 'onerror', 'onload']
    if any(d in url.lower() for d in dangerous):
        raise ValueError('Invalid URL - contains dangerous patterns')
    
    return url


def validate_uuid(uuid_str: str) -> str:
    """Validate UUID format"""
    if not uuid_str:
        raise ValueError('UUID is required')
    uuid_regex = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    if not uuid_regex.match(uuid_str):
        raise ValueError('Invalid UUID format')
    return uuid_str.lower()


# ============================================
# USER SCHEMAS
# ============================================
class UserBase(BaseModel):
    email: str
    name: str
    role: str = "student"
    avatar_url: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_regex.match(v) or len(v) > 254:
            raise ValueError('Invalid email format')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        v = sanitize_string(v, 100)
        if len(v) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        allowed = ['student', 'tutor', 'admin']
        if v not in allowed:
            raise ValueError(f'Role must be one of {allowed}')
        return v
    
    @field_validator('avatar_url')
    @classmethod
    def validate_avatar(cls, v):
        if v:
            return validate_url(v)
        return v


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v:
            v = sanitize_string(v, 100)
            if len(v) < 2:
                raise ValueError('Name must be at least 2 characters')
        return v
    
    @field_validator('avatar_url')
    @classmethod
    def validate_avatar(cls, v):
        if v:
            return validate_url(v)
        return v


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# CATEGORY SCHEMAS
# ============================================
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        v = sanitize_string(v, 100)
        if len(v) < 2:
            raise ValueError('Category name must be at least 2 characters')
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v:
            return sanitize_string(v, 500)
        return v
    
    @field_validator('icon')
    @classmethod
    def validate_icon(cls, v):
        if v:
            v = v.strip()[:50]
            if not re.match(r'^[a-zA-Z0-9\-_]+$', v):
                raise ValueError('Invalid icon name')
        return v


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    resource_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


# ============================================
# RESOURCE SCHEMAS
# ============================================
class ResourceBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    category_id: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        v = sanitize_string(v, 200)
        if len(v) < 3:
            raise ValueError('Title must be at least 3 characters')
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v:
            return sanitize_string(v, 2000)
        return v
    
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        return validate_uuid(v)
    
    @field_validator('file_url')
    @classmethod
    def validate_file_url(cls, v):
        if v:
            return validate_url(v)
        return v
    
    @field_validator('file_type')
    @classmethod
    def validate_file_type(cls, v):
        if v:
            allowed = ['pdf', 'video', 'notes', 'past_paper', 'link', 'other']
            if v not in allowed:
                raise ValueError(f'File type must be one of {allowed}')
        return v
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if not v:
            return []
        sanitized = []
        for tag in v[:10]:
            if isinstance(tag, str):
                tag = re.sub(r'[^a-zA-Z0-9\-_\s]', '', tag.strip().lower()[:50])
                if len(tag) >= 2:
                    sanitized.append(tag)
        return list(set(sanitized))


class ResourceCreate(ResourceBase):
    author_id: str
    
    @field_validator('author_id')
    @classmethod
    def validate_author_id(cls, v):
        return validate_uuid(v)


class ResourceResponse(ResourceBase):
    id: str
    author_id: str
    download_count: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None
    author_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================
# RESOURCE REQUEST SCHEMAS
# ============================================
class ResourceRequestBase(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category_id: Optional[str] = None
    preferred_format: str = "any"
    
    @field_validator('topic')
    @classmethod
    def validate_topic(cls, v):
        v = sanitize_string(v, 200)
        if len(v) < 3:
            raise ValueError('Topic must be at least 3 characters')
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        v = sanitize_string(v, 2000)
        if len(v) < 10:
            raise ValueError('Description must be at least 10 characters')
        return v
    
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        if v and v.strip():
            return validate_uuid(v)
        return None
    
    @field_validator('preferred_format')
    @classmethod
    def validate_format(cls, v):
        allowed = ['pdf', 'video', 'notes', 'past_paper', 'any']
        if v not in allowed:
            raise ValueError(f'Preferred format must be one of {allowed}')
        return v


class ResourceRequestCreate(ResourceRequestBase):
    requested_by: str
    
    @field_validator('requested_by')
    @classmethod
    def validate_requested_by(cls, v):
        return validate_uuid(v)


class ResourceRequestResponse(ResourceRequestBase):
    id: str
    requested_by: str
    status: str
    fulfilled_by: Optional[str] = None
    fulfilled_resource_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    requester_name: Optional[str] = None
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ResourceRequestStatusUpdate(BaseModel):
    status: str
    fulfilled_by: Optional[str] = None
    fulfilled_resource_id: Optional[str] = None
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed = ['pending', 'in_progress', 'fulfilled', 'closed']
        if v not in allowed:
            raise ValueError(f'Status must be one of {allowed}')
        return v


class ResourceRequestUpdate(BaseModel):
    topic: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    preferred_format: Optional[str] = None
    
    @field_validator('topic')
    @classmethod
    def validate_topic(cls, v):
        if v:
            return sanitize_string(v, 200)
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v:
            return sanitize_string(v, 2000)
        return v
    
    @field_validator('preferred_format')
    @classmethod
    def validate_preferred_format(cls, v):
        if v:
            allowed = ['any', 'pdf', 'video', 'notes', 'past_paper', 'link']
            if v not in allowed:
                raise ValueError(f'Format must be one of {allowed}')
        return v


# ============================================
# TUTOR SCHEMAS
# ============================================
class TutorBase(BaseModel):
    subjects: List[str] = Field(default_factory=list)
    bio: Optional[str] = Field(None, max_length=2000)
    hourly_rate: Optional[float] = Field(None, ge=0, le=10000)
    availability: dict = Field(default_factory=dict)
    contact_email: Optional[str] = None
    booking_link: Optional[str] = None
    
    @field_validator('subjects')
    @classmethod
    def validate_subjects(cls, v):
        if not v:
            return []
        sanitized = []
        for subject in v[:20]:
            if isinstance(subject, str):
                subject = sanitize_string(subject, 100)
                if len(subject) >= 2:
                    sanitized.append(subject)
        return sanitized
    
    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v):
        if v:
            return sanitize_string(v, 2000)
        return v
    
    @field_validator('contact_email')
    @classmethod
    def validate_contact_email(cls, v):
        if v:
            v = v.strip().lower()
            email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_regex.match(v):
                raise ValueError('Invalid email format')
        return v
    
    @field_validator('booking_link')
    @classmethod
    def validate_booking_link(cls, v):
        if v:
            return validate_url(v)
        return v


class TutorCreate(TutorBase):
    user_id: str
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        return validate_uuid(v)


class TutorResponse(TutorBase):
    id: str
    user_id: str
    rating: float
    total_reviews: int
    is_available: bool
    created_at: datetime
    updated_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True


class TutorAvailabilityUpdate(BaseModel):
    is_available: bool


class TutorUpdate(BaseModel):
    subjects: Optional[List[str]] = None
    bio: Optional[str] = Field(None, max_length=2000)
    hourly_rate: Optional[float] = Field(None, ge=0, le=10000)
    availability: Optional[dict] = None
    contact_email: Optional[str] = None
    booking_link: Optional[str] = None
    is_available: Optional[bool] = None
    
    @field_validator('subjects')
    @classmethod
    def validate_subjects(cls, v):
        if v is None:
            return v
        sanitized = []
        for subject in v[:20]:
            if isinstance(subject, str):
                subject = sanitize_string(subject, 100)
                if len(subject) >= 2:
                    sanitized.append(subject)
        return sanitized
    
    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v):
        if v:
            return sanitize_string(v, 2000)
        return v
    
    @field_validator('contact_email')
    @classmethod
    def validate_contact_email(cls, v):
        if v:
            v = v.strip().lower()
            email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_regex.match(v):
                raise ValueError('Invalid email format')
        return v
    
    @field_validator('booking_link')
    @classmethod
    def validate_booking_link(cls, v):
        if v:
            return validate_url(v)
        return v


# ============================================
# TUTOR REQUEST SCHEMAS
# ============================================
class TutorRequestBase(BaseModel):
    subject: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    preferred_schedule: Optional[str] = Field(None, max_length=200)
    
    @field_validator('subject')
    @classmethod
    def validate_subject(cls, v):
        return sanitize_string(v, 100)
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v:
            return sanitize_string(v, 2000)
        return v
    
    @field_validator('preferred_schedule')
    @classmethod
    def validate_preferred_schedule(cls, v):
        if v:
            return sanitize_string(v, 200)
        return v


class TutorRequestCreate(TutorRequestBase):
    student_id: str
    
    @field_validator('student_id')
    @classmethod
    def validate_student_id(cls, v):
        return validate_uuid(v)


class TutorRequestResponse(TutorRequestBase):
    id: str
    student_id: str
    status: str
    matched_tutor_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================
# POST SCHEMAS
# ============================================
class PostBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    post_type: str
    category_id: Optional[str] = None
    attachment_urls: List[str] = Field(default_factory=list)
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        v = sanitize_string(v, 200)
        if len(v) < 5:
            raise ValueError('Title must be at least 5 characters')
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        v = sanitize_string(v, 5000)
        if len(v) < 20:
            raise ValueError('Description must be at least 20 characters')
        return v
    
    @field_validator('post_type')
    @classmethod
    def validate_post_type(cls, v):
        allowed = ['resource', 'help_request', 'tutor_flyer', 'announcement']
        if v not in allowed:
            raise ValueError(f'Post type must be one of {allowed}')
        return v
    
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        if v and v.strip():
            return validate_uuid(v)
        return None
    
    @field_validator('attachment_urls')
    @classmethod
    def validate_attachment_urls(cls, v):
        if not v:
            return []
        validated = []
        for url in v[:10]:
            if isinstance(url, str) and url.strip():
                try:
                    validated_url = validate_url(url)
                    validated.append(validated_url)
                except ValueError:
                    continue
        return validated


class PostCreate(PostBase):
    author_id: str
    
    @field_validator('author_id')
    @classmethod
    def validate_author_id(cls, v):
        return validate_uuid(v)


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    category_id: Optional[str] = None
    attachment_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v:
            v = sanitize_string(v, 200)
            if len(v) < 5:
                raise ValueError('Title must be at least 5 characters')
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v:
            v = sanitize_string(v, 5000)
            if len(v) < 20:
                raise ValueError('Description must be at least 20 characters')
        return v
    
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        if v and v.strip():
            return validate_uuid(v)
        return None
    
    @field_validator('attachment_urls')
    @classmethod
    def validate_attachment_urls(cls, v):
        if v is None:
            return v
        validated = []
        for url in v[:10]:
            if isinstance(url, str) and url.strip():
                try:
                    validated_url = validate_url(url)
                    validated.append(validated_url)
                except ValueError:
                    continue
        return validated


class PostResponse(PostBase):
    id: str
    author_id: str
    is_pinned: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None
    author_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================
# GENERIC RESPONSE SCHEMAS
# ============================================
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
