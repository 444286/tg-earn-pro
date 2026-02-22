const tg = window.Telegram.WebApp;
tg.expand();

let user;

function showPage(id, element){

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>{
    n.classList.remove("active");
  });

  element.classList.add("active");
}

async function loadUser(){
  const tgUser = tg.initDataUnsafe.user;

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:tgUser.id,
      username:tgUser.first_name
    })
  });

  user = await res.json();

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];
  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;

  document.getElementById("refLink").innerText =
    `https://t.me/YOUR_BOT_USERNAME/app?startapp=${user.referralCode}`;
}

async function watchAd(){
  await fetch("/api/watch-ad",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });
  loadUser();
}

async function dailyBonus(){
  await fetch("/api/daily-bonus",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:user.telegramId})
  });
  loadUser();
}

async function withdraw(){
  const amount = document.getElementById("amount").value;
  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value;

  await fetch("/api/withdraw",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:user.telegramId,
      amount,
      method,
      number
    })
  });

  alert("Withdraw request sent");
}

function copyRef(){
  navigator.clipboard.writeText(
    document.getElementById("refLink").innerText
  );
  alert("Copied");
}

loadUser();
