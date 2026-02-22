const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId:String,
  username:String,
  balance:{type:Number, default:0},
  referralCode:String,
  lastDaily:String
});

module.exports = mongoose.model("User", UserSchema);
