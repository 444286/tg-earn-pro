const tg = window.Telegram.WebApp;
tg.expand();

let user;
let telegramId;
let allWithdrawLogs = [];

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

  // Withdraw page open হলে history load
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
  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* ================= WITHDRAW ================= */

async function withdraw(){

  const msg = document.getElementById("withdrawMsg");
  msg.innerText = "";
  msg.style.color = "red";

  const amount = parseInt(document.getElementById("amount").value);
  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value;

  if(!amount || !method || !number){
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
    msg.innerText = "Withdraw request submitted";

    loadWithdrawLogs(); // history refresh

  }else{
    msg.style.color = "red";
    msg.innerText = data.msg;
  }
}

/* ================= WITHDRAW HISTORY ================= */

async function loadWithdrawLogs() {

  const res = await fetch("/api/user/withdraws/" + telegramId);
  allWithdrawLogs = await res.json();

  renderLogs("all");
}

function filterLogs(status) {
  renderLogs(status);
}

function renderLogs(status) {

  const container = document.getElementById("withdrawLogs");
  const pendingBox = document.getElementById("pendingTotal");

  container.innerHTML = "";

  let logs = allWithdrawLogs;

  if(status !== "all"){
    logs = allWithdrawLogs.filter(w => w.status === status);
  }

  // Calculate total pending
  let pendingAmount = 0;
  allWithdrawLogs.forEach(w=>{
    if(w.status === "pending"){
      pendingAmount += w.amount;
    }
  });

  if(pendingBox){
    pendingBox.innerHTML = "Total Pending: ৳ " + pendingAmount;
  }

  if(logs.length === 0){
    container.innerHTML = "<p style='opacity:0.6'>No transactions found.</p>";
    return;
  }

  logs.forEach(w => {

    let statusClass = "status-pending";
    let icon = "⏳";
    let statusText = "Pending";

    if(w.status === "approved"){
      statusClass = "status-approved";
      icon = "✔";
      statusText = "Approved";
    }

    if(w.status === "rejected"){
      statusClass = "status-rejected";
      icon = "✖";
      statusText = "Rejected";
    }

    container.innerHTML += `
      <div class="withdraw-card">

        <div class="withdraw-amount">৳ ${w.amount}</div>

        <div class="status-badge ${statusClass}">
          ${icon} ${statusText}
        </div>

        <div style="margin-top:6px;font-size:13px;opacity:0.8;">
          Wallet: ${w.method}
        </div>

        <div style="font-size:13px;opacity:0.8;">
          Number: ${w.number}
        </div>

        ${w.reason ? `
          <div class="reject-reason">
            Rejected Amount: ৳ ${w.amount}<br>
            Reason: ${w.reason}
          </div>
        ` : ""}

        ${w.approvedAt ? `
          <div style="font-size:12px;color:#28a745;margin-top:4px;">
            Approved at: ${new Date(w.approvedAt).toLocaleString()}
          </div>
        ` : ""}

        <div class="withdraw-date">
          Requested: ${new Date(w.createdAt).toLocaleString()}
        </div>

      </div>
    `;
  });
}

/* ================= DAILY ================= */

async function dailyBonus(){
  await fetch("/api/daily-bonus",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });
  loadUser();
}

/* ================= AD ================= */

async function watchAd(){

  await fetch("/api/ad-start",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });

  alert("Stay 2 minutes...");

  setTimeout(async ()=>{
    await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:user.telegramId})
    });
    loadUser();
  },120000);
}

loadUser();
