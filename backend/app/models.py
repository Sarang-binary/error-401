from datetime import datetime

from pydantic import BaseModel, Field
from typing import Optional


class Faculty(BaseModel):
    name: str
    email: str
    department: str
    designation: str = "Assistant Professor"
    contract_hours: float = 40.0
    fte: float = 1.0
    joined: Optional[datetime] = None


class ClassSession(BaseModel):
    faculty_id: str
    course_code: str
    course_name: str
    day: str  # Monday..Friday
    start_time: str  # "09:00"
    end_time: str  # "10:30"
    credits: float = 1.0
    room: Optional[str] = None
    semester: str = "Fall 2026"


class Duty(BaseModel):
    faculty_id: str
    title: str
    category: str = "Administrative"  # Administrative | Committee | Mentoring | Research | Exam
    hours_per_week: float = 2.0
    semester: str = "Fall 2026"


class Deadline(BaseModel):
    faculty_id: str
    title: str
    due_date: datetime
    effort_hours: float = 5.0
    semester: str = "Fall 2026"


class RiskFactors(BaseModel):
    total_hours: float
    contract_hours: float
    load_ratio: float
    consecutive_blocks: int
    max_consecutive_hours: float
    avg_break_minutes: float
    min_break_minutes: float
    duties_hours: float
    duties_count: int
    deadlines_days: int
    deadline_pressure: float


class RiskScore(BaseModel):
    faculty_id: str
    score: float = Field(ge=0, le=100)
    level: str  # Low | Moderate | High | Critical
    factors: RiskFactors
    computed_at: datetime


class Suggestion(BaseModel):
    faculty_id: str
    type: str  # swap_class | rebalance_duty | shift_deadline | add_break
    title: str
    detail: str
    impact_points: float
    created_at: datetime = Field(default_factory=datetime.now)