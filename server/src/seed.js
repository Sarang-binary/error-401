import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { Session } from "./models/Session.js";
import { User } from "./models/User.js";
import { ClassSession, College, Deadline, Duty, Faculty, RiskScore, Suggestion } from "./models/data.js";
import { computeRisk } from "./services/risk.js";
import { generateSuggestions } from "./services/suggest.js";
import { COLLEGES_BY_UNIVERSITY, UNIVERSITIES } from "./colleges-data.js";

const ASSIGNMENTS = [
  ["Dr. Anjali Sharma", "University of Metro", "Central Campus"],
  ["Dr. Rahul Verma", "University of Metro", "Central Campus"],
  ["Dr. Priya Nair", "University of Metro", "Central Campus"],
  ["Dr. Arjun Menon", "University of Metro", "Central Campus"],
  ["Prof. Amit Desai", "University of Metro", "Central Campus"],
  ["Dr. Kavita Rao", "University of Metro", "Central Campus"],
  ["Dr. Suresh Iyer", "University of Metro", "North Campus"],
  ["Dr. Meera Krishnan", "University of Metro", "North Campus"],
  ["Prof. Vikram Singh", "Global Institute of Technology", "Main Campus"],
  ["Dr. Neha Gupta", "Global Institute of Technology", "Main Campus"],
];

async function assignOrganizations() {
  for (const [name, university, campus] of ASSIGNMENTS) {
    await Faculty.updateOne({ name }, { university, campus });
  }
}

async function recomputeAll() {
  const now = new Date();
  let processed = 0;
  const faculties = await Faculty.find({}).lean();
  for (const doc of faculties) {
    const fid = doc._id.toString();
    const [sess, dut, dl] = await Promise.all([
      ClassSession.find({ faculty_id: fid }).lean(),
      Duty.find({ faculty_id: fid }).lean(),
      Deadline.find({ faculty_id: fid }).lean(),
    ]);
    const { score, level, factors } = computeRisk(doc, sess, dut, dl);
    await RiskScore.findOneAndUpdate(
      { faculty_id: fid },
      { faculty_id: fid, score, level, factors, computed_at: now },
      { upsert: true, setDefaultsOnInsert: true }
    );
    const suggestions = generateSuggestions(fid, sess, dut, dl, score).map((s) => ({ ...s, created_at: now }));
    await Suggestion.deleteMany({ faculty_id: fid });
    if (suggestions.length > 0) await Suggestion.insertMany(suggestions);
    processed += 1;
  }
  return processed;
}

async function createMainUser() {
  const passwordHash = await bcrypt.hash("sarang", 10);
  await User.create({
    university: "*",
    campus: "*",
    name: "Sarang",
    email: "sarang@gmail.com",
    passwordHash,
    role: "hod",
    department: "Computer Science",
    designation: "Principal / HOD",
  });
}

async function main() {
  await mongoose.connect(config.mongoUrl, { dbName: config.dbName, serverSelectionTimeoutMS: 8000 });

  await Session.deleteMany({});
  await User.deleteMany({});
  await createMainUser();

  await College.deleteMany({});
  await College.insertMany(
    UNIVERSITIES.map((name) => ({
      name,
      colleges: COLLEGES_BY_UNIVERSITY[name] || [],
    }))
  );
  const collegeCount = UNIVERSITIES.reduce(
    (sum, name) => sum + (COLLEGES_BY_UNIVERSITY[name] || []).length,
    0
  );

  await assignOrganizations();
  const processed = await recomputeAll();

  console.log(`Organization data ready in '${config.dbName}'`);
  console.log(`Seeded ${UNIVERSITIES.length} universities with ${collegeCount} colleges`);
  console.log(`Recomputed risk scores for ${processed} faculty`);
  console.log("Main demo account: sarang@gmail.com / sarang (Principal/HOD · works from ANY university and college)");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});