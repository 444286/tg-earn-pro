const tg = window.Telegram.WebApp;
tg.expand();

let user;

async function loadUser(){

  const tgUser = tg.initDataUnsafe.user;

  const deviceId = navigator.userAgent;

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:tgUser.id,
      username:tgUser.first_name,
      deviceId
    })
  });

  user = await res.json();

  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

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

  loadUser();
  alert("Withdraw sent");
}

loadUser();
