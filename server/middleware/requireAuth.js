const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    try {
      const token = auth.slice(7).trim();
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      const userId = payload.sub || payload.id || payload.userId;
      if (!userId) return res.status(401).json({ message: "Invalid token payload" });
      req.user = { id: userId };
      req.userId = userId; // add this to match controllers
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  // Dev fallback only if no JWT provided
  const devId = (req.headers["x-user-id"] || "").toString().trim();
  if (devId) {
    req.user = { id: devId };
    return next();
  }

  return res.status(401).json({ message: "Missing token" });
};