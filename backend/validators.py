"""
Production-level input validation and sanitization utilities.
Prevents XSS, SQL injection, and other security vulnerabilities.
"""

import re
import html
import bleach
from typing import Optional, List
from urllib.parse import urlparse

# Allowed HTML tags for rich text content (very restrictive)
ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li']
ALLOWED_ATTRIBUTES = {}

# URL patterns
URL_REGEX = re.compile(
    r'^https?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
    r'localhost|'  # localhost
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE)

# Dangerous patterns for XSS
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',
    r'data:text/html',
    r'vbscript:',
    r'expression\s*\(',
    r'url\s*\(',
]

# Email validation
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def sanitize_string(value: str, max_length: int = 1000, allow_html: bool = False) -> str:
    """
    Sanitize a string input to prevent XSS and injection attacks.
    
    Args:
        value: The input string to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow limited HTML tags
    
    Returns:
        Sanitized string
    """
    if not value:
        return ""
    
    # Trim and limit length
    value = value.strip()[:max_length]
    
    if allow_html:
        # Use bleach to clean HTML, allowing only safe tags
        value = bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
    else:
        # Escape all HTML
        value = html.escape(value)
    
    # Remove any null bytes
    value = value.replace('\x00', '')
    
    return value


def sanitize_text(value: str, max_length: int = 5000) -> str:
    """Sanitize plain text content (descriptions, bios, etc.)"""
    return sanitize_string(value, max_length, allow_html=False)


def sanitize_title(value: str, max_length: int = 200) -> str:
    """Sanitize title fields"""
    return sanitize_string(value, max_length, allow_html=False)


def validate_url(url: str, allowed_schemes: List[str] = None) -> Optional[str]:
    """
    Validate and sanitize a URL.
    
    Args:
        url: The URL to validate
        allowed_schemes: List of allowed URL schemes (default: ['http', 'https'])
    
    Returns:
        Validated URL or None if invalid
    """
    if not url:
        return None
    
    url = url.strip()
    
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']
    
    try:
        parsed = urlparse(url)
        
        # Check scheme
        if parsed.scheme.lower() not in allowed_schemes:
            return None
        
        # Check for javascript/data URLs (XSS vectors)
        if any(pattern in url.lower() for pattern in ['javascript:', 'data:', 'vbscript:']):
            return None
        
        # Validate format
        if not URL_REGEX.match(url):
            return None
        
        return url
    except Exception:
        return None


def validate_email(email: str) -> Optional[str]:
    """
    Validate an email address.
    
    Returns:
        Validated email or None if invalid
    """
    if not email:
        return None
    
    email = email.strip().lower()
    
    if len(email) > 254:
        return None
    
    if EMAIL_REGEX.match(email):
        return email
    
    return None


def validate_uuid(uuid_string: str) -> Optional[str]:
    """
    Validate a UUID string.
    
    Returns:
        Validated UUID or None if invalid
    """
    if not uuid_string:
        return None
    
    uuid_regex = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    
    if uuid_regex.match(uuid_string):
        return uuid_string.lower()
    
    return None


def check_xss(value: str) -> bool:
    """
    Check if a string contains potential XSS patterns.
    
    Returns:
        True if XSS patterns detected, False otherwise
    """
    if not value:
        return False
    
    value_lower = value.lower()
    
    for pattern in XSS_PATTERNS:
        if re.search(pattern, value_lower, re.IGNORECASE):
            return True
    
    return False


def sanitize_tags(tags: List[str], max_tags: int = 10, max_tag_length: int = 50) -> List[str]:
    """
    Sanitize a list of tags.
    
    Returns:
        List of sanitized tags
    """
    if not tags:
        return []
    
    sanitized = []
    for tag in tags[:max_tags]:
        if isinstance(tag, str):
            clean_tag = sanitize_string(tag, max_tag_length).lower()
            # Only allow alphanumeric and hyphens/underscores
            clean_tag = re.sub(r'[^a-z0-9\-_\s]', '', clean_tag)
            if clean_tag and len(clean_tag) >= 2:
                sanitized.append(clean_tag)
    
    return list(set(sanitized))  # Remove duplicates


def sanitize_attachment_urls(urls: List[str], max_urls: int = 10) -> List[str]:
    """
    Validate and sanitize a list of attachment URLs.
    
    Returns:
        List of validated URLs
    """
    if not urls:
        return []
    
    validated = []
    for url in urls[:max_urls]:
        if isinstance(url, str):
            valid_url = validate_url(url)
            if valid_url:
                validated.append(valid_url)
    
    return validated


def validate_post_type(post_type: str) -> Optional[str]:
    """Validate post type"""
    allowed = ['resource', 'help_request', 'tutor_flyer', 'announcement']
    if post_type in allowed:
        return post_type
    return None


def validate_file_type(file_type: str) -> Optional[str]:
    """Validate file type"""
    allowed = ['pdf', 'video', 'notes', 'past_paper', 'link', 'other']
    if file_type in allowed:
        return file_type
    return None


def validate_role(role: str) -> Optional[str]:
    """Validate user role"""
    allowed = ['student', 'tutor', 'admin']
    if role in allowed:
        return role
    return None


def validate_request_status(status: str) -> Optional[str]:
    """Validate request status"""
    allowed = ['pending', 'in_progress', 'fulfilled', 'closed']
    if status in allowed:
        return status
    return None


def validate_format(format_type: str) -> Optional[str]:
    """Validate preferred format"""
    allowed = ['pdf', 'video', 'notes', 'past_paper', 'any']
    if format_type in allowed:
        return format_type
    return None
