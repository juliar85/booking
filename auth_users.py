import bcrypt
from db import get_conn
def hash_password(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def verify_password(pw, h): return bcrypt.checkpw(pw.encode(), h.encode())
def get_teacher_by_email(conn, email): return conn.execute('SELECT * FROM teachers WHERE email=?', (email,)).fetchone()
def ensure_seed_teacher():
    with get_conn() as conn:
        if not get_teacher_by_email(conn, 'opetaja@kool.ee'):
            conn.execute('INSERT INTO teachers (email, password_hash, display_name) VALUES (?,?,?)', ('opetaja@kool.ee', hash_password('Kool2026!'), 'Учитель'))
