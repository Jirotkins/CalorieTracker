# CalorieTracker API

A RESTful backend for a calorie and nutrition tracking application, built with Python and FastAPI.

## Current Status & Next Steps
 **Backend completed:** The API is fully functional with robust architecture.
 **Next goal:** I am currently preparing to build a modern **Progressive Web App (PWA)** frontend using **React, Vite, and Tailwind CSS v4** to consume this API and deliver a native-like mobile experience.

## Features

- **Auth**: Secure JWT registration and login.
- **Dual-Layer Catalog**: Private user food lists alongside a globally shared, crowdsourced database.
- **Barcode Scanner**: Integration with the **Open Food Facts API** to automatically fetch unknown products.
- **Migrations**: Database schema version control using Alembic.
- **Validation**: Strict request/response checking using Pydantic.

## Tech Stack

- FastAPI, SQLite, SQLAlchemy (ORM), Alembic (Migrations), Pydantic, PyJWT, Passlib.

## Project Architecture

- `api/` - API routing and endpoints
- `crud/` - Database operations
- `models/` - SQLAlchemy models
- `schemas/` - Pydantic validation schemas
- `services/` - External integrations (OpenFoodFacts)

## How to run locally

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy alembic pydantic passlib bcrypt pyjwt
   ```
3. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```
4. Visit the interactive API documentation at: **`http://127.0.0.1:8000/docs`**
