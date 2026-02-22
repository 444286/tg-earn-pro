const tg = window.Telegram.WebApp;
tg.expand();

let user;
let telegramId;
let selectedMethod = "Bkash";
let allWithdrawLogs = [];

/* METHOD SELECT */
function selectMethod(el, method){
  document.querySelectorAll(".method").forEach(m=>{
    m.classList.remove("active");
  });
  el.classList.add("active");
  selectedMethod = method;
}

/* NAVIGATION */
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>{
    n.classList.remove("active");
  });

  if(el) el.classList.add("active");

  if(id === "withdraw"){
    loadWithdrawLogs();
  }
}

/* LOAD USER */
async function loadUser(){

  if(!tg.initDataUnsafe || !tg.initDataUnsafe.user){
    console.log("Open inside Telegram");
    return;
  }

  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:telegramId,
      username:tgUser.first_name,
      deviceId:navigator.userAgent
    })
  });

  user = await res.json();

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];

  document.getElementById("usernameWithdraw").innerText = tgUser.first_name;
  document.getElementById("avatarLarge").innerText = tgUser.first_name[0];

  document.getElementById("balance").innerText = user.balance;
  document.getElementById("balanceWithdraw").innerText = user.balance;

  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* WITHDRAW */
async function withdraw(){

  const msg = document.getElementById("withdrawMsg");
  msg.innerText = "";
  msg.style.color = "red";

  const amount = parseInt(document.getElementById("amount").value);
  const number = document.getElementById("number").value;

  if(!amount || !number){
    msg.innerText = "All fields required";
    return;
  }

  let res = await fetch("/api/withdraw",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:telegramId,
      amount,
      method:selectedMethod,
      number
    })
  });

  let data = await res.json();

  if(data.msg === "Withdraw request sent"){
    msg.style.color = "#00ff99";
    msg.innerText = "Withdraw request submitted";

    loadUser();
    loadWithdrawLogs();

  }else{
    msg.innerText = data.msg;
  }
}

/* WITHDRAW HISTORY */
async function loadWithdrawLogs() {

  const res = await fetch("/api/user/withdraws/" + telegramId);
  allWithdrawLogs = await res.json();

  const container = document.getElementById("withdrawLogs");
  const pendingBox = document.getElementById("pendingTotal");

  container.innerHTML = "";

  let pendingAmount = 0;

  allWithdrawLogs.forEach(w=>{
    if(w.status === "pending"){
      pendingAmount += w.amount;
    }

    container.innerHTML += `
      <div class="withdraw-card">
        <div><strong>৳ ${w.amount}</strong> - ${w.status.toUpperCase()}</div>
        <div>Wallet: ${w.method}</div>
        <div>Number: ${w.number}</div>
        <div style="font-size:12px;opacity:0.7">
          ${new Date(w.createdAt).toLocaleString()}
        </div>
      </div>
    `;
  });

  pendingBox.innerHTML = "Total Pending: ৳ " + pendingAmount;
}

/* DAILY */
async function dailyBonus(){
  await fetch("/api/daily-bonus",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:telegramId})
  });
  loadUser();
}

/* AD */
async function watchAd(){

  await fetch("/api/ad-start",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:telegramId})
  });

  alert("Stay 2 minutes...");

  setTimeout(async ()=>{
    await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:telegramId})
    });
    loadUser();
  },120000);
}

loadUser();
