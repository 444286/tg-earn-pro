require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const User = require("./models/User");
const Withdraw = require("./models/Withdraw"); // 🔥 NEW

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

function todayDate(){
  return new Date().toISOString().split("T")[0];
}

/* USER LOGIN */
app.post("/api/user", async (req,res)=>{

  const { telegramId, username } = req.body;

  if(!telegramId) return res.json({msg:"Invalid ID"});

  let user = await User.findOne({telegramId});

  if(!user){
    user = new User({
      telegramId,
      username,
      balance:0,
      totalEarn:0,
      todayAds:0,
      lastAdDate:todayDate()
    });
    await user.save();
  }

  if(user.lastAdDate !== todayDate()){
    user.todayAds = 0;
    user.lastAdDate = todayDate();
    await user.save();
  }

  res.json(user);
});

/* AD COMPLETE */
app.post("/api/ad-complete", async (req,res)=>{

  const { telegramId } = req.body;

  const user = await User.findOne({telegramId});
  if(!user) return res.json({msg:"User not found"});

  if(user.todayAds >= 35){
    return res.json({msg:"Daily limit reached"});
  }

  user.balance += 20;
  user.totalEarn += 20;
  user.todayAds += 1;

  await user.save();

  res.json({ success:true }); // 🔥 FIX
});

/* 🔥 WITHDRAW API */
app.post("/api/withdraw", async (req,res)=>{

  const { telegramId, amount, method, number } = req.body;

  const user = await User.findOne({telegramId});
  if(!user) return res.json({success:false});

  // Minimum 50
  if(amount < 50){
    return res.json({success:false, message:"Minimum 50"});
  }

  if(user.balance < amount){
    return res.json({success:false, message:"Insufficient balance"});
  }

  // Balance minus
  user.balance -= amount;
  await user.save();

  // Save history
  await Withdraw.create({
    telegramId,
    amount,
    method,
    number,
    status:"pending",
    createdAt:new Date()
  });

  res.json({success:true});
});

/* 🔥 WITHDRAW HISTORY */
app.get("/api/user/withdraws/:telegramId", async (req,res)=>{

  const data = await Withdraw.find({
    telegramId:req.params.telegramId
  }).sort({createdAt:-1});

  res.json(data);
});

app.get("/",(req,res)=>{
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log("Server running"));
