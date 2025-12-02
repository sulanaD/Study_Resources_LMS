import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# First, delete all existing resources
print("Deleting existing resources...")
supabase.table("resources").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

# Get category IDs or create them
print("Setting up categories...")

# Check existing categories
existing = supabase.table("categories").select("*").execute()
category_map = {c["name"]: c["id"] for c in existing.data}

# Create new categories if needed
new_categories = ["Languages", "ET", "ICT", "SFT", "Science/Maths"]
for cat_name in new_categories:
    if cat_name not in category_map:
        result = supabase.table("categories").insert({
            "name": cat_name,
            "description": f"Resources for {cat_name}",
            "icon": "📚"
        }).execute()
        if result.data:
            category_map[cat_name] = result.data[0]["id"]
            print(f"Created category: {cat_name}")

# Get a user ID for the author
users = supabase.table("users").select("id").limit(1).execute()
author_id = users.data[0]["id"] if users.data else None

if not author_id:
    print("No user found!")
    exit(1)

print(f"Using author_id: {author_id}")

# Add the new resources (using correct column names from schema)
resources = [
    # Languages - Japanese
    {
        "title": "Japanese Language Resources Pack 1",
        "description": "Comprehensive Japanese language learning materials including grammar, vocabulary, and practice exercises.",
        "file_url": "https://drive.google.com/drive/folders/1Piqc_QyvfDOmJNndjFzcL147_Fd-UcHL",
        "file_type": "link",
        "category_id": category_map.get("Languages"),
        "author_id": author_id,
        "tags": ["japanese", "language", "grammar", "vocabulary"]
    },
    {
        "title": "Japanese Language Resources Pack 2",
        "description": "Additional Japanese learning resources with audio and visual materials.",
        "file_url": "https://drive.google.com/drive/folders/10gFiRBZe_OiUtR9nzDR28WvYkXPx4Rry?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("Languages"),
        "author_id": author_id,
        "tags": ["japanese", "language", "audio", "visual"]
    },
    # Languages - Korean
    {
        "title": "Korean Language Resources",
        "description": "Complete Korean language learning materials for beginners to advanced learners.",
        "file_url": "https://drive.google.com/drive/folders/1e2w52bcOMQ-StMf0EJZaDs9q3lRUYjkg?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("Languages"),
        "author_id": author_id,
        "tags": ["korean", "language", "hangul"]
    },
    # Languages - Hindi
    {
        "title": "Hindi Language Resources",
        "description": "Hindi language learning materials including Devanagari script practice.",
        "file_url": "https://drive.google.com/drive/folders/1mbBF-CQiAzgjoW82rE3VN8UqoRNAoxC-?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("Languages"),
        "author_id": author_id,
        "tags": ["hindi", "language", "devanagari"]
    },
    # Languages - Sinhala
    {
        "title": "Sinhala Language Resources",
        "description": "Sinhala language learning materials for all levels.",
        "file_url": "https://drive.google.com/drive/folders/10v36oT_2Vw7Tmud-_sVf0SYouNdouaU0?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("Languages"),
        "author_id": author_id,
        "tags": ["sinhala", "language", "sri lanka"]
    },
    # ET
    {
        "title": "Engineering Technology (ET) Resources",
        "description": "Comprehensive Engineering Technology study materials and past papers.",
        "file_url": "https://drive.google.com/drive/folders/1CqiLw8a4wVSWlLO8C69NfDit2wWMa3eT?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("ET"),
        "author_id": author_id,
        "tags": ["engineering", "technology", "ET"]
    },
    # ICT
    {
        "title": "Information & Communication Technology (ICT) Resources",
        "description": "ICT study materials, tutorials, and practice resources.",
        "file_url": "https://drive.google.com/drive/folders/1mPdYHQHH4LO_eWINv9vEUkfdPZ2bxe5v?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("ICT"),
        "author_id": author_id,
        "tags": ["ICT", "computing", "technology"]
    },
    # SFT
    {
        "title": "Science for Technology (SFT) Resources",
        "description": "Science for Technology study materials and resources.",
        "file_url": "https://drive.google.com/drive/folders/1TkZzT34I5XaVne_no8ZnMSPSOvbNofIx?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("SFT"),
        "author_id": author_id,
        "tags": ["SFT", "science", "technology"]
    },
    # Combined Maths
    {
        "title": "Combined Mathematics Resources",
        "description": "Combined Mathematics study materials including pure and applied maths.",
        "file_url": "https://drive.google.com/drive/folders/1Cm3wD7ziKPmNo5SxNQU1ZFeyP7eMbIWC?usp=drive_link",
        "file_type": "link",
        "category_id": category_map.get("Science/Maths"),
        "author_id": author_id,
        "tags": ["maths", "combined maths", "pure maths", "applied maths"]
    },
]

print("Adding new resources...")
for resource in resources:
    if resource["category_id"] is None:
        print(f"✗ Skipping {resource['title']} - category not found")
        continue
    result = supabase.table("resources").insert(resource).execute()
    if result.data:
        print(f"✓ Added: {resource['title']}")
    else:
        print(f"✗ Failed: {resource['title']}")

print("\nDone! Resources updated.")
