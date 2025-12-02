# Student LMS - University Resource Platform

A full-stack MVP for a university student resource platform built with **FastAPI** (Python) and **React**.

## Features

- 📚 **Resource Search** - Search and browse academic resources by subject, category, or type
- 📝 **Resource Requests** - Request resources that don't exist yet
- 👩‍🏫 **Tutor Discovery** - Find and connect with tutors by subject
- ✍️ **Post Creation** - Create resource posts, help requests, or tutor flyers

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Async ORM
- **SQLite** - Database (easily swappable to PostgreSQL)
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Vite** - Build tool

## Project Structure

```
Student LMS/
├── backend/
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── seed_data.py         # Sample data seeder
│   ├── requirements.txt     # Python dependencies
│   └── routes/
│       ├── resources.py     # Resource endpoints
│       ├── requests.py      # Request endpoints
│       ├── tutors.py        # Tutor endpoints
│       ├── posts.py         # Post endpoints
│       ├── categories.py    # Category endpoints
│       └── users.py         # User endpoints
│
└── frontend/
    ├── src/
    │   ├── api/             # API client
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── App.jsx          # Main app
    │   └── main.jsx         # Entry point
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed sample data (optional)
python seed_data.py

# Start the server
uvicorn main:app --reload --port 5000
```

The API will be available at `http://localhost:5000`
- API Docs: `http://localhost:5000/docs`
- OpenAPI: `http://localhost:5000/openapi.json`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources/search?q=query` - Search resources
- `GET /api/resources/{id}` - Get resource by ID
- `POST /api/resources` - Create resource

### Resource Requests
- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create request
- `PATCH /api/requests/{id}/status` - Update request status

### Tutors
- `GET /api/tutors` - Get all tutors
- `GET /api/tutors/subject/{subject}` - Find tutors by subject
- `GET /api/tutors/subjects/list` - Get available subjects
- `POST /api/tutors/requests` - Request tutor assistance

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `PATCH /api/posts/{id}` - Update post

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/with-counts` - Get categories with resource counts

## Environment Variables

### Backend
```env
DATABASE_URL=sqlite+aiosqlite:///./student_lms.db
SECRET_KEY=your-secret-key
```

### Frontend
```env
VITE_API_URL=http://localhost:5000/api
```

## Development

### Running Both Services

Terminal 1 (Backend):
```bash
cd backend && uvicorn main:app --reload --port 5000
```

Terminal 2 (Frontend):
```bash
cd frontend && npm run dev
```

## License

MIT
