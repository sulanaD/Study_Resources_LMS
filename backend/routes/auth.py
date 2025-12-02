"""
Authentication routes for Student LMS.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from auth import (
    RegisterRequest, 
    LoginRequest, 
    TokenResponse,
    PasswordChangeRequest,
    register_user, 
    login_user, 
    change_password,
    get_current_user
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest):
    """
    Register a new user account.
    
    - **email**: Valid email address (will be converted to lowercase)
    - **password**: At least 8 characters with uppercase, lowercase, and number
    - **name**: 2-100 characters, letters only
    - **role**: Either 'student' or 'tutor'
    """
    return register_user(
        email=request.email,
        password=request.password,
        name=request.name,
        role=request.role
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    """
    Authenticate and get an access token.
    
    - **email**: Registered email address
    - **password**: Account password
    """
    return login_user(email=request.email, password=request.password)


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    
    Requires: Bearer token in Authorization header
    """
    return {"success": True, "data": current_user}


@router.post("/change-password")
def update_password(
    request: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Change the current user's password.
    
    Requires: Bearer token in Authorization header
    """
    change_password(
        user_id=current_user["id"],
        current_password=request.current_password,
        new_password=request.new_password
    )
    return {"success": True, "message": "Password changed successfully"}


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout the current user.
    
    Note: With JWT tokens, logout is handled client-side by removing the token.
    This endpoint exists for API completeness and logging purposes.
    """
    return {"success": True, "message": "Logged out successfully"}


@router.get("/verify")
def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify that the current token is valid.
    
    Returns user info if valid.
    """
    return {"success": True, "valid": True, "user": current_user}
