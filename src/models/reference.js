const mongoose = require("mongoose");
const ReferenceSchema = mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    isAdded: { type: Boolean, required: true },
    domain: { type: String, required: true, unique: true },
    organization: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Reference", ReferenceSchema);
