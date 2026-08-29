# SolveLink AI

> **Tagline:** *"Real Problems. Academic Solutions. Lasting Impact."*

SolveLink AI is a unified, government-connected societal problem-solving and disaster-response coordination platform. It bridges government agencies, municipal problem owners, universities, hospitals, students, NSS/NCC volunteer teams, and industry mentors into a single high-cohesion workflow engine with server-side AI decision support and Leaflet geospatial mapping.

---

## 🌟 Key Capabilities

### 1. Capability A: Societal Innovation Collaboration
- **Problem Posting & AI Understanding**: Municipalities post real-world challenges (e.g. Smart Waste Management). Server-side Gemini AI classifies problems, extracts required technical taxonomies, and identifies required skills.
- **University Matching**: Algorithmic evaluation of university capabilities (labs, equipment, departments, research focus, student numbers) yielding dynamic match scores.
- **Multi-Proposal Comparison**: Universities submit technical proposals. Problem Owners visually compare proposals side-by-side on cost, timeline, feasibility, and risk.
- **Team Builder & Skill Gap Analysis**: University admins assemble multidisciplinary teams with automated gap detection (e.g., missing GIS mapping skill) and candidate recommendations from SQLite.
- **Feedback & Version Control**: Structured iterative versioning (v1.0 -> v1.2) for prototypes and feedback.
- **Impact Measurement**: Automated before vs. after outcome tracking with visual percentage improvements.

### 2. Capability B: Disaster Response & Decision Support (Hero Feature)
- **Interactive Leaflet Command Center**: Geospatial map rendering hazard circles (red), relocation candidate sites (green), regional hospitals (blue), and partner universities (purple).
- **AI Hazard Assessment**: Gemini AI assesses affected populations, vulnerable groups, and hospital demand estimates.
- **Safety-Scored Relocation**: AI ranks evacuation sites on capacity, road status, and hospital proximity. Government officials approve or override recommendations.
- **Hospital Bed Grid**: Real-time bed availability tracking and patient inflow pre-alerts.
- **Role-Specific Emergency Alerts & Live Shortage Tracking**: Government broadcasts alerts targeting specific student skill profiles (e.g., Medical Support). As students accept, the database state updates live, decrementing remaining shortages in the Command Center.
- **AI Command Assistant**: Conversational decision support assistant strictly grounded on active SQLite database state.
- **Simulated University Mobile App**: Interactive drawer demonstrating end-to-end dispatch: Gov Alert → Univ API → Student Mobile App → Student Acceptance → Live Database Update.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM v6, Leaflet, React-Leaflet, Lucide React Icons, Recharts.
- **Backend**: Node.js, Express.js, SQLite (`better-sqlite3`), JWT Authentication, Bcrypt password hashing.
- **AI Integration**: Server-Side Gemini API (`@google/genai`) with dynamic SQLite-grounded fallback reasoning engine.
- **Styling**: Vanilla CSS tokens & utilities (`global.css`) providing modern design aesthetics (glassmorphism, navy typography `#0f172a`, primary blue `#2563eb`, responsive cards & drawers).

---

## 🔑 Pre-Seeded Hackathon Demo Accounts

All accounts use demo password: `Demo@123`

| Role | Name | Email | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Government Official** | Commander Rajesh Sharma | `government@solvelink.demo` | Disaster Command Center |
| **Problem Owner** | Dr. Sunita Deshmukh | `owner@solvelink.demo` | Challenge & Proposal Portal |
| **University Admin** | Prof. Arvind Kulkarni | `university@solvelink.demo` | University Innovation Portal |
| **Student / Volunteer** | Aarav Mehta | `student@solvelink.demo` | Emergency Alert & Mission Portal |
| **Hospital Admin** | Dr. Vikram Roy | `hospital@solvelink.demo` | Hospital Emergency Operations |

---

## 🚀 Quick Setup & Execution

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Environment Variables
Create a `.env` file inside `server/` (or copy `.env.example`):
```env
PORT=5000
JWT_SECRET=solvelink_ai_hackathon_super_secret_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If `GEMINI_API_KEY` is not provided, the platform automatically utilizes its built-in database-grounded AI fallback engine so the application never halts.)*

### 3. Run Development Server
```bash
# Starts Express API (Port 5000) and Vite Client (Port 3000) concurrently
npm run dev
```

Visit the application at `http://localhost:3000`.

---

## 🎬 Step-by-Step Hackathon Demo Flows

### Demo Flow 1: Disaster Command & Live Volunteer State Update (Capability B)
1. Log in as **Government** (`government@solvelink.demo`).
2. Open **Disaster Command Center** -> View interactive Leaflet Map displaying the District X Flood hazard zone, relocation candidate sites, hospitals, and universities.
3. Click **"Run AI Analysis"** -> View Gemini AI emergency hazard assessment and strategic action recommendations.
4. Inspect candidate relocation sites -> Click **"Approve"** on Relocation Site Alpha (District Sports Complex).
5. Inspect **Live Volunteer Tracker** showing *Medical Support (Confirmed: 0 / 20, Remaining: 20)*.
6. Click **"Test Student Dispatch API"** (or top navbar **"Univ App Demo"**) to open the simulated University Mobile App drawer.
7. Click **"I'm Available (Accept Mission)"** inside the mobile simulator.
8. Observe the immediate **Live Database Update**: Confirmed count changes to `1 / 20` and remaining shortage decrements to `19` live in the Command Center!

### Demo Flow 2: Societal Problem & University Proposal Matching (Capability A)
1. Log in as **Problem Owner** (`owner@solvelink.demo`).
2. Select **"Smart Waste Management for Metro City Sector 4"** -> Click **"Run AI Analysis"** to extract technical taxonomies.
3. View **University Proposals Comparison Matrix** side-by-side comparing NIT District X, Metropolitan College, and State Tech on cost, timeline, feasibility, and risk.
4. Click **"Select & Initiate Project"** on NIT District X proposal -> Status updates to `SOLUTION_SELECTED` and project is created.
5. Log in as **University Admin** (`university@solvelink.demo`) -> Open **Team Builder & Skill Gap Analysis**. Observe missing GIS skill warning and click **"Add"** on candidate Rohan Sharma to resolve team gap.
6. Scroll down to view the **Measurable Solution Impact Metrics** chart showing 84.2% reduction in waste overflow incidents.

---

## 📄 License
ISC License - Built for Hackathon Demonstration.
