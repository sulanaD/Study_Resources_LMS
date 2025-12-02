# Student LMS - University Resource Platform

A full-stack Learning Management System built for university students to share academic resources, find tutors, and collaborate through community posts.

## 🚀 Features

### Core Functionality
- **📚 Resource Library** - Upload, search, and download academic resources (PDFs, notes, videos, past papers)
- **📝 Resource Requests** - Request resources you can't find, with status tracking
- **👨‍🏫 Tutor Marketplace** - Find and connect with tutors by subject area
- **💬 Community Posts** - Discussions, questions, announcements, and study groups
- **🔐 Authentication** - Secure JWT-based authentication with role-based access

### User Features
- User registration with email validation
- Secure password requirements (uppercase, lowercase, number, 8+ chars)
- Edit and delete your own posts, resources, requests, and tutor profiles
- Category-based organization for all content
- Search with intelligent suggestions

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **JWT Authentication** - Secure token-based auth with python-jose
- **Pydantic** - Data validation and sanitization
- **bcrypt** - Password hashing

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful icons

## 📁 Project Structure

```
Student LMS/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── auth.py              # Authentication logic
│   ├── database.py          # Supabase connection
│   ├── schemas.py           # Pydantic models with validation
│   └── routes/
│       ├── auth.py          # Auth endpoints
│       ├── resources.py     # Resource CRUD
│       ├── requests.py      # Request CRUD
│       ├── tutors.py        # Tutor CRUD
│       ├── posts.py         # Post CRUD
│       ├── categories.py    # Category endpoints
│       └── users.py         # User management
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context (Auth)
│   │   └── pages/           # Page components
│   ├── index.html
│   └── vite.config.js
└── supabase_schema.sql      # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run server (use port 8000 - port 5000 conflicts with AirPlay on macOS)
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run dev server
npm run dev
```

### Database Setup

Run the SQL in `supabase_schema.sql` in your Supabase SQL editor to create all tables, views, and indexes.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Resources
- `GET /api/resources` - List all resources
- `GET /api/resources/search` - Search resources
- `POST /api/resources` - Create resource
- `PATCH /api/resources/{id}` - Update resource (owner only)
- `DELETE /api/resources/{id}` - Delete resource (owner only)

### Requests, Tutors, Posts
- Full CRUD operations with owner-based edit/delete permissions

## 🔒 Security Features

- Input sanitization to prevent XSS attacks
- bcrypt password hashing
- JWT tokens with expiration
- CORS protection
- SQL injection prevention via Supabase client

## 📄 License

MIT License
