import logging
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.email_service import send_overdue_notification, send_upcoming_notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_deadlines():
    logger.info("Scheduler: check_deadlines running...")
    if not SessionLocal:
        logger.warning("Scheduler: SessionLocal not available")
        return

    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        now_floor = now.replace(second=0, microsecond=0)
        logger.info(f"Scheduler: now_floor = {now_floor}")

        users = db.query(models.User).filter(
            (models.User.notify_overdue.is_(True)) |  # nosec B712
            (models.User.notify_upcoming.is_(True))   # nosec B712
        ).all()

        logger.info(f"Scheduler: found {len(users)} users with notifications enabled")

        for user in users:
            tasks = db.query(models.Task).filter(
                models.Task.owner_id == user.id,
                models.Task.completed.is_(False),  # nosec B712
                models.Task.due_date.isnot(None)
            ).all()

            logger.info(f"Scheduler: user {user.email} has {len(tasks)} tasks with deadlines")

            for task in tasks:
                due = task.due_date
                if due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)

                due_floor = due.replace(second=0, microsecond=0)
                upcoming_floor = (due - timedelta(hours=1)).replace(second=0, microsecond=0)

                logger.info(f"Scheduler: task '{task.title}' due_floor={due_floor} upcoming_floor={upcoming_floor}")

                if (
                    user.notify_overdue
                    and user.notify_overdue_enabled_at
                    and due > user.notify_overdue_enabled_at
                    and now_floor == due_floor
                    and not task.overdue_notified
                ):
                    logger.info(f"Scheduler: sending overdue email for task '{task.title}'")
                    send_overdue_notification(user.email, task.title)
                    task.overdue_notified = True
                    db.commit()

                if (
                    user.notify_upcoming
                    and user.notify_upcoming_enabled_at
                    and due > user.notify_upcoming_enabled_at
                    and now_floor == upcoming_floor
                    and not task.upcoming_notified
                ):
                    logger.info(f"Scheduler: sending upcoming email for task '{task.title}'")
                    send_upcoming_notification(
                        user.email,
                        task.title,
                        due.astimezone(ZoneInfo("Europe/Vilnius")).strftime("%Y-%m-%d %H:%M")
                    )
                    task.upcoming_notified = True
                    db.commit()

    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(check_deadlines, 'interval', minutes=1)
    scheduler.start()
    logger.info("Scheduler started!")