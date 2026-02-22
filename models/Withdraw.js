const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  telegramId: String,
  amount: Number,
  method: String,
  number: String,

  status: {
    type: String,
    default: "pending" // pending | approved | rejected
  },

  reason: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Withdraw", withdrawSchema);
