# 🎓 StudyPal — AI-Powered Adaptive Study Planner & Timetable Engine

> **Never fall behind on exam prep again.** An intelligent, pedagogically grounded study planning ecosystem that generates collision-free daily timetables, parses official university syllabi with Google Gemini AI, preserves exact curriculum subtopics, and dynamically reschedules missed sessions without causing burnout.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_4-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_3.6_Flash-8E75FF?logo=google&logoColor=white)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📑 Table of Contents
1. [Project Title & Tagline](#1-project-title--tagline)
2. [Problem Statement](#2-problem-statement)
3. [Target Audience & Personas](#3-target-audience--personas)
4. [Key Features & Differentiators](#4-key-features--differentiators)
5. [Syllabus Upload & Official Curriculum Grounding Pipeline](#5-syllabus-upload--official-curriculum-grounding-pipeline)
6. [AI Architecture & Error Resilience](#6-ai-architecture--error-resilience)
7. [Planning Engine & Mathematical Scheduling Algorithm](#7-planning-engine--mathematical-scheduling-algorithm)
8. [Adaptive Rescheduling Logic](#8-adaptive-rescheduling-logic)
9. [Technology Stack](#9-technology-stack)
10. [Project Structure](#10-project-structure)
11. [Database Schema & Data Models](#11-database-schema--data-models)
12. [API Reference](#12-api-reference)
13. [Setup & Installation Guide](#13-setup--installation-guide)
14. [Environment Variables Guide](#14-environment-variables-guide)
15. [Testing & Quality Assurance](#15-testing--quality-assurance)
16. [Cost & Token Optimization Strategy](#16-cost--token-optimization-strategy)

---

## 1. Project Title & Tagline

**StudyPal — The Autonomous, Adaptive AI Study Operating System.**

*“Static calendars break the moment life happens. StudyPal adapts in real-time using cognitive science, mathematical workload balancing, official syllabus grounding, and Google Gemini AI.”*

---

## 2. Problem Statement

Every semester, millions of students encounter the **"Timetable Collapse Phenomenon"**:
1. **The Static Plan Trap**: Students spend hours creating beautiful color-coded study schedules in Notion, Google Calendar, or paper planners.
2. **Syllabus Disconnect**: Generic AI tools hallucinate standard topics rather than following the student's actual university/board curriculum.
3. **The First Inevitable Miss**: An unexpected lecture, illness, or difficult assignment causes the student to miss Day 3.
4. **The Domino Effect**: Because static timetables have no automatic collision-free rebalancing, missed tasks pile up indefinitely. The schedule becomes intimidating, leading to panic, cramming, and burnout.
5. **Pedagogical Inefficiency**: Students spend 80% of their energy on passive re-reading rather than structured Active Recall, Spaced Repetition, and timed mock simulations.

**StudyPal solves this** by grounding your study plan directly in your uploaded syllabus PDF, validating every named subtopic string through Zod, and scheduling tasks via a collision-free deterministic constraint solver.

---

## 3. Target Audience & Personas

| Persona | Academic Level | Key Frustration | How StudyPal Solves It |
| :--- | :--- | :--- | :--- |
| **Alex — The Engineering Undergrad** | College Sophomore (Computer Science) | Official university syllabus with specific units across multiple subjects (OS, DSA, DBMS) | Uploads official semester syllabus PDF once; auto-extracts all subjects, units, topics, and subtopics |
| **Priya — The Competitive Aspirant** | GATE / GRE / JEE Candidate | Needs 6+ months of spaced repetition and continuous mock testing | Automatically phases schedule from Concept Learning $\rightarrow$ Deep Practice $\rightarrow$ Spaced Revision $\rightarrow$ Mock Simulation |
| **Sam — The High School Senior** | K-12 / AP & Board Exams | Prone to procrastination and burnout when falling behind | 50/10 Pomodoro intervals, gentle burnout warnings, and 1-click intelligent recovery rescheduling |

---

## 4. Key Features & Differentiators

```
+------------------------------------+------------------------------------+
|       Traditional Planners         |             StudyPal               |
+------------------------------------+------------------------------------+
| ❌ Static calendar blocks           | ✅ Adaptive dynamic rebalancing    |
| ❌ Generic hallucinated topics     | ✅ 📄 Official Syllabus Grounding  |
| ❌ Subtopic count badges only      | ✅ 🔍 Actual named subtopic arrays |
| ❌ Missed tasks cause chaos        | ✅ 1-Click zero-collision recovery |
| ❌ Generic study blocks            | ✅ Pedagogical 4-phase progression |
| ❌ Isolated task lists             | ✅ Context-aware 24/7 AI tutor     |
| ❌ Fragile single-model AI calls   | ✅ 🛡️ Dual-model retry & fallback  |
| ❌ Overload & burnout blind        | ✅ Enforced daily hour caps & rest |
+------------------------------------+------------------------------------+
```

- 📄 **Plan-Level Official Syllabus Grounding**: Upload your university/board syllabus PDF once. StudyPal extracts all subjects, units, topics, and exact named subtopic strings with zero hallucination.
- 🛡️ **Dual-Model Resilience & Auto-Fallback**: Primary `gemini-3.6-flash` with exponential backoff (1s, 2s, 4s) automatically cascades to `gemini-3.5-flash-lite` on transient 503/429 errors.
- 🎯 **Mathematical Priority Scoring Engine**: Ranks subjects by $Urgency \times Difficulty \times Weakness$.
- 🔄 **Collision-Free Adaptive Rescheduler**: Shifts missed tasks to verified open slots with zero timetable overlap.
- 📊 **Progress & Habit Tracking**: Real-time completion analytics, streak counter, and celebratory rewards.
- 🔒 **Enterprise-Grade Security**: JWT authentication with bcrypt password hashing; API secrets strictly isolated to backend.

---

## 5. Syllabus Upload & Official Curriculum Grounding Pipeline

StudyPal uses the uploaded academic syllabus as the **absolute source of truth**:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Uploaded PDF   │ ──► │  PDF-Parse (Raw) │ ──► │  Gemini Structuring │
│  (Multi-Subject)│     │  Text Extraction │     │  (Strict Grounding) │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                                            │
                                                            ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Frontend UI   │ ◄── │  MongoDB & Plan  │ ◄── │  Zod Schema Reject  │
│ (Subtopic Lists)│     │   State Store    │     │  Counts/Summaries   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

### Pipeline Guarantees:
1. **Multi-Subject Auto-Population**: Single document upload extracts all subjects, units/modules, and topics.
2. **Actual Named Subtopic Preservation**: Subtopics are preserved as individual strings (`• Array representation`, `• Array operations`, `• Searching`, `• Sorting`), never summarized as count badges like `"10 subtopics"`.
3. **Zod Schema Rejection**: `SubtopicStringSchema` actively rejects count patterns (`"10 subtopics"`, `"5 topics"`, `"multiple subtopics"`).
4. **Zero Fabrication Rule**: If a topic in the syllabus has no subtopics, an empty array `[]` is returned rather than inventing concepts from general AI knowledge.

---

## 6. AI Architecture & Error Resilience

StudyPal employs a **Hybrid AI + Deterministic Constraint Engine**:

```
+-------------------------------------------------------------------------+
|                        StudyPal Web Client (React + Vite)               |
|   - 6-Step Multi-Subject Wizard     - Today's Live Plan Dashboard       |
|   - Official Syllabus PDF Upload    - "Ask StudyPal 🤖" AI Assistant   |
+-------------------------------------------------------------------------+
                                    │  HTTPS / REST (JWT Auth)
                                    ▼
+-------------------------------------------------------------------------+
|                        StudyPal Express Backend API                     |
|                                                                         |
|   ┌─────────────────────────────────────────────────────────────────┐   |
|   │ Modular Prompt Engineering Layer (server/src/prompts/)          │   |
|   │  • syllabus.prompt.ts       • studyPlan.prompt.ts               │   |
|   │  • taskBreakdown.prompt.ts  • reschedule.prompt.ts              │   |
|   │  • studyAssistant.prompt.ts • studyStrategy.prompt.ts           │   |
|   └─────────────────────────────────────────────────────────────────┘   |
|                                    │                                    |
|             ┌──────────────────────┴──────────────────────┐             |
|             ▼                                             ▼             |
|   ┌───────────────────────────┐         ┌───────────────────────────┐   |
|   │ Google GenAI SDK Client   │         │ Deterministic Scheduler   │   |
|   │  • Primary: 3.6 Flash     │         │  • Priority Formula       │   |
|   │  • Fallback: 3.5 Lite     │         │  • Time Collision Solver  │   |
|   │  • Exponential Backoff    │         │  • Non-Overlapping Math   │   |
|   │  • Subtopic Zod Validator │         │  • Subtopic Task Enricher │   |
|   └───────────────────────────┘         └───────────────────────────┘   |
|                 │                                     │                 |
|                 └──────────────────┬──────────────────┘                 |
|                                    ▼                                    |
|                        MongoDB Atlas Cloud Database                     |
|                   (StudyPlans, StudyTasks, Users)                       |
+-------------------------------------------------------------------------+
```

### Resilience Features:
- **Configurable Models**: Managed via `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL` environment variables.
- **Exponential Backoff**: Automatic retry on transient 503 / 429 / network timeouts with randomized jitter.
- **Fast Failure**: Permanent client errors (400, 401, 403, 404) fail immediately without wasteful retries.
- **Sanitized Errors**: Raw API error JSON and API keys are never exposed to the client.

---

## 7. Planning Engine & Mathematical Scheduling Algorithm

StudyPal's planner schedules tasks using an exact mathematical optimization algorithm:

### 1. Subject Priority Score Formula
$$\text{Priority Score} = \text{Urgency Factor} \times \text{Difficulty Multiplier} \times \text{Weakness Multiplier}$$

Where:
- **Urgency Factor**: $\text{Clamp}\left(1, 10, \frac{45}{\text{Days Until Exam}}\right)$
- **Difficulty Multiplier**: $\text{Hard} = 1.6$, $\text{Medium} = 1.2$, $\text{Easy} = 0.9$
- **Weakness Multiplier**: $\text{Weak Confidence} = 1.8$, $\text{Average} = 1.2$, $\text{Strong} = 0.8$

### 2. Pedagogical 4-Phase Progression
- **Phase 1: Concept Learning & Foundation** ($> 12$ days before exam): Deep work, theory notes, and concept diagrams.
- **Phase 2: Practice & Problem Solving** ($6 - 12$ days before exam): Graded problem sets, edge cases, and proofs.
- **Phase 3: Spaced Revision & Active Recall** ($3 - 5$ days before exam): High-yield formula sheets and flashcard drills.
- **Phase 4: Timed Mock Simulation** ($1 - 2$ days before exam): Strictly timed sectional mock tests under exam conditions.

### 3. Collision-Free Slot Allocation
```typescript
const hasConflict = existingTasks.some(t => {
  const tStart = timeToMinutes(t.startTime);
  const tEnd = timeToMinutes(t.endTime);
  return (slotStart < tEnd && slotEnd > tStart);
});
```

---

## 8. Adaptive Rescheduling Logic

When a student marks a task as missed or clicks **Reschedule**:
1. **Target Date Detection**: Evaluates tomorrow or a user-selected target date.
2. **Capacity & Conflict Query**: Queries all existing non-completed tasks on the target date.
3. **Slot Availability Search**: Scans preferred study window ($09:00 - 21:00$) in $sessionLength + breakDuration$ intervals.
4. **Collision Avoidance**: Assigns the first verified free slot where no other study task exists.
5. **Audit Trail**: Saves `rescheduledFromDate` and updates status to `RESCHEDULED`.

---

## 9. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 19 + TypeScript + Vite | Lightning-fast reactive single-page client |
| **Routing** | React Router DOM v7 | Client-side navigation |
| **Styling** | Tailwind CSS + Vanilla CSS Tokens | Responsive glassmorphic UI |
| **Icons & FX** | Lucide React + Canvas Confetti | Modern UI icons & celebratory rewards |
| **Backend API** | Node.js + Express + TypeScript | RESTful API architecture |
| **PDF Extraction**| `pdf-parse` | In-memory stream parsing of academic syllabus PDFs |
| **Database** | MongoDB Atlas + Mongoose 9 | Cloud document database |
| **AI SDK** | `@google/genai` (Gemini 3.6 Flash / 3.5 Lite) | Official Google SDK with dual-model fallback |
| **Validation** | Zod 4 | Strict runtime schema validation & subtopic refinement |
| **Security** | JWT + bcryptjs | Token-based stateless auth & password hashing |

---

## 10. Project Structure

```
studypal/
├── .env.example                  # Consolidated root environment template
├── .gitignore                    # Git ignore covering node_modules, .env, logs
├── package.json                  # Root npm workspace configuration
├── README.md                     # Comprehensive documentation
│
├── client/                       # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/           # Navbar, TaskCard, Hero, Modals
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Landing page with hero & demo
│   │   │   ├── CreatePlanPage.tsx # 6-Step wizard with Syllabus PDF Upload
│   │   │   ├── DashboardPage.tsx # Today's Live Study Plan & Metrics
│   │   │   └── TimetablePage.tsx # 7-Day Weekly Grid Schedule
│   │   └── services/api.ts       # Typed HTTP client for all backend endpoints
│
└── server/                       # Express + TypeScript Backend
    └── src/
        ├── controllers/
        │   ├── syllabus.controller.ts # Syllabus PDF upload & multi-subject parsing
        │   ├── plan.controller.ts     # Study plan creation & retrieval
        │   ├── task.controller.ts     # Daily/weekly tasks & rescheduling
        │   └── ai.controller.ts       # AI topics, assistant, breakdown
        ├── prompts/
        │   ├── syllabus.prompt.ts     # Multi-subject syllabus extraction prompt
        │   ├── studyPlan.prompt.ts    # Study plan timetable prompt
        │   └── studyAssistant.prompt.ts# Contextual AI tutor prompt
        ├── services/
        │   ├── pdf.service.ts         # In-memory PDF text extraction
        │   ├── ai.service.ts          # Resilient dual-model Gemini client
        │   └── planner.service.ts     # Mathematical scheduling algorithm
        └── tests/
            ├── syllabus.test.ts       # Syllabus parsing & subtopic unit tests
            └── resilience.test.ts     # Gemini retry & fallback test suite
```

---

## 11. Database Schema & Data Models

### 1. User Model (`User`)
- `_id`: Primary Key
- `name`: Student full name
- `email`: Student login email (Unique, Indexed)
- `password`: Salted bcrypt password hash

### 2. StudyPlan Model (`StudyPlan`)
- `userId`: Ref `User`
- `title`: Plan title (e.g., "Semester IV Finals Prep")
- `examStartDate` / `examEndDate`: Format `YYYY-MM-DD`
- `dailyHoursWeekday` / `dailyHoursWeekend`: Study quotas
- `syllabus`: Embedded syllabus metadata (`fileName`, `rawTextLength`, `subjects`)
- `subjects`: Multi-subject list with difficulty, confidence, exam dates, units, topics, and subtopics

### 3. StudyTask Model (`StudyTask`)
- `planId`: Ref `StudyPlan`
- `subjectName`: Subject name
- `topic`: Specific chapter/unit with syllabus subtopic details
- `date`: Format `YYYY-MM-DD` (Indexed)
- `startTime` / `endTime`: Format `HH:MM`
- `type`: `LEARNING`, `PRACTICE`, `REVISION`, `MOCK_TEST`
- `status`: `PENDING`, `COMPLETED`, `MISSED`, `RESCHEDULED`

---

## 12. API Reference

### 📄 Syllabus PDF Extraction (`/api/syllabus`)
- **`POST /api/syllabus/upload`** `[Auth Required, multipart/form-data]` — Upload official syllabus PDF and auto-extract multi-subject curriculum.
  ```json
  // Response (200 OK)
  {
    "success": true,
    "data": {
      "fileName": "Semester_IV_Syllabus.pdf",
      "institution": "Mumbai University",
      "subjects": [
        {
          "name": "Data Structures and Algorithms",
          "units": [
            {
              "name": "Unit 1: Linear Data Structures",
              "topics": [
                {
                  "name": "Arrays & Dynamic Allocation",
                  "subtopics": ["Array representation", "Array operations", "Searching", "Sorting"],
                  "keyConcepts": ["Time Complexity"]
                }
              ]
            }
          ]
        }
      ]
    }
  }
  ```

### 🔐 Authentication (`/api/auth`)
- **`POST /api/auth/register`** — Register a new student account
- **`POST /api/auth/login`** — Log in with email & password
- **`GET /api/auth/me`** `[Auth Required]` — Retrieve active user session

### 📅 Study Plans (`/api/plans`)
- **`POST /api/plans`** `[Auth Required]` — Generate a multi-subject study plan and task timetable
- **`GET /api/plans/active`** `[Auth Required]` — Get user's active study plan

### 📝 Tasks & Timetable (`/api/tasks`)
- **`GET /api/tasks/today?date=YYYY-MM-DD`** `[Auth Required]` — Get tasks & completion metrics
- **`PATCH /api/tasks/:id/complete`** `[Auth Required]` — Mark task completed
- **`PATCH /api/tasks/:id/reschedule`** `[Auth Required]` — Reschedule task without collisions

### 🤖 Gemini AI Endpoints (`/api/ai`)
- **`POST /api/ai/suggest-topics`** — Fallback topic suggestions
- **`POST /api/ai/ask-assistant`** — Contextual 24/7 personal study coach
- **`POST /api/ai/breakdown-task`** — Breakdown study block into Pomodoro phases

---

## 13. Setup & Installation Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`node -v`)
- **npm** or **pnpm**
- **MongoDB**: Local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Clone Repository & Install
```bash
git clone https://github.com/your-username/studypal.git
cd studypal
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### Step 2: Environment Configuration
```bash
# Windows PowerShell:
Copy-Item .env.example .env
Copy-Item .env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/studypal?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_32bytes_long
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_32bytes_long
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

### Step 3: Run Development Servers
```bash
# Terminal 1: Backend API (Express on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Vite on http://localhost:5173)
cd client
npm run dev
```

---

## 14. Environment Variables Guide

| Variable | Environment | Default | Description | Secret? |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Server | `5000` | Port for Express backend API | No |
| `NODE_ENV` | Server | `development` | Runtime mode (`development` or `production`) | No |
| `CLIENT_URL` | Server | `http://localhost:5173` | Allowed CORS frontend origin | No |
| `MONGODB_URI` | Server | — | MongoDB Atlas cloud database connection URI | 🔒 **YES** |
| `JWT_ACCESS_SECRET` | Server | — | 256-bit secret for signing access tokens | 🔒 **YES** |
| `JWT_REFRESH_SECRET`| Server | — | Secret for signing refresh tokens | 🔒 **YES** |
| `GEMINI_API_KEY` | Server | — | Google Gemini API Key | 🔒 **YES** |
| `GEMINI_MODEL` | Server | `gemini-3.6-flash` | Primary Gemini model ID | No |
| `GEMINI_FALLBACK_MODEL` | Server | `gemini-3.5-flash-lite` | Secondary fallback model ID | No |

---

## 15. Testing & Quality Assurance

StudyPal includes automated test suites covering syllabus parsing, subtopic validation, and AI resilience:

### Run Automated Tests:
```bash
# Compile TypeScript
npm run --workspace=server build

# Run Syllabus Parsing & Subtopics Test Suite (12 tests)
node server/dist/tests/syllabus.test.js

# Run AI Retry & Dual-Model Fallback Test Suite (7 tests)
node server/dist/tests/resilience.test.js
```

### Test Coverage Highlights:
- ✅ PDF in-memory text extraction from syllabus documents.
- ✅ Multi-subject structured syllabus JSON parsing with actual named subtopics.
- ✅ Zod rejection of count/summary strings (`"10 subtopics"`, `"5 topics"`, `"multiple subtopics"`).
- ✅ Clean handling of topics with empty subtopics `[]`.
- ✅ Exponential backoff retry on transient 503/429 errors.
- ✅ Automatic cascading from primary model to fallback model.
- ✅ Fast failure on permanent client errors without unnecessary retries.

---

## 16. Cost & Token Optimization Strategy

1. **One-Time Syllabus Extraction**: Syllabi are parsed once during plan creation and persisted in MongoDB ($0$ LLM tokens spent on routine renders).
2. **Deterministic Mathematical Scheduling**: Daily timetable generation, conflict resolution, and priority scoring execute 100% locally in milliseconds.
3. **Dual-Model Efficiency**: Primary requests use lightweight, high-performance `gemini-3.6-flash` and cascade to `gemini-3.5-flash-lite`.
4. **Resilient Local Dictionaries**: If offline, built-in curriculum dictionaries provide immediate topic suggestions.

---

*Built with ❤️ for students who want to study smarter, retain more, and eliminate exam stress.*
