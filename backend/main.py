from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import resources, requests, tutors, posts, categories, users, auth

app = FastAPI(
    title="Student LMS API",
    description="University Student Resource Platform - Production Ready with Authentication",
    version="2.0.0"
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for validation errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "An unexpected error occurred"}
    )


# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(tutors.router, prefix="/api/tutors", tags=["Tutors"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "Student LMS API is running", "database": "Supabase", "version": "2.0.0"}


@app.get("/")
def root():
    return {"message": "Welcome to Student LMS API", "docs": "/docs", "version": "2.0.0"}
