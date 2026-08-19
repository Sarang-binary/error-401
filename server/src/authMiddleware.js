import { Session } from "./models/Session.js";
import { User } from "./models/User.js";
import { hashToken, verifyToken } from "./jwtUtils.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header. Use: Bearer <token>" });
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ error: "Missing or malformed Authorization header. Use: Bearer <token>" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token has expired, please log in again." });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token." });
      }
      throw err;
    }

    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return res.status(401).json({ error: "Session not found or revoked. Please log in again." });
    }

    if (!decoded.sub) {
      return res.status(401).json({ error: "Session is invalid. Please log in again." });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: "User account no longer exists." });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || null,
      designation: user.designation || null,
      university: session.university || user.university,
      campus: session.campus || user.campus,
      facultyId: user.facultyId ? user.facultyId.toString() : null,
      sessionId: session.sessionId,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires role ${roles.join(" or ")}, you are ${req.user.role}.`,
      });
    }
    next();
  };
}