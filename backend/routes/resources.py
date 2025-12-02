from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database import get_supabase
from schemas import ResourceCreate

router = APIRouter()

@router.get("/search")
def search_resources(
    q: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    limit: int = 20
):
    """Search resources by query, category, or file type"""
    supabase = get_supabase()
    
    query = supabase.table("resources_view").select("*")
    
    if q:
        query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
    
    if category:
        query = query.eq("category_id", category)
    
    if type:
        query = query.eq("file_type", type)
    
    query = query.order("created_at", desc=True).limit(limit)
    
    result = query.execute()
    
    if not result.data:
        return {
            "success": True,
            "data": [],
            "message": "No resources found. Consider submitting a resource request.",
            "suggestion": {
                "action": "create_request",
                "endpoint": "/api/requests"
            }
        }
    
    return {"success": True, "data": result.data}

@router.get("/")
def get_all_resources(limit: int = 50):
    """Get all resources"""
    supabase = get_supabase()
    
    result = supabase.table("resources_view").select("*").order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.get("/{resource_id}")
def get_resource(resource_id: str):
    """Get resource by ID and increment view count"""
    supabase = get_supabase()
    
    result = supabase.table("resources_view").select("*").eq("id", resource_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment view count
    supabase.table("resources").update({"view_count": result.data["view_count"] + 1}).eq("id", resource_id).execute()
    
    return {"success": True, "data": result.data}

@router.get("/category/{category_id}")
def get_resources_by_category(category_id: str, limit: int = 20):
    """Get resources by category"""
    supabase = get_supabase()
    
    result = supabase.table("resources_view").select("*").eq("category_id", category_id).order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.post("/")
def create_resource(resource: ResourceCreate):
    """Create a new resource"""
    supabase = get_supabase()
    
    data = {
        "title": resource.title,
        "description": resource.description,
        "category_id": resource.category_id,
        "file_url": resource.file_url,
        "file_type": resource.file_type,
        "tags": resource.tags,
        "author_id": resource.author_id
    }
    
    result = supabase.table("resources").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}

@router.post("/{resource_id}/download")
def track_download(resource_id: str):
    """Track resource download"""
    supabase = get_supabase()
    
    # Get current count
    result = supabase.table("resources").select("download_count").eq("id", resource_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment
    supabase.table("resources").update({"download_count": result.data["download_count"] + 1}).eq("id", resource_id).execute()
    
    return {"success": True, "message": "Download tracked"}

@router.patch("/{resource_id}")
def update_resource(resource_id: str, title: str = None, description: str = None, file_url: str = None, tags: list = None):
    """Update a resource"""
    supabase = get_supabase()
    
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if file_url is not None:
        update_data["file_url"] = file_url
    if tags is not None:
        update_data["tags"] = tags
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("resources").update(update_data).eq("id", resource_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"success": True, "data": result.data[0]}

@router.delete("/{resource_id}")
def delete_resource(resource_id: str):
    """Delete a resource"""
    supabase = get_supabase()
    
    result = supabase.table("resources").delete().eq("id", resource_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"success": True, "message": "Resource deleted"}
