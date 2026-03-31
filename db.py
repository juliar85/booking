import sqlite3
from contextlib import contextmanager
from pathlib import Path
DB_PATH = Path(__file__).parent / "data" / "app.db"
def init_db():
    with get_conn() as conn:
        conn.executescript('''CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, display_name TEXT);
        CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY, teacher_id INTEGER, building_id TEXT, booking_date TEXT, floor INTEGER, lesson INTEGER, quantity INTEGER, class_note TEXT, UNIQUE(teacher_id, building_id, booking_date, floor, lesson));''')
@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row
    try: yield conn; conn.commit()
    finally: conn.close()
def sum_booked(conn, bid, date, floor, lesson):
    res = conn.execute("SELECT SUM(quantity) FROM bookings WHERE building_id=? AND booking_date=? AND floor=? AND lesson=?", (bid, date, floor, lesson)).fetchone()
    return res[0] or 0
def teacher_booking_for_slot(conn, tid, bid, date, floor, lesson):
    return conn.execute("SELECT * FROM bookings WHERE teacher_id=? AND building_id=? AND booking_date=? AND floor=? AND lesson=?", (tid, bid, date, floor, lesson)).fetchone()