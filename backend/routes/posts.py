from fastapi import APIRouter, HTTPException
from typing import Optional
from database import get_supabase
from schemas import PostCreate, PostUpdate

router = APIRouter()

@router.get("/")
def get_all_posts(post_type: Optional[str] = None, category_id: Optional[str] = None, limit: int = 50):
    """Get all posts"""
    supabase = get_supabase()
    
    query = supabase.table("posts_view").select("*").eq("is_active", True)
    
    if post_type:
        query = query.eq("post_type", post_type)
    
    if category_id:
        query = query.eq("category_id", category_id)
    
    result = query.order("is_pinned", desc=True).order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.get("/{post_id}")
def get_post(post_id: str):
    """Get post by ID"""
    supabase = get_supabase()
    
    result = supabase.table("posts_view").select("*").eq("id", post_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "data": result.data}

@router.get("/author/{author_id}")
def get_posts_by_author(author_id: str, limit: int = 20):
    """Get posts by author"""
    supabase = get_supabase()
    
    result = supabase.table("posts_view").select("*").eq("author_id", author_id).order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.post("/")
def create_post(post_data: PostCreate):
    """Create a new post"""
    supabase = get_supabase()
    
    data = {
        "title": post_data.title,
        "description": post_data.description,
        "post_type": post_data.post_type,
        "category_id": post_data.category_id,
        "author_id": post_data.author_id,
        "attachment_urls": post_data.attachment_urls
    }
    
    result = supabase.table("posts").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}

@router.patch("/{post_id}")
def update_post(post_id: str, update: PostUpdate):
    """Update a post"""
    supabase = get_supabase()
    
    update_data = {}
    if update.title is not None:
        update_data["title"] = update.title
    if update.description is not None:
        update_data["description"] = update.description
    if update.category_id is not None:
        update_data["category_id"] = update.category_id
    if update.attachment_urls is not None:
        update_data["attachment_urls"] = update.attachment_urls
    if update.is_active is not None:
        update_data["is_active"] = update.is_active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("posts").update(update_data).eq("id", post_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "data": result.data[0]}

@router.delete("/{post_id}")
def delete_post(post_id: str):
    """Soft delete a post"""
    supabase = get_supabase()
    
    result = supabase.table("posts").update({"is_active": False}).eq("id", post_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post deleted"}
