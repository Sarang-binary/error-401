import mongoose from "mongoose";

const factorSchema = new mongoose.Schema(
  {
    total_hours: Number,
    contract_hours: Number,
    load_ratio: Number,
    consecutive_blocks: Number,
    max_consecutive_hours: Number,
    avg_break_minutes: Number,
    min_break_minutes: Number,
    duties_hours: Number,
    duties_count: Number,
    deadlines_days: Number,
    deadline_pressure: Number,
  },
  { _id: false }
);

export const Faculty = mongoose.model(
  "Faculty",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      department: { type: String, required: true },
      designation: { type: String, default: "Assistant Professor" },
      contract_hours: { type: Number, default: 40 },
      fte: { type: Number, default: 1 },
      joined: { type: Date },
      university: { type: String },
      campus: { type: String },
    },
    { collection: "faculties", versionKey: false }
  )
);

export const ClassSession = mongoose.model(
  "ClassSession",
  new mongoose.Schema(
    {
      faculty_id: { type: String, required: true },
      course_code: { type: String, required: true },
      course_name: { type: String, required: true },
      day: { type: String, required: true },
      start_time: { type: String, required: true },
      end_time: { type: String, required: true },
      credits: { type: Number, default: 1 },
      room: { type: String },
      semester: { type: String, default: "Fall 2026" },
    },
    { collection: "classes", versionKey: false }
  )
);

export const Duty = mongoose.model(
  "Duty",
  new mongoose.Schema(
    {
      faculty_id: { type: String, required: true },
      title: { type: String, required: true },
      category: { type: String, default: "Administrative" },
      hours_per_week: { type: Number, default: 2 },
      semester: { type: String, default: "Fall 2026" },
    },
    { collection: "duties", versionKey: false }
  )
);

export const Deadline = mongoose.model(
  "Deadline",
  new mongoose.Schema(
    {
      faculty_id: { type: String, required: true },
      title: { type: String, required: true },
      due_date: { type: Date, required: true },
      effort_hours: { type: Number, default: 5 },
      semester: { type: String, default: "Fall 2026" },
    },
    { collection: "deadlines", versionKey: false }
  )
);

export const RiskScore = mongoose.model(
  "RiskScore",
  new mongoose.Schema(
    {
      faculty_id: { type: String, required: true, unique: true },
      score: { type: Number, required: true },
      level: { type: String, required: true },
      factors: { type: factorSchema, required: true },
      computed_at: { type: Date, required: true },
    },
    { collection: "risk_scores", versionKey: false }
  )
);

export const Suggestion = mongoose.model(
  "Suggestion",
  new mongoose.Schema(
    {
      faculty_id: { type: String, required: true },
      type: { type: String, required: true },
      title: { type: String, required: true },
      detail: { type: String, required: true },
      impact_points: { type: Number, default: 0 },
      created_at: { type: Date, default: Date.now },
    },
    { collection: "suggestions", versionKey: false }
  )
);

export function docToApi(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ versionKey: false }) : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  return obj;
}