const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null
    },

    plaidTransactionId: {
      type: String,
      default: null
    },

    merchant: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },

    category: {
      type: String,
      default: "Other"
    },

    date: {
      type: Date,
      required: true
    },

    source: {
      type: String,
      enum: ["manual", "plaid"],
      default: "manual"
    },

    currency: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, date: -1 });

transactionSchema.index(
  { userId: 1, plaidTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      plaidTransactionId: { $type: "string" }
    }
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
