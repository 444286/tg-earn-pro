const tg = window.Telegram.WebApp;
tg.expand();

let user;

/* ================= PAGE SWITCH ================= */

function showPage(id, element){

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>{
    n.classList.remove("active");
  });

  if(element){
    element.classList.add("active");
  }
}

/* ================= LOAD USER SAFE ================= */

async function loadUser(){

  if(!tg.initDataUnsafe || !tg.initDataUnsafe.user){
    console.log("Open inside Telegram");
    return;
  }

  const tgUser = tg.initDataUnsafe.user;
  const deviceId = navigator.userAgent;

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:String(tgUser.id),
      username:tgUser.first_name,
      deviceId
    })
  });

  user = await res.json();

  // UI update
  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];
  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* ================= AD SYSTEM ================= */

async function watchAd(){

  await fetch("/api/ad-start",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });

  alert("Stay at least 2 minutes...");

  setTimeout(async ()=>{

    let res = await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:user.telegramId})
    });

    let data = await res.json();

    if(data.balance !== undefined){
      document.getElementById("balance").innerText = data.balance;
      document.getElementById("todayAds").innerText =
        data.todayAds+" / 35";
      document.getElementById("totalEarn").innerText =
        data.totalEarn;
    }else{
      alert(data.msg);
    }

  },120000);
}

/* ================= DAILY BONUS ================= */

async function dailyBonus(){

  let res = await fetch("/api/daily-bonus",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });

  let data = await res.json();

  if(data.balance !== undefined){
    document.getElementById("balance").innerText = data.balance;
    document.getElementById("totalEarn").innerText = data.totalEarn;
  }else{
    alert(data.msg);
  }
}

/* ================= WITHDRAW ================= */

async function withdraw(){

  const amount = parseInt(document.getElementById("amount").value);
  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value;

  const msgBox = document.getElementById("withdrawMsg");
  msgBox.innerText = "";

  if(!amount || !method || !number){
    msgBox.innerText = "All fields required";
    return;
  }

  let res = await fetch("/api/withdraw",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:user.telegramId,
      amount,
      method,
      number
    })
  });

  let data = await res.json();

  if(data.msg === "Withdraw request sent"){

    user.balance -= amount;
    document.getElementById("balance").innerText = user.balance;

    msgBox.style.color = "#00ff99";
    msgBox.innerText = "Withdraw request sent successfully";

  } else {
    msgBox.style.color = "red";
    msgBox.innerText = data.msg;
  }
}

    // balance auto update
    user.balance -= amount;
    document.getElementById("balance").innerText = user.balance;

    alert("Withdraw successful");
  }else{
    alert(data.msg);
  }
}

/* ================= INIT ================= */

loadUser();
