from pymongo import MongoClient

from app.config import get_settings

settings = get_settings()

client = MongoClient(settings.mongo_url, serverSelectionTimeoutMS=5000, connect=False)
db = client[settings.db_name]

faculties = db["faculties"]
classes = db["classes"]
duties = db["duties"]
deadlines = db["deadlines"]
risk_scores = db["risk_scores"]
suggestions = db["suggestions"]