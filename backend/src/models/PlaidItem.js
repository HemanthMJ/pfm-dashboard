const mongoose = require("mongoose");

const plaidItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    accessTokenEncrypted: {
      type: String,
      required: true,
    },
    accessTokenIv: {
      type: String,
      required: true,
    },
    accessTokenAuthTag: {
      type: String,
      required: true,
    },
    institutionId: {
      type: String,
      default: null,
    },
    institutionName: {
      type: String,
      default: "Connected Institution",
    },
    cursor: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

plaidItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("PlaidItem", plaidItemSchema);
