require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err=>{
    console.log("Mongo Error:", err);
    process.exit(1);
});

// ===== Models =====
const User = require("./models/User");
const Withdraw = require("./models/Withdraw");
const adminAuth = require("./middleware/auth");

// ===== USER LOGIN =====
app.post("/login", async(req,res)=>{
    try{
        const { id, username } = req.body;

        let user = await User.findOne({ telegramId:id });

        if(!user){
            user = await User.create({
                telegramId:id,
                username,
                referralCode:id
            });
        }

        res.json(user);
    }catch(err){
        res.status(500).json({error:"Login error"});
    }
});

// ===== AD REWARD =====
app.post("/reward", async(req,res)=>{
    try{
        const { id } = req.body;
        let user = await User.findOne({ telegramId:id });

        if(!user) return res.status(404).json({msg:"User not found"});

        user.balance += 5;
        await user.save();

        res.json(user);
    }catch{
        res.status(500).json({error:"Reward error"});
    }
});

// ===== DAILY BONUS =====
app.post("/daily", async(req,res)=>{
    try{
        const { id } = req.body;
        let user = await User.findOne({ telegramId:id });

        if(!user) return res.status(404).json({msg:"User not found"});

        let today = new Date().toDateString();

        if(user.lastDaily !== today){
            user.balance += 20;
            user.lastDaily = today;
            await user.save();
            return res.json({success:true});
        }

        res.json({success:false});
    }catch{
        res.status(500).json({error:"Daily error"});
    }
});

// ===== WITHDRAW =====
app.post("/withdraw", async(req,res)=>{
    try{
        const { id, amount } = req.body;
        let user = await User.findOne({ telegramId:id });

        if(!user) return res.status(404).json({msg:"User not found"});

        if(user.balance >= amount){
            user.balance -= amount;
            await user.save();
            await Withdraw.create({ telegramId:id, amount });
            return res.json({success:true});
        }

        res.json({success:false});
    }catch{
        res.status(500).json({error:"Withdraw error"});
    }
});

// ===== ADMIN LOGIN =====
app.post("/admin/login", (req,res)=>{
    const { username, password } = req.body;

    if(username===process.env.ADMIN_USER &&
       password===process.env.ADMIN_PASS){

        const token = jwt.sign({admin:true}, process.env.JWT_SECRET);
        return res.json({token});
    }

    res.status(401).json({msg:"Invalid credentials"});
});

// ===== ADMIN DATA =====
app.get("/admin/users", adminAuth, async(req,res)=>{
    const users = await User.find();
    res.json(users);
});

app.get("/admin/withdraws", adminAuth, async(req,res)=>{
    const data = await Withdraw.find();
    res.json(data);
});

// ===== ROOT CHECK =====
app.get("/", (req,res)=>{
    res.send("TG Earn Pro Running 🚀");
});

// ===== PORT FIX FOR RENDER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log("Server running on port", PORT);
});
