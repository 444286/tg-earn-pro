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

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

function todayDate(){
  return new Date().toISOString().split("T")[0];
}

/* ================= USER ================= */
app.post("/api/user", async (req,res)=>{

  const { telegramId, username, ref } = req.body;
  if(!telegramId) return res.json({msg:"Invalid ID"});

  let user = await User.findOne({telegramId});

  if(user && user.blocked){
    return res.json({ blocked:true });
  }

  if(!user){

user = new User({
telegramId,
username,
balance:0,
totalEarn:0,
todayAds:0,
lastAdDate:todayDate(),
blocked:false,
referrals:0,
referredBy:null
});

await user.save();

/* REFERRAL BONUS */

if(ref && ref !== telegramId){

const refUser = await User.findOne({ telegramId: ref });

if(refUser){

user.referredBy = ref;

refUser.balance += 20;
refUser.totalEarn += 20;
refUser.referrals += 1;

await refUser.save();
await user.save();

}
}
}
  // ✅ DAILY RESET FIX
  if(user.lastAdDate !== todayDate()){
    user.todayAds = 0;
    user.lastAdDate = todayDate();
    await user.save();
  }

  res.json(user);
});

/* ================= AD COMPLETE ================= */
app.post("/api/ad-complete", async (req,res)=>{

  const { telegramId } = req.body;
  const user = await User.findOne({telegramId});
  if(!user) return res.json({msg:"User not found"});

  if(user.blocked){
    return res.json({blocked:true});
  }

  // ✅ DAILY RESET FIX (important)
  if(user.lastAdDate !== todayDate()){
    user.todayAds = 0;
    user.lastAdDate = todayDate();
  }

  // ✅ LIMIT CHECK
  if(user.todayAds >= 35){
    return res.json({
      success:false,
      limit:true,
      todayAds:user.todayAds
    });
  }

  user.balance += 10;
  user.totalEarn += 10;
  user.todayAds += 1;

  await user.save();

  res.json({
    success:true,
    todayAds:user.todayAds,
    remaining:35 - user.todayAds
  });
});

/* ================= VERIFY TG TASK ================= */
app.post("/api/verify-task", async (req,res)=>{

  const { telegramId, taskId } = req.body;
  const user = await User.findOne({ telegramId });

  if(!user) return res.json({ success:false });

  if(user.completedTasks.includes(taskId)){
    return res.json({ success:true, already:true });
  }

  let channel = null;
  let reward = 0;

  if(taskId === "task1"){
    channel = process.env.CHANNEL_1;
    reward = 10;
  }

  if(taskId === "task2"){
    channel = process.env.CHANNEL_2;
    reward = 15;
  }

  if(taskId === "task3"){
    channel = process.env.CHANNEL_3;
    reward = 20;
  }

  if(!channel) return res.json({ success:false });

  try{

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember?chat_id=${channel}&user_id=${telegramId}`
    );

    const data = await response.json();

    if(
      data.result.status === "member" ||
      data.result.status === "administrator" ||
      data.result.status === "creator"
    ){

      user.balance += reward;
      user.totalEarn += reward;
      user.completedTasks.push(taskId);

      await user.save();

      return res.json({ success:true });

    }else{
      return res.json({ success:false });
    }

  }catch{
    return res.json({ success:false });
  }
});
/* ================= WITHDRAW ================= */
app.post("/api/withdraw", async (req,res)=>{

  const { telegramId, amount, method, number } = req.body;
  const user = await User.findOne({telegramId});
  if(!user) return res.json({success:false});

  if(user.blocked){
    return res.json({blocked:true});
  }

  if(amount < 500){
    return res.json({success:false, message:"Minimum 500"});
  }

  if(user.balance < amount){
    return res.json({success:false, message:"Insufficient balance"});
  }

  user.balance -= amount;
  await user.save();

  await Withdraw.create({
    telegramId,
    amount,
    method,
    number,
    status:"pending",
    reason:"",
    createdAt:new Date()
  });

  res.json({success:true});
});

/* ================= WITHDRAW HISTORY ================= */
app.get("/api/user/withdraws/:telegramId", async (req,res)=>{
  const data = await Withdraw.find({
    telegramId:req.params.telegramId
  }).sort({createdAt:-1});
  res.json(data);
});

/* ================= ADMIN LOGIN ================= */
app.post("/api/admin/login",(req,res)=>{

  const { username, password } = req.body;

  if(username === process.env.ADMIN_USER &&
     password === process.env.ADMIN_PASS){

     const token = jwt.sign(
       { admin:true },
       process.env.JWT_SECRET,
       { expiresIn:"7d" }
     );

     return res.json({ success:true, token });
  }

  res.json({ success:false });
});

/* ================= ADMIN MIDDLEWARE ================= */
function verifyAdmin(req,res,next){

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
  const totalPending = await Withdraw.countDocuments({status:"pending"});
  res.json({ totalUsers, totalPending });
});

/* ================= ADMIN USERS ================= */
app.get("/api/admin/users", verifyAdmin, async (req,res)=>{
  const users = await User.find();
  res.json(users);
});

/* ================= ADMIN WITHDRAWS ================= */
app.get("/api/admin/withdraws", verifyAdmin, async (req,res)=>{
  const data = await Withdraw.find().sort({createdAt:-1});
  res.json(data);
});

/* ================= APPROVE ================= */
app.post("/api/admin/approve", verifyAdmin, async (req,res)=>{
  const { id } = req.body;
  await Withdraw.findByIdAndUpdate(id,{ status:"approved" });
  res.json({ success:true });
});

/* ================= REJECT + REFUND ================= */
app.post("/api/admin/reject", verifyAdmin, async (req,res)=>{
  const { id, reason } = req.body;

  const wd = await Withdraw.findById(id);
  if(!wd) return res.json({success:false});

  const user = await User.findOne({ telegramId:wd.telegramId });

  user.balance += wd.amount;
  await user.save();

  wd.status = "rejected";
  wd.reason = reason;
  await wd.save();

  res.json({ success:true });
});

/* ================= EDIT BALANCE ================= */
app.post("/api/admin/edit-balance", verifyAdmin, async (req,res)=>{
  const { telegramId, amount } = req.body;
  const user = await User.findOne({telegramId});
  if(!user) return res.json({success:false});
  user.balance = amount;
  await user.save();
  res.json({ success:true });
});

/* ================= BLOCK USER ================= */
app.post("/api/admin/block", verifyAdmin, async (req,res)=>{
  const { telegramId } = req.body;
  await User.findOneAndUpdate({ telegramId },{ blocked:true });
  res.json({ success:true });
});

/* ================= UNBLOCK USER ================= */
app.post("/api/admin/unblock", verifyAdmin, async (req,res)=>{
  const { telegramId } = req.body;
  await User.findOneAndUpdate({ telegramId },{ blocked:false });
  res.json({ success:true });
});



app.get("/",(req,res)=>{
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log("Server running"));


