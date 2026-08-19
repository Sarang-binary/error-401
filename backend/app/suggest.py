from typing import List

from app.models import ClassSession, Deadline, Duty, Suggestion
from app.risk import analyze_schedule, parse_tm

BREAK_THRESHOLD = 30


def generate_suggestions(faculty_id: str, sessions: List[ClassSession],
                         duties: List[Duty], deadlines: List[Deadline],
                         score: float) -> List[Suggestion]:
    suggestions: List[Suggestion] = []
    sessions = [s if isinstance(s, ClassSession) else ClassSession(**s) for s in sessions]
    duties = [d if isinstance(d, Duty) else Duty(**d) for d in duties]
    deadlines = [d if isinstance(d, Deadline) else Deadline(**d) for d in deadlines]
    sch = analyze_schedule(sessions)

    by_day: dict[str, List[ClassSession]] = {}
    for s in sessions:
        by_day.setdefault(s.day, []).append(s)

    for day, day_sessions in by_day.items():
        day_sessions.sort(key=lambda s: parse_tm(s.start_time))
        for i in range(1, len(day_sessions)):
            prev, cur = day_sessions[i - 1], day_sessions[i]
            gap = (parse_tm(cur.start_time) - parse_tm(prev.end_time)).total_seconds() / 60
            if 0 < gap <= BREAK_THRESHOLD:
                suggestions.append(Suggestion(
                    faculty_id=faculty_id,
                    type="swap_class",
                    title=f"Tight back-to-back classes on {day}",
                    detail=(f"'{prev.course_code}' ends at {prev.end_time} and "
                            f"'{cur.course_code}' starts at {cur.start_time} ({int(gap)} min gap). "
                            f"Consider swapping the later class to another day or slot."),
                    impact_points=min(15.0, (BREAK_THRESHOLD - gap) * 0.6),
                ))

    if sch["max_consecutive_hours"] > 4:
        suggestions.append(Suggestion(
            faculty_id=faculty_id,
            type="add_break",
            title="Long consecutive teaching block",
            detail=(f"Maximum consecutive teaching is {sch['max_consecutive_hours']}h. "
                    f"Insert a 30+ minute recovery break by shifting one class."),
            impact_points=10.0,
        ))

    if duties:
        heavy = max(duties, key=lambda d: d.hours_per_week)
        if heavy.hours_per_week >= 6:
            suggestions.append(Suggestion(
                faculty_id=faculty_id,
                type="rebalance_duty",
                title=f"Reassign '{heavy.title}' duty",
                detail=(f"This duty consumes {heavy.hours_per_week}h/week "
                        f"({heavy.category}). Move it to a colleague with a lighter load."),
                impact_points=heavy.hours_per_week * 3,
            ))

    if deadlines:
        soon = min(deadlines, key=lambda d: d.due_date)
        if (soon.due_date - __import__("datetime").datetime.now()).days <= 7:
            suggestions.append(Suggestion(
                faculty_id=faculty_id,
                type="shift_deadline",
                title=f"Deadline pressure: '{soon.title}'",
                detail=f"Due in {(soon.due_date - __import__('datetime').datetime.now()).days} days "
                       f"({soon.effort_hours}h effort). Extend or redistribute part of the work.",
                impact_points=5.0,
            ))

    if not suggestions and score < 30:
        suggestions.append(Suggestion(
            faculty_id=faculty_id,
            type="add_break",
            title="Workload is balanced",
            detail="No adjustment needed right now. Continue monitoring monthly.",
            impact_points=0.0,
        ))

    return suggestions