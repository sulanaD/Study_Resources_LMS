"""
Seed script to populate the database with sample data
Run: python seed_data.py
"""
import asyncio
from database import AsyncSessionLocal, engine, Base
from models import User, Category, Resource, Tutor, Post, ResourceRequest
import uuid

def gen_id():
    return str(uuid.uuid4())

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        from sqlalchemy import select
        existing = await db.execute(select(User))
        if existing.scalars().first():
            print("Data already seeded!")
            return
        
        # ============================================
        # USERS
        # ============================================
        users = [
            User(id=gen_id(), email="john@university.edu", name="John Smith", role="student"),
            User(id=gen_id(), email="jane@university.edu", name="Jane Doe", role="student"),
            User(id=gen_id(), email="mike@university.edu", name="Mike Johnson", role="student"),
            User(id=gen_id(), email="sarah@university.edu", name="Sarah Williams", role="tutor"),
            User(id=gen_id(), email="david@university.edu", name="David Brown", role="tutor"),
            User(id=gen_id(), email="emily@university.edu", name="Emily Davis", role="tutor"),
            User(id=gen_id(), email="admin@university.edu", name="Admin User", role="admin"),
        ]
        for u in users:
            db.add(u)
        await db.commit()
        
        # Refresh to get IDs
        for u in users:
            await db.refresh(u)
        
        print(f"Created {len(users)} users")
        
        # ============================================
        # CATEGORIES
        # ============================================
        categories = [
            Category(id=gen_id(), name="Mathematics", description="Math courses and resources", icon="📐"),
            Category(id=gen_id(), name="Computer Science", description="Programming and CS fundamentals", icon="💻"),
            Category(id=gen_id(), name="Physics", description="Physics courses and materials", icon="⚛️"),
            Category(id=gen_id(), name="Chemistry", description="Chemistry resources", icon="🧪"),
            Category(id=gen_id(), name="Biology", description="Biology and life sciences", icon="🧬"),
            Category(id=gen_id(), name="English", description="English language and literature", icon="📚"),
            Category(id=gen_id(), name="Business", description="Business and economics", icon="📊"),
            Category(id=gen_id(), name="Engineering", description="Engineering disciplines", icon="⚙️"),
        ]
        for c in categories:
            db.add(c)
        await db.commit()
        
        for c in categories:
            await db.refresh(c)
        
        print(f"Created {len(categories)} categories")
        
        # ============================================
        # RESOURCES
        # ============================================
        resources = [
            Resource(
                id=gen_id(),
                title="Calculus I Complete Notes",
                description="Comprehensive notes covering limits, derivatives, and integrals",
                category_id=categories[0].id,
                file_url="https://example.com/calc1-notes.pdf",
                file_type="pdf",
                tags=["calculus", "derivatives", "integrals", "limits"],
                author_id=users[3].id,
                view_count=156,
                download_count=89
            ),
            Resource(
                id=gen_id(),
                title="Python Programming Basics",
                description="Introduction to Python programming with examples and exercises",
                category_id=categories[1].id,
                file_url="https://example.com/python-basics.pdf",
                file_type="pdf",
                tags=["python", "programming", "beginner"],
                author_id=users[4].id,
                view_count=243,
                download_count=178
            ),
            Resource(
                id=gen_id(),
                title="Data Structures Video Series",
                description="Video tutorials on arrays, linked lists, trees, and graphs",
                category_id=categories[1].id,
                file_url="https://youtube.com/playlist?id=ds-series",
                file_type="video",
                tags=["data structures", "algorithms", "video"],
                author_id=users[4].id,
                view_count=312,
                download_count=0
            ),
            Resource(
                id=gen_id(),
                title="Physics 101 Past Papers",
                description="Collection of past exam papers from 2020-2024",
                category_id=categories[2].id,
                file_url="https://example.com/physics-papers.zip",
                file_type="past_paper",
                tags=["physics", "exams", "past papers"],
                author_id=users[5].id,
                view_count=89,
                download_count=67
            ),
            Resource(
                id=gen_id(),
                title="Organic Chemistry Study Guide",
                description="Detailed study guide for organic chemistry reactions",
                category_id=categories[3].id,
                file_url="https://example.com/ochem-guide.pdf",
                file_type="notes",
                tags=["chemistry", "organic", "reactions"],
                author_id=users[3].id,
                view_count=134,
                download_count=98
            ),
            Resource(
                id=gen_id(),
                title="Machine Learning Introduction",
                description="Beginner-friendly introduction to ML concepts",
                category_id=categories[1].id,
                file_url="https://example.com/ml-intro.pdf",
                file_type="pdf",
                tags=["machine learning", "AI", "beginner"],
                author_id=users[4].id,
                view_count=267,
                download_count=145
            ),
            Resource(
                id=gen_id(),
                title="Linear Algebra Cheat Sheet",
                description="Quick reference for matrices, vectors, and transformations",
                category_id=categories[0].id,
                file_url="https://example.com/linalg-cheat.pdf",
                file_type="notes",
                tags=["linear algebra", "matrices", "cheat sheet"],
                author_id=users[5].id,
                view_count=198,
                download_count=156
            ),
            Resource(
                id=gen_id(),
                title="Cell Biology Lecture Videos",
                description="Complete lecture series on cell structure and function",
                category_id=categories[4].id,
                file_url="https://youtube.com/playlist?id=cellbio",
                file_type="video",
                tags=["biology", "cells", "lectures"],
                author_id=users[3].id,
                view_count=145,
                download_count=0
            ),
        ]
        for r in resources:
            db.add(r)
        await db.commit()
        
        print(f"Created {len(resources)} resources")
        
        # ============================================
        # TUTORS
        # ============================================
        tutors = [
            Tutor(
                id=gen_id(),
                user_id=users[3].id,
                subjects=["Mathematics", "Calculus", "Statistics"],
                bio="PhD candidate in Applied Mathematics with 5 years of tutoring experience",
                hourly_rate=35.00,
                availability={"monday": ["9:00-12:00", "14:00-17:00"], "wednesday": ["10:00-15:00"], "friday": ["9:00-12:00"]},
                rating=4.8,
                total_reviews=24,
                contact_email="sarah@university.edu",
                booking_link="https://calendly.com/sarah-tutor",
                is_available=True
            ),
            Tutor(
                id=gen_id(),
                user_id=users[4].id,
                subjects=["Computer Science", "Python", "Data Structures", "Algorithms"],
                bio="Software engineer with teaching passion. Specialized in making complex topics simple.",
                hourly_rate=40.00,
                availability={"tuesday": ["18:00-21:00"], "thursday": ["18:00-21:00"], "saturday": ["10:00-16:00"]},
                rating=4.9,
                total_reviews=31,
                contact_email="david@university.edu",
                booking_link="https://calendly.com/david-cs",
                is_available=True
            ),
            Tutor(
                id=gen_id(),
                user_id=users[5].id,
                subjects=["Physics", "Chemistry", "Engineering"],
                bio="Former research assistant, now dedicated full-time tutor for STEM subjects",
                hourly_rate=30.00,
                availability={"monday": ["13:00-18:00"], "tuesday": ["13:00-18:00"], "wednesday": ["13:00-18:00"]},
                rating=4.7,
                total_reviews=18,
                contact_email="emily@university.edu",
                booking_link="https://calendly.com/emily-stem",
                is_available=True
            ),
        ]
        for t in tutors:
            db.add(t)
        await db.commit()
        
        print(f"Created {len(tutors)} tutors")
        
        # ============================================
        # POSTS
        # ============================================
        posts = [
            Post(
                id=gen_id(),
                title="Need Help with Differential Equations",
                description="Struggling with second-order ODEs. Anyone available for a study group?",
                post_type="help_request",
                category_id=categories[0].id,
                author_id=users[0].id,
                is_active=True
            ),
            Post(
                id=gen_id(),
                title="Offering Python Tutoring - Beginner to Intermediate",
                description="I'm a senior CS student offering Python tutoring. First session free! Topics: basics, OOP, data structures.",
                post_type="tutor_flyer",
                category_id=categories[1].id,
                author_id=users[4].id,
                is_active=True
            ),
            Post(
                id=gen_id(),
                title="Shared: Complete Thermodynamics Notes",
                description="Just finished organizing my thermodynamics notes from last semester. Hope this helps!",
                post_type="resource",
                category_id=categories[2].id,
                author_id=users[1].id,
                attachment_urls=["https://example.com/thermo-notes.pdf"],
                is_active=True
            ),
            Post(
                id=gen_id(),
                title="Study Group for Finals - Chemistry 201",
                description="Forming a study group for Chemistry 201 finals. Meeting at library room 204, Saturdays 2pm.",
                post_type="announcement",
                category_id=categories[3].id,
                author_id=users[2].id,
                is_pinned=True,
                is_active=True
            ),
        ]
        for p in posts:
            db.add(p)
        await db.commit()
        
        print(f"Created {len(posts)} posts")
        
        # ============================================
        # RESOURCE REQUESTS
        # ============================================
        requests = [
            ResourceRequest(
                id=gen_id(),
                topic="Discrete Mathematics",
                description="Looking for comprehensive notes on graph theory and combinatorics",
                category_id=categories[0].id,
                preferred_format="pdf",
                status="pending",
                requested_by=users[0].id
            ),
            ResourceRequest(
                id=gen_id(),
                topic="Web Development",
                description="Need video tutorials on React.js for beginners",
                category_id=categories[1].id,
                preferred_format="video",
                status="pending",
                requested_by=users[1].id
            ),
            ResourceRequest(
                id=gen_id(),
                topic="Quantum Mechanics",
                description="Looking for past exam papers for Physics 301",
                category_id=categories[2].id,
                preferred_format="past_paper",
                status="in_progress",
                requested_by=users[2].id
            ),
        ]
        for r in requests:
            db.add(r)
        await db.commit()
        
        print(f"Created {len(requests)} resource requests")
        
        print("\n✅ Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
