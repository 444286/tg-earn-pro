const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({

  telegramId: String,
  amount: Number,

  method: String,   // bkash / nagad
  number: String,   // wallet number

  status: {
    type: String,
    default: "pending"
  },

  reason: {
    type: String,
    default: ""
  },

  approvedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Withdraw", withdrawSchema);
