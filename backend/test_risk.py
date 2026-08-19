import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models import ClassSession, Deadline, Duty, Faculty
from app.risk import compute_risk

f = Faculty(name="Test", email="t@u.edu", department="CS",
            designation="Professor", contract_hours=40.0, fte=1.0)

sessions = [
    ClassSession(faculty_id="x", course_code="A", course_name="A", day="Monday", start_time="08:30", end_time="10:00"),
    ClassSession(faculty_id="x", course_code="B", course_name="B", day="Monday", start_time="10:15", end_time="11:45"),
    ClassSession(faculty_id="x", course_code="C", course_name="C", day="Monday", start_time="12:00", end_time="13:30"),
    ClassSession(faculty_id="x", course_code="D", course_name="D", day="Tuesday", start_time="08:30", end_time="10:00"),
    ClassSession(faculty_id="x", course_code="E", course_name="E", day="Tuesday", start_time="10:15", end_time="11:45"),
]
duties = [Duty(faculty_id="x", title="Exam Coordinator", category="Exam", hours_per_week=8.0)]
deadlines = [Deadline(faculty_id="x", title="Papers", due_date=__import__("datetime").datetime.now().replace(hour=23, minute=59) + __import__("datetime").timedelta(days=3), effort_hours=10.0)]

score, factors = compute_risk(f, sessions, duties, deadlines)
print(f"score={score} factors={factors.model_dump()}")

f2 = Faculty(name="Calm", email="c@u.edu", department="CS",
             designation="Professor", contract_hours=40.0, fte=1.0)
s2 = [
    ClassSession(faculty_id="y", course_code="A", course_name="A", day="Monday", start_time="10:15", end_time="11:45"),
    ClassSession(faculty_id="y", course_code="B", course_name="B", day="Wednesday", start_time="14:00", end_time="15:30"),
]
score2, factors2 = compute_risk(f2, s2, [], [])
print(f"score={score2} factors={factors2.model_dump()}")

assert score > score2, "overloaded faculty must score higher"
assert factors.consecutive_blocks == 3, factors.consecutive_blocks
print("OK")