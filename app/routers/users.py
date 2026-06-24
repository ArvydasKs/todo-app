from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db : Session = Depends(get_db)):
    if not user.username.strip() or not user.email.strip() or not user.password.strip():
        raise HTTPException(status_code=400, detail="All fields required")

    parts = user.email.split('@')
    if len(parts) != 2 or '.' not in parts[1]:
        raise HTTPException(status_code=400, detail="Invalid email format")

    existing = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use")

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db : Session = Depends(get_db)):
    if not form_data.username.strip() or not form_data.password.strip():
        raise HTTPException(status_code=400, detail="All fields required")

    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}  # nosec B105


@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.Task).filter(
        models.Task.owner_id == current_user.id
    ).delete()
    db.query(models.Category).filter(
        models.Category.owner_id == current_user.id
    ).delete()
    db.delete(current_user)
    db.commit()
    return {"detail": "Account deleted"}


@router.get("/settings", response_model=schemas.UserSettings)
def get_settings(
    current_user: models = Depends(auth.get_current_user)
):
    return current_user


@router.patch("/settings", response_model=schemas.UserSettings)
def update_settings(
    settings: schemas.UserSettings,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if settings.notify_overdue is not None:
        if settings.notify_overdue and not current_user.notify_overdue:
            current_user.notify_overdue_enabled_at = datetime.now(timezone.utc)
        elif not settings.notify_overdue:
            current_user.notify_overdue_enabled_at = None
        current_user.notify_overdue = settings.notify_overdue

    if settings.notify_upcoming is not None:
        if settings.notify_upcoming and not current_user.notify_upcoming:
            current_user.notify_upcoming_enabled_at = datetime.now(timezone.utc)
        elif not settings.notify_upcoming:
            current_user.notify_upcoming_enabled_at = None
        current_user.notify_upcoming = settings.notify_upcoming
        
    db.commit()
    db.refresh(current_user)
    return current_user