-- SolveLink AI SQLite Database Schema

PRAGMA foreign_keys = ON;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('GOVERNMENT', 'PROBLEM_OWNER', 'UNIVERSITY_ADMIN', 'FACULTY', 'STUDENT', 'HOSPITAL_ADMIN', 'NGO', 'INDUSTRY_MENTOR', 'VOLUNTEER_COORDINATOR')),
  organization_id INTEGER,
  university_id INTEGER,
  hospital_id INTEGER,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (Problem Owners / NGOs / Industry)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'MUNICIPALITY', 'NGO', 'INDUSTRY', 'COMMUNITY'
  location TEXT,
  lat REAL,
  lng REAL,
  contact_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Universities Table
CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  total_students INTEGER DEFAULT 0,
  nss_capacity INTEGER DEFAULT 0,
  ncc_capacity INTEGER DEFAULT 0,
  research_focus TEXT,
  equipment_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  faculty_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  total_beds INTEGER NOT NULL,
  available_beds INTEGER NOT NULL,
  emergency_capacity INTEGER NOT NULL,
  staff_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'NEAR_CAPACITY', 'CRITICAL'
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students / Volunteers Table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  university_id INTEGER NOT NULL,
  department_id INTEGER,
  roll_number TEXT,
  skills_json TEXT, -- JSON array of skills: e.g. ["Medical Support", "GIS", "Drone Operation"]
  nss_member BOOLEAN DEFAULT 0,
  ncc_member BOOLEAN DEFAULT 0,
  availability_status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'DEPLOYED', 'UNAVAILABLE'
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Faculty / Mentors Table
CREATE TABLE IF NOT EXISTS faculty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  university_id INTEGER NOT NULL,
  department_id INTEGER,
  specialization TEXT,
  designation TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Problems (Societal Challenges)
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  location TEXT NOT NULL,
  lat REAL,
  lng REAL,
  urgency TEXT CHECK(urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
  expected_impact TEXT,
  target_users TEXT,
  budget REAL DEFAULT 0,
  timeline TEXT,
  owner_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('DRAFT', 'SUBMITTED', 'ANALYZED', 'VALIDATED', 'PUBLISHED', 'PROPOSALS_RECEIVED', 'SOLUTION_SELECTED', 'DEVELOPMENT', 'TESTING', 'DEPLOYED', 'CLOSED')) DEFAULT 'SUBMITTED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Problem Analysis
CREATE TABLE IF NOT EXISTS problem_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER UNIQUE NOT NULL,
  category TEXT,
  subcategory TEXT,
  required_skills_json TEXT,
  required_technologies_json TEXT,
  required_departments_json TEXT,
  difficulty TEXT,
  urgency TEXT,
  social_impact TEXT,
  estimated_resources TEXT,
  solution_areas_json TEXT,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- University Problem Matches
CREATE TABLE IF NOT EXISTS problem_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  university_id INTEGER NOT NULL,
  match_score INTEGER NOT NULL,
  reasons_json TEXT,
  matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  university_id INTEGER NOT NULL,
  submitted_by INTEGER NOT NULL,
  summary TEXT NOT NULL,
  approach TEXT NOT NULL,
  team_structure TEXT,
  cost REAL DEFAULT 0,
  timeline TEXT NOT NULL,
  feasibility_score INTEGER DEFAULT 85,
  impact_score INTEGER DEFAULT 90,
  risk_level TEXT DEFAULT 'LOW',
  status TEXT CHECK(status IN ('SUBMITTED', 'SHORTLISTED', 'SELECTED', 'REJECTED')) DEFAULT 'SUBMITTED',
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- Proposal Versions
CREATE TABLE IF NOT EXISTS proposal_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  summary TEXT NOT NULL,
  approach TEXT NOT NULL,
  feedback_received TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Projects (Post Proposal Selection)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER UNIQUE NOT NULL,
  proposal_id INTEGER NOT NULL,
  university_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('PLANNING', 'DEVELOPMENT', 'PROTOTYPE', 'TESTING', 'PILOT', 'DEPLOYMENT', 'COMPLETED')) DEFAULT 'PLANNING',
  progress_pct INTEGER DEFAULT 0,
  lead_mentor_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id),
  FOREIGN KEY (university_id) REFERENCES universities(id)
);

-- Project Updates & Iterations
CREATE TABLE IF NOT EXISTS project_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  feedback TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Disasters / Emergencies
CREATE TABLE IF NOT EXISTS disasters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Flood', 'Earthquake', 'Cyclone', etc.
  location TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
  affected_population INTEGER DEFAULT 0,
  vulnerable_population INTEGER DEFAULT 0,
  hazard_info TEXT,
  status TEXT CHECK(status IN ('DETECTED', 'ASSESSING', 'RESPONSE_ACTIVE', 'CONTAINED', 'RESOLVED')) DEFAULT 'RESPONSE_ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relocation Sites
CREATE TABLE IF NOT EXISTS relocation_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disaster_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  hospital_distance_km REAL,
  road_status TEXT DEFAULT 'OPEN', -- 'OPEN', 'PARTIALLY_BLOCKED', 'CLOSED'
  risk_level TEXT DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH'
  score INTEGER DEFAULT 85,
  status TEXT DEFAULT 'PROPOSED', -- 'PROPOSED', 'APPROVED', 'REJECTED'
  FOREIGN KEY (disaster_id) REFERENCES disasters(id) ON DELETE CASCADE
);

-- Disaster Volunteer Requirements
CREATE TABLE IF NOT EXISTS disaster_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disaster_id INTEGER NOT NULL,
  role_type TEXT NOT NULL, -- 'Medical Support', 'Relief Operations', 'Technical / GIS', 'Drone Operations', 'Civil Engineering'
  required_count INTEGER NOT NULL,
  fulfilled_count INTEGER DEFAULT 0,
  urgency TEXT DEFAULT 'HIGH',
  FOREIGN KEY (disaster_id) REFERENCES disasters(id) ON DELETE CASCADE
);

-- Volunteer Responses
CREATE TABLE IF NOT EXISTS volunteer_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  role_type TEXT NOT NULL,
  status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'COMPLETED')) DEFAULT 'CONFIRMED',
  responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requirement_id) REFERENCES disaster_requirements(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(requirement_id, student_id)
);

-- University Problem Acceptances / Interactions
CREATE TABLE IF NOT EXISTS university_problem_acceptances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('INTERESTED', 'ACCEPTED', 'REJECTED', 'PROPOSAL_SUBMITTED', 'PROJECT_CREATED')) DEFAULT 'ACCEPTED',
  rejection_reason TEXT,
  assigned_department_id INTEGER,
  assigned_mentor_id INTEGER,
  accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE(university_id, problem_id)
);

-- Student Solution Submissions (Submitted to University)
CREATE TABLE IF NOT EXISTS student_solution_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  university_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technology TEXT,
  approach TEXT,
  expected_impact TEXT,
  estimated_timeline TEXT,
  status TEXT CHECK(status IN ('SUBMITTED', 'REVIEWED', 'INCORPORATED')) DEFAULT 'SUBMITTED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  role_target TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO', -- 'EMERGENCY', 'PROPOSAL', 'PROJECT', 'SYSTEM'
  is_read BOOLEAN DEFAULT 0,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Impact Metrics Table
CREATE TABLE IF NOT EXISTS impact_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  before_value TEXT NOT NULL,
  after_value TEXT NOT NULL,
  unit TEXT NOT NULL,
  improvement_pct REAL DEFAULT 0,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_problems_owner ON problems(owner_id);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_proposals_problem ON proposals(problem_id);
CREATE INDEX IF NOT EXISTS idx_disasters_status ON disasters(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
