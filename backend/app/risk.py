from datetime import datetime, timedelta
from typing import List

from app.models import ClassSession, Deadline, Duty, Faculty, RiskFactors


def parse_tm(value: str) -> datetime:
    return datetime.strptime(value, "%H:%M")


def analyze_schedule(sessions: List[ClassSession]) -> dict:
    by_day: dict[str, List[ClassSession]] = {}
    for s in sessions:
        by_day.setdefault(s.day, []).append(s)

    total_hours = 0.0
    consecutive_blocks = 0
    max_consecutive_hours = 0.0
    min_break = float("inf")
    breaks: List[int] = []

    for day_sessions in by_day.values():
        day_sessions.sort(key=lambda s: parse_tm(s.start_time))
        run_hours = 0.0
        prev_end = None
        for s in day_sessions:
            start, end = parse_tm(s.start_time), parse_tm(s.end_time)
            hours = (end - start).total_seconds() / 3600
            total_hours += hours
            if prev_end is not None:
                gap = (start - prev_end).total_seconds() / 60
                breaks.append(gap)
                if gap <= 30:
                    consecutive_blocks += 1
                    run_hours += hours
                else:
                    max_consecutive_hours = max(max_consecutive_hours, run_hours)
                    run_hours = hours
                min_break = min(min_break, gap)
            else:
                run_hours += hours
            prev_end = end
        max_consecutive_hours = max(max_consecutive_hours, run_hours)

    if not breaks:
        min_break = 0.0
    avg_break = sum(breaks) / len(breaks) if breaks else 0.0

    return {
        "total_hours": round(total_hours, 1),
        "consecutive_blocks": consecutive_blocks,
        "max_consecutive_hours": round(max_consecutive_hours, 1),
        "avg_break_minutes": round(avg_break, 1),
        "min_break_minutes": round(min_break, 1),
    }


def _clamp(v: float) -> float:
    return max(0.0, min(100.0, v))


def level_for(score: float) -> str:
    if score >= 70:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 30:
        return "Moderate"
    return "Low"


def compute_risk(faculty: Faculty, sessions: List[ClassSession],
                 duties: List[Duty], deadlines: List[Deadline]) -> tuple[float, RiskFactors]:
    sessions = [s if isinstance(s, ClassSession) else ClassSession(**s) for s in sessions]
    duties = [d if isinstance(d, Duty) else Duty(**d) for d in duties]
    deadlines = [d if isinstance(d, Deadline) else Deadline(**d) for d in deadlines]
    sch = analyze_schedule(sessions)
    duties_hours = round(sum(d.hours_per_week for d in duties), 1)
    now = datetime.now()
    upcoming = [d for d in deadlines if now <= d.due_date <= now + timedelta(days=14)]
    deadline_pressure = round(
        sum(d.effort_hours / max(1.0, (d.due_date - now).days) for d in upcoming), 2
    )

    total_hours = round(sch["total_hours"] + duties_hours, 1)
    contract = faculty.contract_hours * faculty.fte
    load_ratio = round(total_hours / contract, 2) if contract else 1.0

    # Weighted sub-scores (each 0-100)
    load_score = _clamp((load_ratio - 1.0) * 150)
    schedule_score = _clamp(
        (sch["consecutive_blocks"] * 15)
        + (max(0.0, sch["max_consecutive_hours"] - 3.0) * 12)
        + (max(0.0, 30.0 - sch["min_break_minutes"]) * 1.5)
    )
    duty_score = _clamp((duties_hours * 6) + (len(duties) * 4))
    deadline_score = _clamp(deadline_pressure * 30)

    score = _clamp(
        load_score * 0.30
        + schedule_score * 0.25
        + duty_score * 0.20
        + deadline_score * 0.15
        + (load_score * 0.10)  # stretch bonus for utilization on top
    )

    level = level_for(score)

    factors = RiskFactors(
        total_hours=total_hours,
        contract_hours=contract,
        load_ratio=load_ratio,
        consecutive_blocks=sch["consecutive_blocks"],
        max_consecutive_hours=sch["max_consecutive_hours"],
        avg_break_minutes=sch["avg_break_minutes"],
        min_break_minutes=sch["min_break_minutes"],
        duties_hours=duties_hours,
        duties_count=len(duties),
        deadlines_days=len(upcoming),
        deadline_pressure=deadline_pressure,
    )
    return round(score, 1), factors