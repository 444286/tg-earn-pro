const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  username: String,

  balance: { type: Number, default: 0 },
  totalEarn: { type: Number, default: 0 },

  todayAds: { type: Number, default: 0 },
  lastAdDate: String,
  lastBonus: String,

  referralCode: String,
  referredBy: String,
  inviteCount: { type: Number, default: 0 },

  deviceId: String,
  ipAddress: String,


referrals:{
type:Number,
default:0
},

referredBy:{
type:String,
default:null
}
  // ✅ NEW FIELD
  completedTasks: {
    type: [String],
    default: []
  },

  blocked: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
