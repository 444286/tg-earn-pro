require("dotenv").config();
const express = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Withdraw = require("./models/Withdraw");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

function generateReferral() {
  return Math.random().toString(36).substring(2, 8);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

/* ================= USER LOGIN ================= */

app.post("/api/user", async (req, res) => {
  const { telegramId, username, ref, deviceId } = req.body;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  let user = await User.findOne({ telegramId });

  if (!user) {

    const existingDevice = await User.findOne({ deviceId });

    user = new User({
      telegramId,
      username,
      referralCode: generateReferral(),
      deviceId,
      ipAddress: ip
    });

    if (ref && ref !== telegramId) {
      const refUser = await User.findOne({ referralCode: ref });

      if (refUser && !existingDevice) {
        user.referredBy = refUser.telegramId;
        refUser.balance += 10;
        refUser.inviteCount += 1;
        refUser.totalEarn += 10;
        await refUser.save();
      }
    }

    await user.save();
  }

  if (user.lastAdDate !== todayDate()) {
    user.todayAds = 0;
    user.lastAdDate = todayDate();
    await user.save();
  }

  res.json(user);
});

/* ================= MONETAG AD SYSTEM ================= */

app.post("/api/ad-complete", async (req, res) => {
  const { telegramId } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ msg: "User not found" });

  if (user.todayAds >= 35)
    return res.json({ msg: "Daily limit reached" });

  user.balance += 5;
  user.totalEarn += 5;
  user.todayAds += 1;

  await user.save();

  res.json(user);
});

/* ================= DAILY BONUS ================= */

app.post("/api/daily-bonus", async (req, res) => {
  const { telegramId } = req.body;

  const user = await User.findOne({ telegramId });
  if (user.lastBonus === todayDate())
    return res.json({ msg: "Already claimed" });

  user.balance += 10;
  user.totalEarn += 10;
  user.lastBonus = todayDate();
  await user.save();

  res.json(user);
});

/* ================= WITHDRAW ================= */

app.post("/api/withdraw", async (req, res) => {
  const { telegramId, amount, method, number } = req.body;

  const user = await User.findOne({ telegramId });

  if (amount < 50) return res.json({ msg: "Minimum 50" });
  if (user.balance < amount) return res.json({ msg: "Insufficient balance" });

  user.balance -= amount;
  await user.save();

  const wd = new Withdraw({
    telegramId,
    amount,
    method,
    number,
    status: "pending"
  });

  await wd.save();

  res.json({ msg: "Withdraw request sent" });
});

/* ================= USER WITHDRAW HISTORY ================= */

app.get("/api/user/withdraws/:telegramId", async (req, res) => {

  const withdraws = await Withdraw.find({
    telegramId: req.params.telegramId
  }).sort({ createdAt: -1 });

  res.json(withdraws);

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Withdraw = require("./models/Withdraw");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

function generateReferral() {
  return Math.random().toString(36).substring(2, 8);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

/* ================= USER LOGIN ================= */

app.post("/api/user", async (req, res) => {
  const { telegramId, username, ref, deviceId } = req.body;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  let user = await User.findOne({ telegramId });

  if (!user) {

    const existingDevice = await User.findOne({ deviceId });

    user = new User({
      telegramId,
      username,
      referralCode: generateReferral(),
      deviceId,
      ipAddress: ip
    });

    if (ref && ref !== telegramId) {
      const refUser = await User.findOne({ referralCode: ref });

      if (refUser && !existingDevice) {
        user.referredBy = refUser.telegramId;
        refUser.balance += 10;
        refUser.inviteCount += 1;
        refUser.totalEarn += 10;
        await refUser.save();
      }
    }

    await user.save();
  }

  if (user.lastAdDate !== todayDate()) {
    user.todayAds = 0;
    user.lastAdDate = todayDate();
    await user.save();
  }

  res.json(user);
});

/* ================= AD SYSTEM ================= */

const activeAds = {};

app.post("/api/ad-start", (req, res) => {
  const { telegramId } = req.body;
  activeAds[telegramId] = Date.now();
  res.json({ msg: "Ad started" });
});

app.post("/api/ad-complete", async (req, res) => {
  const { telegramId } = req.body;

  const startTime = activeAds[telegramId];
  if (!startTime) return res.json({ msg: "Ad not started" });

  const duration = (Date.now() - startTime) / 1000;
  if (duration < 120) return res.json({ msg: "Stay 2 minutes" });

  const user = await User.findOne({ telegramId });

  if (user.todayAds >= 35) return res.json({ msg: "Daily limit reached" });

  user.balance += 5;
  user.totalEarn += 5;
  user.todayAds += 1;

  await user.save();
  delete activeAds[telegramId];

  res.json(user);
});

/* ================= DAILY BONUS ================= */

app.post("/api/daily-bonus", async (req, res) => {
  const { telegramId } = req.body;

  const user = await User.findOne({ telegramId });
  if (user.lastBonus === todayDate())
    return res.json({ msg: "Already claimed" });

  user.balance += 10;
  user.totalEarn += 10;
  user.lastBonus = todayDate();
  await user.save();

  res.json(user);
});

/* ================= WITHDRAW ================= */

app.post("/api/withdraw", async (req, res) => {
  const { telegramId, amount, method, number } = req.body;

  const user = await User.findOne({ telegramId });

  if (amount < 50) return res.json({ msg: "Minimum 50" });
  if (user.balance < amount) return res.json({ msg: "Insufficient balance" });

  user.balance -= amount;
  await user.save();

  const wd = new Withdraw({ telegramId, amount, method, number });
  await wd.save();

  res.json({ msg: "Withdraw request sent" });
});

/* ================= USER WITHDRAW HISTORY ================= */

app.get("/api/user/withdraws/:telegramId", async (req, res) => {

  const withdraws = await Withdraw.find({
    telegramId: req.params.telegramId
  }).sort({ createdAt: -1 });

  res.json(withdraws);

});

/* ================= ADMIN ================= */

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ msg: "Invalid" });
  }
});

/* ================= ADMIN MIDDLEWARE ================= */

function verifyAdmin(req, res, next){
  const token = req.headers.authorization;
  if(!token) return res.status(403).json({msg:"No token"});

  try{
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch{
    res.status(401).json({msg:"Invalid token"});
  }
}

/* ================= ADMIN STATS ================= */

app.get("/api/admin/stats", verifyAdmin, async (req,res)=>{
  const totalUsers = await User.countDocuments();
  const totalWithdraw = await Withdraw.countDocuments();
  const totalPending = await Withdraw.countDocuments({status:"pending"});

  res.json({ totalUsers, totalWithdraw, totalPending });
});

/* ================= ADMIN USERS ================= */

app.get("/api/admin/users", verifyAdmin, async (req,res)=>{
  const users = await User.find();
  res.json(users);
});

/* ================= ADMIN WITHDRAWS ================= */

app.get("/api/admin/withdraws", verifyAdmin, async (req,res)=>{
  const wd = await Withdraw.find();
  res.json(wd);
});

/* ================= APPROVE ================= */

app.post("/api/admin/approve", verifyAdmin, async (req, res) => {

  const { id } = req.body;

  await Withdraw.findByIdAndUpdate(id, {
    status: "approved",
    approvedAt: new Date()
  });

  res.json({ msg: "Approved" });
});

/* ================= REJECT ================= */

app.post("/api/admin/reject", verifyAdmin, async (req,res)=>{
  const { id } = req.body;

  const wd = await Withdraw.findById(id);
  const user = await User.findOne({telegramId:wd.telegramId});

  user.balance += wd.amount;
  await user.save();

  wd.status="rejected";
  await wd.save();

  res.json({msg:"Rejected & Refunded"});
});

/* ================= EDIT BALANCE ================= */

app.post("/api/admin/edit-balance", verifyAdmin, async (req,res)=>{
  const { telegramId, amount } = req.body;

  const user = await User.findOne({telegramId});
  user.balance = amount;
  await user.save();

  res.json({msg:"Balance updated"});
});

/* ================= BLOCK USER ================= */

app.post("/api/admin/block", verifyAdmin, async (req,res)=>{
  const { telegramId } = req.body;
  await User.findOneAndUpdate({telegramId},{blocked:true});
  res.json({msg:"User blocked"});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
