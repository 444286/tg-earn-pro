const tg = window.Telegram.WebApp;
tg.expand();

let user;

/* NAVIGATION */
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  if(el) el.classList.add("active");
}

/* LOAD USER */
async function loadUser(){

  if(!tg.initDataUnsafe || !tg.initDataUnsafe.user){
    console.log("Open inside Telegram");
    return;
  }

  const tgUser = tg.initDataUnsafe.user;

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:String(tgUser.id),
      username:tgUser.first_name,
      deviceId:navigator.userAgent
    })
  });

  user = await res.json();

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];
  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* AD */
async function watchAd(){

  await fetch("/api/ad-start",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });

  alert("Stay 2 minutes...");

  setTimeout(async ()=>{
    let res = await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:user.telegramId})
    });

    let data = await res.json();

    if(data.balance !== undefined){
      document.getElementById("balance").innerText = data.balance;
      document.getElementById("todayAds").innerText = data.todayAds+" / 35";
      document.getElementById("totalEarn").innerText = data.totalEarn;
    }

  },120000);
}

/* DAILY */
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
  }
}

/* WITHDRAW */
async function withdraw(){

  const amount = parseInt(document.getElementById("amount").value);
  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value;
  const msg = document.getElementById("withdrawMsg");

  msg.innerText = "";

  if(!amount || !method || !number){
    msg.style.color = "red";
    msg.innerText = "All fields required";
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

    msg.style.color = "#00ff99";
    msg.innerText = "Withdraw successful";
  }else{
    msg.style.color = "red";
    msg.innerText = data.msg;
  }
}

loadUser();
