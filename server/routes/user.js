const express = require("express");
const User = require("../models/User");
const { authMiddleware } = require("./auth");
const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

module.exports = router;
