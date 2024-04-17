const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ConnectionSchema = new Schema(
  {
    alias: {
      type: String,
      required: true,
    },
    connectionId: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Connection", ConnectionSchema);