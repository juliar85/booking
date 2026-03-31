import os
from datetime import date
from pathlib import Path
from typing import Annotated, Any
from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware
from auth_users import ensure_seed_teacher, get_teacher_by_email, verify_password
from db import get_conn, init_db, sum_booked, teacher_booking_for_slot
from schedule_config import BUILDINGS, FLOORS, LAPTOPS_PER_FLOOR

BASE_DIR = Path(__file__).resolve().parent
SECRET_KEY = os.getenv("SESSION_SECRET", "dev-change-me-in-production")

app = FastAPI(title="Школьное бронирование ноутбуков")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY, session_cookie="laptop_session")

# Авто-создание папок при запуске
for folder in ["static", "templates", "data"]:
    (BASE_DIR / folder).mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

@app.on_event("startup")
def startup():
    init_db()
    ensure_seed_teacher()

def current_teacher(request: Request):
    tid = request.session.get("teacher_id")
    if not tid: return None
    return {"id": tid, "email": request.session.get("teacher_email"), "name": request.session.get("teacher_name")}

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    teacher = current_teacher(request)
    if not teacher: return RedirectResponse("/login")
    return templates.TemplateResponse("buildings.html", {"request": request, "buildings": BUILDINGS, "teacher": teacher})

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
def login_submit(request: Request, email: Annotated[str, Form()], password: Annotated[str, Form()]):
    with get_conn() as conn:
        row = get_teacher_by_email(conn, email)
        if not row or not verify_password(password, row["password_hash"]):
            return templates.TemplateResponse("login.html", {"request": request, "error": "Ошибка входа"})
        request.session.update({"teacher_id": row["id"], "teacher_email": row["email"], "teacher_name": row["display_name"]})
    return RedirectResponse("/", status_code=302)

@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login")

@app.get("/book/{building_id}", response_class=HTMLResponse)
def book_page(request: Request, building_id: str):
    teacher = current_teacher(request)
    if not teacher: return RedirectResponse("/login")
    building = next(b for b in BUILDINGS if b["id"] == building_id)
    return templates.TemplateResponse("book.html", {
        "request": request, "building": building, "teacher": teacher, 
        "floors": FLOORS, "today": date.today().isoformat(), "cap": LAPTOPS_PER_FLOOR
    })

@app.get("/api/availability")
def api_availability(building_id: str, booking_date: str, floor: int, request: Request):
    tid = request.session.get("teacher_id")
    with get_conn() as conn:
        lessons = []
        for i in range(1, 9):
            used = sum_booked(conn, building_id, booking_date, floor, i)
            mine = teacher_booking_for_slot(conn, tid, building_id, booking_date, floor, i)
            lessons.append({
                "lesson": i, "label": f"Урок {i}", "booked_total": used, 
                "remaining": LAPTOPS_PER_FLOOR - used, "my_quantity": mine["quantity"] if mine else 0
            })
    return {"lessons": lessons}
