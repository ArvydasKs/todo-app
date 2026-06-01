from fastapi import FastAPI
from app.database import Base, engine
from app.models import Task

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo App")

@app.get("/")
def root():
    return {"message": "Todo API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}