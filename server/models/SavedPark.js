const mongoose = require("mongoose");

const SavedParkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  key: { type: String, required: true },
  park: { type: String, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

SavedParkSchema.index({ user: 1, key: 1 }, { unique: true });

SavedParkSchema.pre("validate", function(next) {
  if (this.key) this.key = String(this.key).trim().toLowerCase();
  if (this.park) this.park = String(this.park).trim();
  if (!this.park) this.park = this.key;
  next();
});

module.exports = mongoose.model("SavedPark", SavedParkSchema);