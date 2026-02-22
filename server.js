require("dotenv").config();
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

/* =========================
   DATABASE CONNECT
========================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* =========================
   HELPER FUNCTIONS
========================= */

function generateReferral() {
  return Math.random().toString(36).substring(2, 8);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

/* =========================
   USER LOGIN / REGISTER
========================= */

app.post("/api/user", async (req, res) => {
  const { telegramId, username, ref } = req.body;

  let user = await User.findOne({ telegramId });

  if (!user) {
    const referralCode = generateReferral();

    user = new User({
      telegramId,
      username,
      referralCode
    });

    // Referral Logic
    if (ref && ref !== telegramId) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        user.referredBy = refUser.telegramId;
        refUser.balance += 10;
        refUser.inviteCount += 1;
        refUser.totalEarn += 10;
        await refUser.save();
      }
    }

    await user.save();
  }

  // Daily Reset
  if (user.lastAdDate !== todayDate()) {
    user.todayAds = 0;
    user.lastAdDate = todayDate();
    await user.save();
  }

  res.json(user);
});

/* =========================
   WATCH AD (MAX 35/DAY)
========================= */

app.post("/api/watch-ad", async (req, res) => {
  const { telegramId } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (user.blocked) return res.json({ msg: "Blocked" });

  if (user.todayAds >= 35) {
    return res.json({ msg: "Daily limit reached" });
  }

  user.balance += 5;
  user.totalEarn += 5;
  user.todayAds += 1;

  await user.save();

  res.json(user);
});

/* =========================
   DAILY BONUS (1 TIME)
========================= */

app.post("/api/daily-bonus", async (req, res) => {
  const { telegramId } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (user.lastBonus === todayDate()) {
    return res.json({ msg: "Already claimed" });
  }

  user.balance += 10;
  user.totalEarn += 10;
  user.lastBonus = todayDate();

  await user.save();

  res.json(user);
});

/* =========================
   WITHDRAW REQUEST
========================= */

app.post("/api/withdraw", async (req, res) => {
  const { telegramId, amount, method, number } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (amount < 200) {
    return res.json({ msg: "Minimum withdraw 200" });
  }

  if (user.balance < amount) {
    return res.json({ msg: "Insufficient balance" });
  }

  user.balance -= amount;
  await user.save();

  const wd = new Withdraw({
    telegramId,
    amount,
    method,
    number
  });

  await wd.save();

  res.json({ msg: "Withdraw request sent" });
});

/* =========================
   GET WITHDRAW HISTORY
========================= */

app.get("/api/withdraw/:telegramId", async (req, res) => {
  const data = await Withdraw.find({ telegramId: req.params.telegramId });
  res.json(data);
});

/* =========================
   ADMIN LOGIN
========================= */

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ msg: "Invalid credentials" });
  }
});

/* =========================
   ADMIN AUTH MIDDLEWARE
========================= */

function verifyAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ msg: "No token" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
}

/* =========================
   ADMIN ROUTES
========================= */

app.get("/api/admin/users", verifyAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get("/api/admin/withdraws", verifyAdmin, async (req, res) => {
  const wd = await Withdraw.find();
  res.json(wd);
});

app.post("/api/admin/approve", verifyAdmin, async (req, res) => {
  const { id } = req.body;

  await Withdraw.findByIdAndUpdate(id, { status: "approved" });
  res.json({ msg: "Approved" });
});

app.post("/api/admin/reject", verifyAdmin, async (req, res) => {
  const { id } = req.body;

  const wd = await Withdraw.findById(id);
  const user = await User.findOne({ telegramId: wd.telegramId });

  user.balance += wd.amount;
  await user.save();

  wd.status = "rejected";
  await wd.save();

  res.json({ msg: "Rejected & Refunded" });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
