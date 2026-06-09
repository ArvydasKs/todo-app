from fastapi import FastAPI
from app.database import Base, engine
from app.routers import users, tasks

if engine:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo App")

app.include_router(users.router)
app.include_router(tasks.router)


@app.get("/")
def root():
    return {"message": "Todo API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}