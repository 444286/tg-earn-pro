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

  user.balance += 5;
  user.totalEarn += 5;
  user.todayAds += 1;

  await user.save();

  res.json({
    balance:user.balance,
    todayAds:user.todayAds,
    totalEarn:user.totalEarn
  });

});

app.get("/",(req,res)=>{
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log("Server running"));
