import random
from datetime import datetime, timedelta

from app.db import classes, deadlines, db, duties, faculties, risk_scores, suggestions
from app.models import ClassSession, Deadline, Duty, Faculty

random.seed(42)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIMES = [
    ("08:30", "10:00"), ("10:15", "11:45"), ("12:00", "13:30"),
    ("14:00", "15:30"), ("15:45", "17:15"),
]

FACULTY_SEED = [
    ("Dr. Anjali Sharma", "anjali.sharma@uni.edu", "Computer Science", "Professor", 40.0, 1.0),
    ("Dr. Rahul Verma", "rahul.verma@uni.edu", "Computer Science", "Associate Professor", 40.0, 1.0),
    ("Dr. Priya Nair", "priya.nair@uni.edu", "Computer Science", "Assistant Professor", 40.0, 0.8),
    ("Prof. Amit Desai", "amit.desai@uni.edu", "Electronics", "Professor", 40.0, 1.0),
    ("Dr. Kavita Rao", "kavita.rao@uni.edu", "Electronics", "Assistant Professor", 40.0, 1.0),
    ("Dr. Suresh Iyer", "suresh.iyer@uni.edu", "Mechanical", "Associate Professor", 40.0, 1.0),
    ("Dr. Meera Krishnan", "meera.krishnan@uni.edu", "Mechanical", "Assistant Professor", 40.0, 1.0),
    ("Prof. Vikram Singh", "vikram.singh@uni.edu", "Mathematics", "Professor", 40.0, 1.0),
    ("Dr. Neha Gupta", "neha.gupta@uni.edu", "Mathematics", "Assistant Professor", 40.0, 0.9),
    ("Dr. Arjun Menon", "arjun.menon@uni.edu", "Computer Science", "Assistant Professor", 40.0, 1.0),
]

COURSES = [
    ("CS101", "Intro to Programming"), ("CS205", "Data Structures"), ("CS310", "Databases"),
    ("CS450", "Machine Learning"), ("EC101", "Circuit Theory"), ("EC220", "Digital Logic"),
    ("EC340", "Embedded Systems"), ("ME101", "Thermodynamics"), ("ME250", "Fluid Mechanics"),
    ("ME330", "Manufacturing Processes"), ("MA101", "Calculus I"), ("MA210", "Linear Algebra"),
    ("MA320", "Probability & Statistics"),
]

DUTY_POOL = [
    ("Department Exam Coordinator", "Exam", 8.0),
    ("NAAC Accreditation Committee", "Committee", 5.0),
    ("Placement Cell Mentor", "Administrative", 6.0),
    ("Student Project Advisor", "Mentoring", 4.0),
    ("Research Grant Reviewer", "Research", 3.0),
    ("Lab Incharge", "Administrative", 5.0),
    ("Timetable Committee Member", "Committee", 2.0),
    ("PhD Scholar Mentor", "Mentoring", 4.0),
]


def clear_db():
    for col in (faculties, classes, duties, deadlines, risk_scores, suggestions):
        col.delete_many({})


def main():
    clear_db()
    now = datetime.now()
    faculty_ids = {}

    for name, email, dept, desig, contract, fte in FACULTY_SEED:
        f = Faculty(name=name, email=email, department=dept, designation=desig,
                    contract_hours=contract, fte=fte, joined=now - timedelta(days=random.randint(300, 4000)))
        fid = str(faculties.insert_one(f.model_dump()).inserted_id)
        faculty_ids[name] = fid

        n_classes = random.choices([2, 3, 4, 5], weights=[15, 35, 35, 15])[0]
        used = set()
        for _ in range(n_classes):
            course = random.choice(COURSES)
            if course in used:
                continue
            used.add(course)
            code, cname = course
            day, slot = random.choice(DAYS), random.choice(TIMES)
            classes.insert_one(ClassSession(
                faculty_id=fid, course_code=code, course_name=cname,
                day=day, start_time=slot[0], end_time=slot[1],
                credits=random.choice([1, 2, 3]), semester="Fall 2026",
            ).model_dump())

        n_duties = random.choices([0, 1, 2], weights=[40, 45, 15])[0]
        for title, cat, hrs in random.sample(DUTY_POOL, min(n_duties, len(DUTY_POOL))):
            duties.insert_one(Duty(
                faculty_id=fid, title=title, category=cat,
                hours_per_week=hrs, semester="Fall 2026",
            ).model_dump())

        n_dl = random.choices([0, 1, 2, 3], weights=[30, 40, 20, 10])[0]
        for i in range(n_dl):
            deadlines.insert_one(Deadline(
                faculty_id=fid,
                title=random.choice([
                    "Midsem exam papers evaluation", "Accreditation report submission",
                    "Research paper revision", "Course file submission",
                    "Ph.D. thesis review", "Grant proposal submission",
                ]),
                due_date=now + timedelta(days=random.randint(1, 21)),
                effort_hours=random.choice([3, 5, 8, 10]),
                semester="Fall 2026",
            ).model_dump())

    print(f"Seeded {len(FACULTY_SEED)} faculty members into '{db.name}'")
    print("Next: call POST /api/recompute to generate risk scores.")


if __name__ == "__main__":
    main()