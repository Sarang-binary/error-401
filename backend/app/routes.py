from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.db import classes, deadlines, duties, faculties, risk_scores, suggestions
from app.models import Faculty, RiskScore, Suggestion
from app.risk import compute_risk, level_for
from app.suggest import generate_suggestions

router = APIRouter(prefix="/api")


def _faculty_doc(fid: str) -> dict:
    try:
        doc = faculties.find_one({"_id": ObjectId(fid)})
    except Exception:
        raise HTTPException(404, "Faculty not found")
    if not doc:
        raise HTTPException(404, "Faculty not found")
    return doc


def _risk_for(fid: str) -> dict | None:
    doc = risk_scores.find_one({"faculty_id": fid})
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/health")
def health():
    try:
        faculties.find_one()
        db_status = "connected"
    except Exception:
        db_status = "unreachable"
    return {"status": "ok", "database": db_status}


@router.get("/faculties")
def list_faculties():
    result = []
    for doc in faculties.find():
        fid = str(doc["_id"])
        risk = _risk_for(fid)
        result.append({
            "id": fid,
            "name": doc["name"],
            "email": doc["email"],
            "department": doc["department"],
            "designation": doc["designation"],
            "contract_hours": doc.get("contract_hours", 40),
            "fte": doc.get("fte", 1.0),
            "risk_score": risk["score"] if risk else None,
            "risk_level": risk["level"] if risk else "Unknown",
        })
    return result


@router.get("/faculties/{fid}")
def faculty_detail(fid: str):
    doc = _faculty_doc(fid)
    sess = list(classes.find({"faculty_id": fid}).sort("day", 1))
    dut = list(duties.find({"faculty_id": fid}))
    dl = list(deadlines.find({"faculty_id": fid}))
    risk = _risk_for(fid)
    sug = list(suggestions.find({"faculty_id": fid}).sort("impact_points", -1))

    for col in (sess, dut, dl, sug):
        for r in col:
            r["_id"] = str(r["_id"])

    return {
        "id": fid,
        "name": doc["name"],
        "email": doc["email"],
        "department": doc["department"],
        "designation": doc["designation"],
        "contract_hours": doc.get("contract_hours", 40),
        "fte": doc.get("fte", 1.0),
        "schedule": sess,
        "duties": dut,
        "deadlines": dl,
        "risk": risk,
        "suggestions": sug,
    }


@router.get("/dashboard")
def dashboard():
    counts = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
    total_score = 0.0
    n = 0
    dept_scores: dict[str, list[float]] = {}

    for doc in faculties.find():
        fid = str(doc["_id"])
        risk = _risk_for(fid)
        if not risk:
            continue
        counts[risk["level"]] = counts.get(risk["level"], 0) + 1
        total_score += risk["score"]
        n += 1
        dept_scores.setdefault(doc["department"], []).append(risk["score"])

    at_risk = []
    for d in faculties.find():
        fid = str(d["_id"])
        r = _risk_for(fid)
        if r and r["level"] in ("High", "Critical"):
            at_risk.append({
                "id": fid,
                "name": d["name"],
                "department": d["department"],
                "risk_score": r["score"],
                "risk_level": r["level"],
            })
    at_risk.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "risk_distribution": counts,
        "average_score": round(total_score / n, 1) if n else 0,
        "faculty_count": n,
        "at_risk": at_risk,
        "departments": [
            {"department": k, "avg_score": round(sum(v) / len(v), 1), "faculty": len(v)}
            for k, v in sorted(dept_scores.items())
        ],
        "computed_at": datetime.now().isoformat(),
    }


@router.post("/recompute")
def recompute():
    """Recompute risk scores and suggestions for all faculties."""
    now = datetime.now()
    for doc in faculties.find():
        fid = str(doc["_id"])
        sess = list(classes.find({"faculty_id": fid}))
        dut = list(duties.find({"faculty_id": fid}))
        dl = list(deadlines.find({"faculty_id": fid}))

        score, factors = compute_risk(Faculty(**doc), sess, dut, dl)
        risk_scores.replace_one(
            {"faculty_id": fid},
            RiskScore(faculty_id=fid, score=score, level=level_for(score),
                      factors=factors, computed_at=now).model_dump(),
            upsert=True,
        )

        sug = generate_suggestions(fid, sess, dut, dl, score)
        suggestions.delete_many({"faculty_id": fid})
        if sug:
            suggestions.insert_many([s.model_dump() for s in sug])

    return {"status": "ok", "faculties_processed": faculties.count_documents({})}