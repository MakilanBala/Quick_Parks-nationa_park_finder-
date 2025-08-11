const SavedPark = require("../models/SavedPark");

exports.list = async (req, res) => {
  const rows = await SavedPark.find({ user: req.userId }).select("key park").sort({ createdAt: -1 }).lean();
  res.json({ data: rows });
};

exports.save = async (req, res) => {
  let { key, park } = req.body || {};
  if (!key) return res.status(400).json({ message: "key required" });
  key = String(key).trim().toLowerCase();
  park = park ? String(park).trim() : key;

  // Idempotent upsert
  const existing = await SavedPark.findOne({ user: req.userId, key });
  if (existing) return res.status(200).json({ ok: true });

  await SavedPark.create({ user: req.userId, key, park });
  res.status(201).json({ ok: true });
};

exports.removeOne = async (req, res) => {
  const key = String(req.params.key || "").trim().toLowerCase();
  await SavedPark.deleteOne({ user: req.userId, key });
  res.json({ ok: true });
};

exports.clear = async (_req, res) => {
  await SavedPark.deleteMany({ user: _req.userId });
  res.json({ ok: true });
};