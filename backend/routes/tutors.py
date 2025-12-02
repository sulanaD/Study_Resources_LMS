from fastapi import APIRouter, HTTPException
from typing import Optional
from database import get_supabase
from schemas import TutorCreate, TutorAvailabilityUpdate, TutorRequestCreate, TutorUpdate

router = APIRouter()

@router.get("/")
def get_all_tutors(available: Optional[str] = None, limit: int = 50):
    """Get all tutors"""
    supabase = get_supabase()
    
    query = supabase.table("tutors_view").select("*")
    
    if available == "true":
        query = query.eq("is_available", True)
    elif available == "false":
        query = query.eq("is_available", False)
    
    result = query.order("rating", desc=True).limit(limit).execute()
    
    # Format response
    data = []
    for t in result.data or []:
        data.append({
            "id": t["id"],
            "user_id": t["user_id"],
            "name": t.get("name"),
            "email": t.get("email"),
            "subjects": t.get("subjects", []),
            "bio": t.get("bio"),
            "hourlyRate": t.get("hourly_rate"),
            "availability": t.get("availability", {}),
            "rating": t.get("rating", 0),
            "totalReviews": t.get("total_reviews", 0),
            "contactEmail": t.get("contact_email"),
            "bookingLink": t.get("booking_link"),
            "isAvailable": t.get("is_available", False)
        })
    
    return {"success": True, "data": data}

@router.get("/subjects/list")
def get_available_subjects():
    """Get all unique subjects from available tutors"""
    supabase = get_supabase()
    
    result = supabase.table("tutors").select("subjects").eq("is_available", True).execute()
    
    unique_subjects = set()
    for row in result.data or []:
        subjects = row.get("subjects", [])
        if subjects:
            for s in subjects:
                unique_subjects.add(s)
    
    return {"success": True, "data": sorted(list(unique_subjects))}

@router.get("/subject/{subject}")
def get_tutors_by_subject(subject: str, limit: int = 20):
    """Search tutors by subject"""
    supabase = get_supabase()
    
    result = supabase.table("tutors_view").select("*").eq("is_available", True).order("rating", desc=True).limit(limit).execute()
    
    # Filter by subject (case-insensitive)
    subject_lower = subject.lower()
    tutors = []
    all_subjects = set()
    
    for t in result.data or []:
        subjects = t.get("subjects", [])
        if subjects:
            for s in subjects:
                all_subjects.add(s)
            if any(subject_lower in s.lower() for s in subjects):
                tutors.append({
                    "id": t["id"],
                    "name": t.get("name"),
                    "subjects": subjects,
                    "availability": t.get("availability", {}),
                    "rating": t.get("rating", 0),
                    "contactEmail": t.get("contact_email"),
                    "bookingLink": t.get("booking_link")
                })
    
    if not tutors:
        return {
            "success": True,
            "data": [],
            "message": f"No tutors found for \"{subject}\"",
            "suggestions": {
                "availableSubjects": sorted(list(all_subjects)),
                "action": "request_tutor",
                "endpoint": "/api/tutors/requests"
            }
        }
    
    return {"success": True, "data": tutors}

@router.get("/{tutor_id}")
def get_tutor(tutor_id: str):
    """Get tutor by ID"""
    supabase = get_supabase()
    
    result = supabase.table("tutors_view").select("*").eq("id", tutor_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    t = result.data
    return {
        "success": True,
        "data": {
            "id": t["id"],
            "user_id": t["user_id"],
            "name": t.get("name"),
            "email": t.get("email"),
            "subjects": t.get("subjects", []),
            "bio": t.get("bio"),
            "hourlyRate": t.get("hourly_rate"),
            "availability": t.get("availability", {}),
            "rating": t.get("rating", 0),
            "totalReviews": t.get("total_reviews", 0),
            "contactEmail": t.get("contact_email"),
            "bookingLink": t.get("booking_link"),
            "isAvailable": t.get("is_available", False)
        }
    }

@router.post("/")
def create_tutor(tutor_data: TutorCreate):
    """Create a new tutor profile"""
    supabase = get_supabase()
    
    data = {
        "user_id": tutor_data.user_id,
        "subjects": tutor_data.subjects,
        "bio": tutor_data.bio,
        "hourly_rate": tutor_data.hourly_rate,
        "availability": tutor_data.availability,
        "contact_email": tutor_data.contact_email,
        "booking_link": tutor_data.booking_link
    }
    
    result = supabase.table("tutors").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}

@router.patch("/{tutor_id}/availability")
def update_availability(tutor_id: str, update: TutorAvailabilityUpdate):
    """Update tutor availability"""
    supabase = get_supabase()
    
    result = supabase.table("tutors").update({"is_available": update.is_available}).eq("id", tutor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    return {"success": True, "message": "Availability updated"}


@router.patch("/{tutor_id}")
def update_tutor(tutor_id: str, update: TutorUpdate):
    """Update a tutor profile"""
    supabase = get_supabase()
    
    # Build update data from non-None fields
    update_data = {}
    if update.subjects is not None:
        update_data["subjects"] = update.subjects
    if update.bio is not None:
        update_data["bio"] = update.bio
    if update.hourly_rate is not None:
        update_data["hourly_rate"] = update.hourly_rate
    if update.availability is not None:
        update_data["availability"] = update.availability
    if update.contact_email is not None:
        update_data["contact_email"] = update.contact_email
    if update.booking_link is not None:
        update_data["booking_link"] = update.booking_link
    if update.is_available is not None:
        update_data["is_available"] = update.is_available
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table("tutors").update(update_data).eq("id", tutor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    return {"success": True, "data": result.data[0]}


@router.delete("/{tutor_id}")
def delete_tutor(tutor_id: str):
    """Delete a tutor profile"""
    supabase = get_supabase()
    
    result = supabase.table("tutors").delete().eq("id", tutor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    return {"success": True, "message": "Tutor profile deleted"}


# === Tutor Requests ===

@router.get("/requests/all")
def get_all_tutor_requests(status: Optional[str] = None, limit: int = 50):
    """Get all tutor requests"""
    supabase = get_supabase()
    
    query = supabase.table("tutor_requests").select("*, users!tutor_requests_student_id_fkey(name)")
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    data = []
    for r in result.data or []:
        data.append({
            "id": r["id"],
            "student_id": r["student_id"],
            "student_name": r.get("users", {}).get("name") if r.get("users") else None,
            "subject": r["subject"],
            "description": r.get("description"),
            "preferred_schedule": r.get("preferred_schedule"),
            "status": r["status"],
            "matched_tutor_id": r.get("matched_tutor_id"),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"]
        })
    
    return {"success": True, "data": data}

@router.post("/requests")
def create_tutor_request(request_data: TutorRequestCreate):
    """Create a new tutor request"""
    supabase = get_supabase()
    
    data = {
        "student_id": request_data.student_id,
        "subject": request_data.subject,
        "description": request_data.description,
        "preferred_schedule": request_data.preferred_schedule
    }
    
    result = supabase.table("tutor_requests").insert(data).execute()
    
    return {"success": True, "data": result.data[0] if result.data else None}
