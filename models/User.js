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

  referredBy: {
    type: String,
    default: null
  },

  // Total referrals
  referrals: {
    type: Number,
    default: 0
  },

  // Invite counter (can use for UI / tasks)
  inviteCount: {
    type: Number,
    default: 0
  },

  deviceId: String,
  ipAddress: String,

  completedTasks: {
    type: [String],
    default: []
  },

  blocked: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);