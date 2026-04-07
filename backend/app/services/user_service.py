import uuid
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import hash_password


def create_teacher(db: Session, email: str, first_name: str, last_name: str, temporary_password: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already exists")

    teacher = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=hash_password(temporary_password),
        role="teacher",
        is_temporary_password=True,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


def list_teachers(db: Session) -> list[User]:
    return db.query(User).filter(User.role == "teacher").all()


def delete_teacher(db: Session, teacher_id: uuid.UUID) -> None:
    user = db.query(User).filter(User.id == teacher_id).first()
    if not user:
        raise LookupError("Teacher not found")
    if user.role == "admin":
        raise PermissionError("Cannot delete admin accounts")
    db.delete(user)
    db.commit()
