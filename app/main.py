from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import Base, engine
from app.routers import users, tasks, categories

if engine:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo App")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(categories.router)


@app.get("/")
def root():
    return FileResponse("static/index.html")


@app.get("/login")
def login_page():
    return FileResponse("static/login.html")


@app.get("/categories")
def categories_page():
    return FileResponse("static/categories.html")


@app.get("/health")
def health():
    return {"status": "ok"}