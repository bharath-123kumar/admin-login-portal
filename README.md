# Qatar Foundation Admin Portal

A full-stack administrative portal for managing opportunities and certifications, built with Flask and Vite.

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── app.py           # Flask entry point
│   ├── models.py        # SQLAlchemy models
│   ├── routes/
│   │   ├── auth.py      # Auth APIs (Signup, Login, Forgot Password)
│   │   └── opportunities.py # Opportunity CRUD APIs
│   ├── database.db      # SQLite database (auto-generated)
│   ├── requirements.txt # Python dependencies
│   └── config.py        # App configurations
│
├── frontend/
│   ├── index.html       # Main UI
│   ├── style.css        # Styles
│   ├── main.js         # API integration & UI logic
│   └── package.json     # Vite setup
│
└── README.md
```

## 🚀 Local Setup

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on: `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🌍 Deployment

### Backend (Render)
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Env Vars**: 
  - `DATABASE_URL`: Your PostgreSQL URL
  - `JWT_SECRET_KEY`: A long random string
  - `SECRET_KEY`: A long random string

### Frontend (Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework Preset**: `Vite`

---

## 🔐 API Endpoints

### Auth
- `POST /api/signup`: full_name, email, password, confirm_password
- `POST /api/login`: email, password
- `POST /api/forgot-password`: email (Generates token in logs)

### Opportunities (Requires JWT)
- `GET    /api/opportunities`: List all
- `POST   /api/opportunities`: Create new
- `GET    /api/opportunities/<id>`: Get details
- `PUT    /api/opportunities/<id>`: Update
- `DELETE /api/opportunities/<id>`: Delete
