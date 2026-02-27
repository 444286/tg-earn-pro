const tg = window.Telegram.WebApp;
tg.expand();

let telegramId;
let AdController;
let cooldown=false;
let lastBalance = 0;

window.addEventListener("load",()=>{
  if(window.Adsgram){
    AdController = window.Adsgram.init({
      blockId:"int-23635"
    });
  }
  loadUser();
});

/* ================= NAV ================= */
function showPage(id,el){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  el.classList.add("active");
}

/* ================= BALANCE ANIMATION ================= */
function animateBalance(newBalance){
  const el = document.getElementById("balance");
  const el2 = document.getElementById("balanceWithdraw");

  let start = lastBalance;
  let end = newBalance;
  let duration = 500;
  let startTime = null;

  function animate(time){
    if(!startTime) startTime = time;
    let progress = Math.min((time-startTime)/duration,1);
    let value = Math.floor(start + (end-start)*progress);
    if(el) el.innerText = value;
    if(el2) el2.innerText = value;
    if(progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  lastBalance = newBalance;
}

/* ================= LOAD USER ================= */
async function loadUser(){

  if(!tg.initDataUnsafe?.user) return;

  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  let deviceId = localStorage.getItem("device_id");

  if(!deviceId){
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  const res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId,
      username: tgUser.first_name,
      deviceId
    })
  });

  const data = await res.json();

  if(data.deviceBlocked){
    alert("This device already used by another account.");
    Telegram.WebApp.close();
    return;
  }

  if(data.blocked){
    alert("Your account has been blocked.");
    Telegram.WebApp.close();
    return;
  }

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("userid").innerText = telegramId;
  document.getElementById("avatar").innerText =
    tgUser.first_name.charAt(0).toUpperCase();

  animateBalance(data.balance || 0);

  document.getElementById("totalEarn").innerText = data.totalEarn || 0;
  document.getElementById("todayAds").innerText = (data.todayAds || 0)+"/35";

  document.getElementById("progressFill").style.width =
    ((data.todayAds || 0)/35*100)+"%";

  document.getElementById("refLink").value =
    "https://t.me/loyalti_app_bot?start="+telegramId;

  loadWithdrawHistory();
}