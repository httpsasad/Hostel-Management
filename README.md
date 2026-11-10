# HostelOS — Smart Student Hostel Management Platform

A commercial-grade, multi-tenant B2B SaaS platform for universities, student hostels, and multi-branch residential operators.

---

## 🏗 Architecture Overview

```
Hostel Management/
├── frontend/             # Next.js 14+ (App Router) + TypeScript + Tailwind CSS PWA
│   ├── src/app/          # Layout, Global styles, Role-specific Dashboard
│   ├── src/lib/          # API Client & Data Interfaces
│   └── public/           # Static assets, Web App Manifest
│
├── backend/              # Python FastAPI Modular Monolith
│   ├── app/core/         # Config, Database Engine, Argon2 Password Hashing, JWT Auth
│   ├── app/models/       # Multi-tenant SQLAlchemy Models (Organizations, Hostels, Beds, Students, Invoices)
│   ├── app/schemas/      # Pydantic Schemas & Data Contracts
│   ├── app/api/v1/       # Versioned REST API Endpoints (Auth, Hostels, Rooms, Students, Gate/Complaints)
│   ├── main.py           # Application Entrypoint & OpenAPI Router
│   └── requirements.txt  # Python Dependencies
│
├── docs/                 # Architectural specifications, ERD, and runbooks
└── HostelOS_Advanced_Complete_Project_Roadmap.pdf # Master 11-page project roadmap
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend API (FastAPI)

```bash
cd backend

# Activate virtual environment
.\venv\Scripts\activate   # Windows PowerShell

# Start FastAPI dev server with auto-reload
uvicorn main:app --reload --port 8000
```

* API Docs (Swagger UI): **`http://127.0.0.1:8000/api/v1/docs`**
* Health Check: **`http://127.0.0.1:8000/health`**

---

### 2. Run the Frontend Dashboard (Next.js)

```bash
cd frontend

# Start Next.js development server
npm run dev
```

* Frontend Application: **`http://localhost:3000`**

---

## 🔒 Security & Multi-Tenant Design

* **Tenant Root:** Every business table is strictly scoped with `organization_id` and `hostel_id`.
* **Bed Allocation Engine:** Double-booking prevention enforced transactionally.
* **Authentication:** Passwords securely hashed with **Argon2id**. Rotating JWT tokens with RBAC.
* **Smart Gate & Outpass:** Real-time timestamped audit logs with QR verification and offline cache readiness.
