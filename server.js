require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

const User = require("./models/User");
const Withdraw = require("./models/Withdraw");
const adminAuth = require("./middleware/auth");

// USER LOGIN
app.post("/login", async(req,res)=>{
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
});

// AD REWARD
app.post("/reward
