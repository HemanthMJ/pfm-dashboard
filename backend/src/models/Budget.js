const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyLimit: {
      type: Number,
      required: true,
      min: 0.01,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    currency: {
      type: String,
      default: "USD",
    },
  },
  { timestamps: true }
);

budgetSchema.index(
  { userId: 1, category: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
