const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema({
  telegramId: String,
  amount: Number,
  method: String,
  number: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Withdraw", WithdrawSchema);
