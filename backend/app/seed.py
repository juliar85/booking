from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.services.auth_service import hash_password


def seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        return

    admin = User(
        email=settings.admin_email,
        first_name=settings.admin_first_name,
        last_name=settings.admin_last_name,
        hashed_password=hash_password(settings.admin_password),
        role="admin",
        is_temporary_password=False,
    )
    db.add(admin)
    db.commit()
