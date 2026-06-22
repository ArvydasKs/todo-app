from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import HTTPException
from app.database import Base, engine
from app.routers import users, tasks, categories

if engine:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo App")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(categories.router)


_no_cache = {"Cache-Control": "no-store"}


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith(("/auth", "/categories")):
        return JSONResponse({"detail": "Not found"}, status_code=404)
    return FileResponse("static/404.html", status_code=404)


@app.get("/")
def root():
    return FileResponse("static/index.html", headers=_no_cache)


@app.get("/login")
def login_page():
    return FileResponse("static/login.html", headers=_no_cache)


@app.get("/categories")
def categories_page():
    return FileResponse("static/categories.html", headers=_no_cache)


@app.get("/calendar")
def calendar_page():
    return FileResponse("static/calendar.html", headers=_no_cache)