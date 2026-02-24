require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

/* ================= USER LOGIN ================= */

app.post("/api/user", async (req, res) => {
  const { telegramId, username } = req.body;

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = new User({
      telegramId,
      username,
      balance: 0,
      totalEarn: 0,
      todayAds: 0
    });

    await user.save();
  }

  res.json(user);
});

/* ================= DAILY CHECK-IN ================= */

app.post("/api/daily-bonus", async (req, res) => {

  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) {
    return res.json({ msg: "User not found" });
  }

  const today = new Date().toISOString().split("T")[0];

  if (user.lastBonus === today) {
    return res.json({ msg: "Already claimed" });
  }

  user.balance += 2;
  user.totalEarn += 2;
  user.lastBonus = today;

  await user.save();

  res.json({ msg: "Success", balance: user.balance });

});

/* ================= OPTIONAL BONUS AD ================= */

app.post("/api/bonus-ad", async (req, res) => {

  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ msg: "User not found" });

  user.balance += 5;
  user.totalEarn += 5;

  await user.save();

  res.json({ msg: "Bonus added", balance: user.balance });

});

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
