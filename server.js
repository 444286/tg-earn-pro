require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

function today(){
  return new Date().toISOString().split("T")[0];
}

const UserSchema = new mongoose.Schema({
  telegramId:String,
  username:String,
  points:{type:Number,default:0},
  totalPoints:{type:Number,default:0},
  level:{type:Number,default:1},
  lastDaily:String,
  referrals:{type:Number,default:0},
  history:[
    {
      type:String,
      points:Number,
      date:String
    }
  ]
});

const User = mongoose.model("User",UserSchema);

/* USER LOAD */
app.post("/api/user", async(req,res)=>{
  const {telegramId,username} = req.body;

  let user = await User.findOne({telegramId});

  if(!user){
    user = new User({telegramId,username});
    await user.save();
  }

  res.json(user);
});

/* DAILY TASK */
app.post("/api/daily-task", async(req,res)=>{
  const {telegramId} = req.body;
  const user = await User.findOne({telegramId});

  if(user.lastDaily === today())
    return res.json({msg:"Already done"});

  user.points += 3;
  user.totalPoints += 3;
  user.lastDaily = today();

  user.history.push({
    type:"Daily Activity",
    points:3,
    date:today()
  });

  checkLevel(user);

  await user.save();
  res.json(user);
});

/* SPIN */
app.post("/api/spin", async(req,res)=>{
  const {telegramId} = req.body;
  const user = await User.findOne({telegramId});

  const reward = Math.floor(Math.random()*10)+1;

  user.points += reward;
  user.totalPoints += reward;

  user.history.push({
    type:"Spin Reward",
    points:reward,
    date:today()
  });

  checkLevel(user);

  await user.save();
  res.json({reward});
});

/* QUIZ */
app.post("/api/quiz", async(req,res)=>{
  const {telegramId,correct} = req.body;
  const user = await User.findOne({telegramId});

  if(correct){
    user.points += 4;
    user.totalPoints += 4;

    user.history.push({
      type:"Quiz Reward",
      points:4,
      date:today()
    });
  }

  checkLevel(user);

  await user.save();
  res.json(user);
});

/* REFERRAL */
app.post("/api/referral", async(req,res)=>{
  const {telegramId} = req.body;
  const user = await User.findOne({telegramId});

  user.points += 5;
  user.totalPoints += 5;
  user.referrals += 1;

  user.history.push({
    type:"Referral Bonus",
    points:5,
    date:today()
  });

  checkLevel(user);

  await user.save();
  res.json(user);
});

/* BONUS AD */
app.post("/api/bonus-ad", async(req,res)=>{
  const {telegramId} = req.body;
  const user = await User.findOne({telegramId});

  user.points += 5;
  user.totalPoints += 5;

  user.history.push({
    type:"Ad Bonus",
    points:5,
    date:today()
  });

  checkLevel(user);

  await user.save();
  res.json(user);
});

/* LEADERBOARD */
app.get("/api/leaderboard", async(req,res)=>{
  const users = await User.find().sort({totalPoints:-1}).limit(10);
  res.json(users);
});

function checkLevel(user){
  const newLevel = Math.floor(user.totalPoints / 50)+1;
  user.level = newLevel;
}

app.listen(5000,()=>console.log("Server running"));
