from fastapi import APIRouter, HTTPException
from database import get_supabase
from schemas import CategoryCreate

router = APIRouter()

@router.get("/")
def get_all_categories():
    """Get all categories"""
    supabase = get_supabase()
    
    result = supabase.table("categories").select("*").order("name").execute()
    
    return {"success": True, "data": result.data}

@router.get("/with-counts")
def get_categories_with_counts():
    """Get all categories with resource counts"""
    supabase = get_supabase()
    
    result = supabase.table("categories_with_counts").select("*").order("name").execute()
    
    return {"success": True, "data": result.data}

@router.get("/{category_id}")
def get_category(category_id: str):
    """Get category by ID"""
    supabase = get_supabase()
    
    result = supabase.table("categories").select("*").eq("id", category_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"success": True, "data": result.data}

@router.post("/")
def create_category(category_data: CategoryCreate):
    """Create a new category"""
    supabase = get_supabase()
    
    # Check if exists
    existing = supabase.table("categories").select("id").eq("name", category_data.name).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    data = {
        "name": category_data.name,
        "description": category_data.description,
        "icon": category_data.icon
    }
    
    result = supabase.table("categories").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}
