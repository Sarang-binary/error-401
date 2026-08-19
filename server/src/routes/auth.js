import { Router } from "express";
import bcrypt from "bcryptjs";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { Faculty } from "../models/data.js";
import { config } from "../config.js";
import { authenticate } from "../authMiddleware.js";
import { hashToken, newSessionId, signToken } from "../jwtUtils.js";

const router = Router();

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || null,
    designation: user.designation || null,
    university: user.university,
    campus: user.campus,
    facultyId: user.facultyId ? user.facultyId.toString() : null,
  };
}

async function createSession(userId, role, org = {}) {
  const sessionId = newSessionId();
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);
  const token = signToken({ sub: userId, sessionId, role });

  await Session.create({
    sessionId,
    userId,
    tokenHash: hashToken(token),
    role,
    university: org.university || null,
    campus: org.campus || null,
    expiresAt,
  });
  return token;
}

router.post("/register", async (req, res, next) => {
  try {
    const { university, campus, name, email, password, role, department } = req.body || {};

    if (!university || !campus || !name || !email || !password || !role) {
      return res.status(400).json({
        error: "University, campus, name, email, password and role are all required.",
      });
    }
    if (!["teacher", "hod"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'teacher' or 'hod'." });
    }
    if (typeof password !== "string" || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and include both letters and numbers.",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    const existing = await User.findOne({
      university: String(university).trim(),
      campus: String(campus).trim(),
      email: String(email).trim().toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({
        error: "An account with this email already exists at this university and campus. Try signing in.",
      });
    }

    let facultyId = null;
    if (role === "teacher") {
      if (!department) {
        return res.status(400).json({ error: "Department is required for teacher accounts." });
      }
      let faculty = await Faculty.findOne({
        university: String(university).trim(),
        campus: String(campus).trim(),
        email: String(email).trim().toLowerCase(),
      });
      if (!faculty) {
        faculty = await Faculty.create({
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          department: String(department).trim(),
          designation: "Assistant Professor",
          contract_hours: 40,
          fte: 1,
          university: String(university).trim(),
          campus: String(campus).trim(),
        });
      }
      facultyId = faculty._id;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      university: String(university).trim(),
      campus: String(campus).trim(),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      role: role === "teacher" ? "faculty" : "hod",
      department: department ? String(department).trim() : null,
      designation: "Assistant Professor",
      facultyId,
    });

    const token = await createSession(user._id.toString(), user.role, {
      university: String(university).trim(),
      campus: String(campus).trim(),
    });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists here." });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { university, campus, email, password, role } = req.body || {};
    if (!university || !campus || !email || !password) {
      return res.status(400).json({
        error: "University, campus, email and password are all required.",
      });
    }

    const org = { university: String(university).trim(), campus: String(campus).trim() };

    let user = await User.findOne({
      university: org.university,
      campus: org.campus,
      $or: [
        { email: String(email).trim().toLowerCase() },
        { name: String(email).trim() },
      ],
    });
    let wildcard = false;
    if (!user) {
      user = await User.findOne({
        university: "*",
        campus: "*",
        $or: [
          { email: String(email).trim().toLowerCase() },
          { name: String(email).trim() },
        ],
      });
      wildcard = !!user;
    }
    if (!user) {
      return res.status(401).json({
        error: "No account found for this university, campus and username combination.",
      });
    }

    if (role === "teacher" && user.role !== "faculty") {
      return res.status(401).json({
        error: "This account is registered as a Principal/HOD. Select 'Principal / HOD' above to sign in.",
      });
    }
    if (role === "hod" && user.role !== "hod" && user.role !== "admin") {
      return res.status(401).json({
        error: "This account is registered as a Teacher. Select 'Teacher' above to sign in.",
      });
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = await createSession(user._id.toString(), user.role, org);
    if (wildcard) {
      user = { ...(user.toObject ? user.toObject() : user), university: org.university, campus: org.campus };
    }
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    await Session.deleteOne({ sessionId: req.user.sessionId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;