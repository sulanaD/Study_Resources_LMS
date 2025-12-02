from fastapi import APIRouter, HTTPException
from typing import Optional
from database import get_supabase
from schemas import ResourceRequestCreate, ResourceRequestStatusUpdate, ResourceRequestUpdate

router = APIRouter()

@router.get("/")
def get_all_requests(status: Optional[str] = None, limit: int = 50):
    """Get all resource requests"""
    supabase = get_supabase()
    
    query = supabase.table("resource_requests_view").select("*")
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.get("/{request_id}")
def get_request(request_id: str):
    """Get request by ID"""
    supabase = get_supabase()
    
    result = supabase.table("resource_requests_view").select("*").eq("id", request_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "data": result.data}

@router.get("/user/{user_id}")
def get_requests_by_user(user_id: str, limit: int = 20):
    """Get requests by user"""
    supabase = get_supabase()
    
    result = supabase.table("resource_requests_view").select("*").eq("requested_by", user_id).order("created_at", desc=True).limit(limit).execute()
    
    return {"success": True, "data": result.data}

@router.post("/")
def create_request(request_data: ResourceRequestCreate):
    """Create a new resource request"""
    supabase = get_supabase()
    
    data = {
        "topic": request_data.topic.strip(),
        "description": request_data.description.strip(),
        "category_id": request_data.category_id,
        "preferred_format": request_data.preferred_format,
        "requested_by": request_data.requested_by
    }
    
    result = supabase.table("resource_requests").insert(data).execute()
    
    new_request = result.data[0] if result.data else None
    
    return {
        "success": True,
        "data": new_request,
        "apiPayload": {
            "id": new_request["id"] if new_request else None,
            "topic": new_request["topic"] if new_request else None,
            "description": new_request["description"] if new_request else None,
            "category_id": new_request["category_id"] if new_request else None,
            "preferred_format": new_request["preferred_format"] if new_request else None,
            "requested_by": new_request["requested_by"] if new_request else None,
            "status": new_request["status"] if new_request else None,
            "created_at": new_request["created_at"] if new_request else None
        }
    }

@router.patch("/{request_id}/status")
def update_request_status(request_id: str, status_update: ResourceRequestStatusUpdate):
    """Update request status"""
    supabase = get_supabase()
    
    update_data = {"status": status_update.status}
    
    if status_update.fulfilled_by:
        update_data["fulfilled_by"] = status_update.fulfilled_by
    if status_update.fulfilled_resource_id:
        update_data["fulfilled_resource_id"] = status_update.fulfilled_resource_id
    
    result = supabase.table("resource_requests").update(update_data).eq("id", request_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "data": result.data[0]}

@router.patch("/{request_id}")
def update_request(request_id: str, update: ResourceRequestUpdate):
    """Update a resource request"""
    supabase = get_supabase()
    
    update_data = {}
    if update.topic is not None:
        update_data["topic"] = update.topic
    if update.description is not None:
        update_data["description"] = update.description
    if update.preferred_format is not None:
        update_data["preferred_format"] = update.preferred_format
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("resource_requests").update(update_data).eq("id", request_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "data": result.data[0]}

@router.delete("/{request_id}")
def delete_request(request_id: str):
    """Delete a resource request"""
    supabase = get_supabase()
    
    result = supabase.table("resource_requests").delete().eq("id", request_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"success": True, "message": "Request deleted"}
