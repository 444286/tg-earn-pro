const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema({
  telegramId:String,
  amount:Number,
  status:{type:String, default:"pending"}
});

module.exports = mongoose.model("Withdraw", WithdrawSchema);
