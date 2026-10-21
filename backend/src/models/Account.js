const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    plaidAccountId: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    officialName: {
      type: String,
      default: null
    },

    type: {
      type: String,
      default: "other"
    },

    subtype: {
      type: String,
      default: null
    },

    mask: {
      type: String,
      default: null
    },

    currentBalance: {
      type: Number,
      default: 0
    },

    availableBalance: {
      type: Number,
      default: null
    },

    currency: {
      type: String,
      default: null
    },

    institutionName: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

accountSchema.index(
  { userId: 1, plaidAccountId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Account", accountSchema);
