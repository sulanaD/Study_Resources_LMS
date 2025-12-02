from fastapi import APIRouter, HTTPException
from typing import Optional
from database import get_supabase
from schemas import UserCreate

router = APIRouter()

@router.get("/")
def get_all_users(role: Optional[str] = None, limit: int = 50):
    """Get all users"""
    supabase = get_supabase()
    
    query = supabase.table("users").select("*")
    
    if role:
        query = query.eq("role", role)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.get("/{user_id}")
def get_user(user_id: str):
    """Get user by ID"""
    supabase = get_supabase()
    
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "data": result.data}

@router.get("/email/{email}")
def get_user_by_email(email: str):
    """Get user by email"""
    supabase = get_supabase()
    
    result = supabase.table("users").select("*").eq("email", email).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "data": result.data}

@router.post("/")
def create_user(user_data: UserCreate):
    """Create a new user"""
    supabase = get_supabase()
    
    # Check if exists
    existing = supabase.table("users").select("id").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    data = {
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "avatar_url": user_data.avatar_url
    }
    
    result = supabase.table("users").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}

@router.patch("/{user_id}")
def update_user(user_id: str, name: Optional[str] = None, avatar_url: Optional[str] = None):
    """Update user"""
    supabase = get_supabase()
    
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if avatar_url is not None:
        update_data["avatar_url"] = avatar_url
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("users").update(update_data).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "data": result.data[0]}
