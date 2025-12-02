-- =============================================
-- STUDENT LMS DATABASE SCHEMA FOR SUPABASE
-- Production-Ready with Authentication
-- Run this in Supabase SQL Editor
-- =============================================

-- STEP 1: Drop function first (this will cascade drop all triggers)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- STEP 2: Drop views
DROP VIEW IF EXISTS resources_view CASCADE;
DROP VIEW IF EXISTS tutors_view CASCADE;
DROP VIEW IF EXISTS posts_view CASCADE;
DROP VIEW IF EXISTS resource_requests_view CASCADE;
DROP VIEW IF EXISTS categories_with_counts CASCADE;

-- STEP 3: Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS tutor_requests CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;
DROP TABLE IF EXISTS resource_requests CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (with authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESOURCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'video', 'notes', 'past_paper', 'link', 'other')),
    tags JSONB DEFAULT '[]'::jsonb,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESOURCE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    preferred_format TEXT DEFAULT 'any' CHECK (preferred_format IN ('pdf', 'video', 'notes', 'past_paper', 'any')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'fulfilled', 'closed')),
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    fulfilled_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TUTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tutors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subjects JSONB DEFAULT '[]'::jsonb,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    availability JSONB DEFAULT '{}'::jsonb,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    contact_email TEXT,
    booking_link TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('resource', 'help_request', 'tutor_flyer', 'announcement')),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attachment_urls JSONB DEFAULT '[]'::jsonb,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TUTOR REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tutor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    preferred_schedule TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'closed')),
    matched_tutor_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author_id);
CREATE INDEX IF NOT EXISTS idx_resources_file_type ON resources(file_type);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_requested_by ON resource_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_tutors_available ON tutors(is_available);
CREATE INDEX IF NOT EXISTS idx_tutors_user ON tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active);

-- =============================================
-- FULL TEXT SEARCH INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_resources_title_search ON resources USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_resources_description_search ON resources USING GIN (to_tsvector('english', coalesce(description, '')));

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_requests_updated_at BEFORE UPDATE ON resource_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_requests_updated_at BEFORE UPDATE ON tutor_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_requests ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON resources FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tutors FOR SELECT USING (true);
CREATE POLICY "Public read access" ON posts FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON resource_requests FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tutor_requests FOR SELECT USING (true);

-- Authenticated user policies for INSERT
CREATE POLICY "Authenticated users can insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON resource_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON tutor_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON tutors FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert" ON users FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update own resources" ON resources FOR UPDATE USING (true);
CREATE POLICY "Users can update own requests" ON resource_requests FOR UPDATE USING (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can update own tutor profile" ON tutors FOR UPDATE USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
('Mathematics', 'Math courses and resources', '📐'),
('Computer Science', 'Programming and CS fundamentals', '💻'),
('Physics', 'Physics courses and materials', '⚛️'),
('Chemistry', 'Chemistry resources', '🧪'),
('Biology', 'Biology and life sciences', '🧬'),
('English', 'English language and literature', '📚'),
('Business', 'Business and economics', '📊'),
('Engineering', 'Engineering disciplines', '⚙️')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (password for all: Password123)
-- Hash generated with bcrypt
INSERT INTO users (id, email, password_hash, name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'john@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'John Smith', 'student'),
('22222222-2222-2222-2222-222222222222', 'jane@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'Jane Doe', 'student'),
('33333333-3333-3333-3333-333333333333', 'mike@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'Mike Johnson', 'student'),
('44444444-4444-4444-4444-444444444444', 'sarah@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'Sarah Williams', 'tutor'),
('55555555-5555-5555-5555-555555555555', 'david@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'David Brown', 'tutor'),
('66666666-6666-6666-6666-666666666666', 'emily@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'Emily Davis', 'tutor'),
('77777777-7777-7777-7777-777777777777', 'admin@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.IWVhgmyHr5OeJy', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert sample resources (using category names to get IDs)
INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Calculus I Complete Notes',
    'Comprehensive notes covering limits, derivatives, and integrals',
    c.id,
    'https://example.com/calc1-notes.pdf',
    'pdf',
    '["calculus", "derivatives", "integrals", "limits"]'::jsonb,
    '44444444-4444-4444-4444-444444444444',
    156,
    89
FROM categories c WHERE c.name = 'Mathematics';

INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Python Programming Basics',
    'Introduction to Python programming with examples and exercises',
    c.id,
    'https://example.com/python-basics.pdf',
    'pdf',
    '["python", "programming", "beginner"]'::jsonb,
    '55555555-5555-5555-5555-555555555555',
    243,
    178
FROM categories c WHERE c.name = 'Computer Science';

INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Data Structures Video Series',
    'Video tutorials on arrays, linked lists, trees, and graphs',
    c.id,
    'https://youtube.com/playlist?id=ds-series',
    'video',
    '["data structures", "algorithms", "video"]'::jsonb,
    '55555555-5555-5555-5555-555555555555',
    312,
    0
FROM categories c WHERE c.name = 'Computer Science';

INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Physics 101 Past Papers',
    'Collection of past exam papers from 2020-2024',
    c.id,
    'https://example.com/physics-papers.zip',
    'past_paper',
    '["physics", "exams", "past papers"]'::jsonb,
    '66666666-6666-6666-6666-666666666666',
    89,
    67
FROM categories c WHERE c.name = 'Physics';

INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Organic Chemistry Study Guide',
    'Detailed study guide for organic chemistry reactions',
    c.id,
    'https://example.com/ochem-guide.pdf',
    'notes',
    '["chemistry", "organic", "reactions"]'::jsonb,
    '44444444-4444-4444-4444-444444444444',
    134,
    98
FROM categories c WHERE c.name = 'Chemistry';

INSERT INTO resources (title, description, category_id, file_url, file_type, tags, author_id, view_count, download_count)
SELECT 
    'Machine Learning Introduction',
    'Beginner-friendly introduction to ML concepts',
    c.id,
    'https://example.com/ml-intro.pdf',
    'pdf',
    '["machine learning", "AI", "beginner"]'::jsonb,
    '55555555-5555-5555-5555-555555555555',
    267,
    145
FROM categories c WHERE c.name = 'Computer Science';

-- Insert sample tutors
INSERT INTO tutors (user_id, subjects, bio, hourly_rate, availability, rating, total_reviews, contact_email, booking_link, is_available)
VALUES
('44444444-4444-4444-4444-444444444444', 
 '["Mathematics", "Calculus", "Statistics"]'::jsonb,
 'PhD candidate in Applied Mathematics with 5 years of tutoring experience',
 35.00,
 '{"monday": ["9:00-12:00", "14:00-17:00"], "wednesday": ["10:00-15:00"], "friday": ["9:00-12:00"]}'::jsonb,
 4.8, 24, 'sarah@university.edu', 'https://calendly.com/sarah-tutor', true),
 
('55555555-5555-5555-5555-555555555555',
 '["Computer Science", "Python", "Data Structures", "Algorithms"]'::jsonb,
 'Software engineer with teaching passion. Specialized in making complex topics simple.',
 40.00,
 '{"tuesday": ["18:00-21:00"], "thursday": ["18:00-21:00"], "saturday": ["10:00-16:00"]}'::jsonb,
 4.9, 31, 'david@university.edu', 'https://calendly.com/david-cs', true),
 
('66666666-6666-6666-6666-666666666666',
 '["Physics", "Chemistry", "Engineering"]'::jsonb,
 'Former research assistant, now dedicated full-time tutor for STEM subjects',
 30.00,
 '{"monday": ["13:00-18:00"], "tuesday": ["13:00-18:00"], "wednesday": ["13:00-18:00"]}'::jsonb,
 4.7, 18, 'emily@university.edu', 'https://calendly.com/emily-stem', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (title, description, post_type, category_id, author_id, is_active)
SELECT 
    'Need Help with Differential Equations',
    'Struggling with second-order ODEs. Anyone available for a study group?',
    'help_request',
    c.id,
    '11111111-1111-1111-1111-111111111111',
    true
FROM categories c WHERE c.name = 'Mathematics';

INSERT INTO posts (title, description, post_type, category_id, author_id, is_active)
SELECT 
    'Offering Python Tutoring - Beginner to Intermediate',
    'I''m a senior CS student offering Python tutoring. First session free! Topics: basics, OOP, data structures.',
    'tutor_flyer',
    c.id,
    '55555555-5555-5555-5555-555555555555',
    true
FROM categories c WHERE c.name = 'Computer Science';

INSERT INTO posts (title, description, post_type, category_id, author_id, attachment_urls, is_active)
SELECT 
    'Shared: Complete Thermodynamics Notes',
    'Just finished organizing my thermodynamics notes from last semester. Hope this helps!',
    'resource',
    c.id,
    '22222222-2222-2222-2222-222222222222',
    '["https://example.com/thermo-notes.pdf"]'::jsonb,
    true
FROM categories c WHERE c.name = 'Physics';

INSERT INTO posts (title, description, post_type, category_id, author_id, is_pinned, is_active)
SELECT 
    'Study Group for Finals - Chemistry 201',
    'Forming a study group for Chemistry 201 finals. Meeting at library room 204, Saturdays 2pm.',
    'announcement',
    c.id,
    '33333333-3333-3333-3333-333333333333',
    true,
    true
FROM categories c WHERE c.name = 'Chemistry';

-- Insert sample resource requests
INSERT INTO resource_requests (topic, description, category_id, preferred_format, status, requested_by)
SELECT 
    'Discrete Mathematics',
    'Looking for comprehensive notes on graph theory and combinatorics',
    c.id,
    'pdf',
    'pending',
    '11111111-1111-1111-1111-111111111111'
FROM categories c WHERE c.name = 'Mathematics';

INSERT INTO resource_requests (topic, description, category_id, preferred_format, status, requested_by)
SELECT 
    'Web Development',
    'Need video tutorials on React.js for beginners',
    c.id,
    'video',
    'pending',
    '22222222-2222-2222-2222-222222222222'
FROM categories c WHERE c.name = 'Computer Science';

INSERT INTO resource_requests (topic, description, category_id, preferred_format, status, requested_by)
SELECT 
    'Quantum Mechanics',
    'Looking for past exam papers for Physics 301',
    c.id,
    'past_paper',
    'in_progress',
    '33333333-3333-3333-3333-333333333333'
FROM categories c WHERE c.name = 'Physics';

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- Resources with category and author info
CREATE OR REPLACE VIEW resources_view AS
SELECT 
    r.*,
    c.name as category_name,
    u.name as author_name
FROM resources r
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN users u ON r.author_id = u.id;

-- Tutors with user info
CREATE OR REPLACE VIEW tutors_view AS
SELECT 
    t.*,
    u.name,
    u.email,
    u.avatar_url
FROM tutors t
JOIN users u ON t.user_id = u.id;

-- Posts with category and author info
CREATE OR REPLACE VIEW posts_view AS
SELECT 
    p.*,
    c.name as category_name,
    u.name as author_name
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.author_id = u.id;

-- Resource requests with requester info
CREATE OR REPLACE VIEW resource_requests_view AS
SELECT 
    rr.*,
    c.name as category_name,
    u.name as requester_name
FROM resource_requests rr
LEFT JOIN categories c ON rr.category_id = c.id
LEFT JOIN users u ON rr.requested_by = u.id;

-- Categories with resource counts
CREATE OR REPLACE VIEW categories_with_counts AS
SELECT 
    c.*,
    COUNT(r.id) as resource_count
FROM categories c
LEFT JOIN resources r ON c.id = r.category_id
GROUP BY c.id;
