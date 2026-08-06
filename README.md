# CalorieTracker 🍏

🔗 **Live Demo:** [https://calorie-tracker-jirotkins.duckdns.org](https://calorie-tracker-jirotkins.duckdns.org)
*(Please note: As a personal tracker, public registration is intentionally disabled. Contact me for a demo account.)*
Full-stack RESTful calorie and nutrition tracking application. This project is built to demonstrate end-to-end development skills, from robust backend API design to responsive and interactive frontend interfaces.

## 🚀 Current Status: Building the Frontend
- ✅ **Backend API:** Fully functional, documented, and containerized.
- 🚧 **Frontend:** I am currently developing the client-side Progressive Web App (PWA) to consume the API and deliver a native-like mobile experience.

## 💻 Tech Stack

### Frontend (In Development)
- **React 19** & **TypeScript** - Core UI framework and type-safety.
- **Vite** - Lightning-fast build tool and development server.
- **Tailwind CSS v4** - Utility-first styling for a highly responsive aesthetic.
- **React Router DOM** - Client-side routing.
- **Axios** - API requests handling.
- **Vite PWA Plugin** - Offline capabilities and installability.

### Backend
- **Python 3.14** & **FastAPI** - High-performance asynchronous API framework.
- **SQLAlchemy** & **Alembic** - Database ORM and schema migration version control.
- **SQLite** - Lightweight, file-based database for easy setup.
- **Pydantic** - Strict request/response data validation.
- **JWT (python-jose)** & **Passlib (bcrypt)** - Secure authentication and password hashing.
- **Open Food Facts API** - External integration for crowdsourced barcode scanning.

### Infrastructure & DevOps
- **Docker** & **Docker Compose** - Complete environment containerization for seamless local development.

---

## ✨ Key Features
- **Secure Authentication**: JWT-based registration, login, and protected routes.
- **Dual-Layer Food Catalog**: Users can maintain private food lists or query a globally shared database.
- **Barcode Scanner Support**: Integration with the Open Food Facts API to automatically fetch product nutrition data.
- **Meal Logs & Recipes**: Tracking daily nutritional intake and managing custom recipe structures.

---

## 🛠️ How to Run Locally (Docker)

The easiest way to run the entire project (both backend and frontend) is using Docker. This ensures a clean setup without needing local installations of Python or Node.js.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### 1. Start the containers
Clone the repository, open a terminal in the root folder, and run:
```bash
docker compose up --build -d
```
*This spins up both the FastAPI backend and the Vite frontend.*

### 2. Initialize the Database
Since the database starts empty, you need to apply Alembic migrations to create the tables. Find your backend container name (e.g. `calorietracker-backend-1`) and run:
```bash
docker exec -it <YOUR_BACKEND_CONTAINER_NAME> alembic upgrade head
```

### 3. Access the Application
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🌍 Production Deployment

This application is fully prepared for cloud deployment using a dedicated production setup (`docker-compose.prod.yml`).

### Infrastructure Details
- **Hosting:** Oracle Cloud Infrastructure (OCI) Free Tier.
- **Frontend Server:** Nginx (serves static files and proxies `/api` to the backend).
- **SSL / HTTPS:** Automated via [Caddy Docker Proxy](https://github.com/lucaslorentz/caddy-docker-proxy).
- **Domain:** Configured with a free DuckDNS subdomain for HTTPS PWA compatibility.
- **Live URL:** [https://calorie-tracker-jirotkins.duckdns.org](https://calorie-tracker-jirotkins.duckdns.org)

To run the production build on a server:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> *Developed with passion. Open to junior developer opportunities!*
