const tg = window.Telegram.WebApp;
tg.expand();

let telegramId;
let AdController;

window.addEventListener("load",()=>{
  if(window.Adsgram){
    AdController = window.Adsgram.init({
      blockId:"YOUR_BLOCK_ID"
    });
  }
});

function showPage(id,el){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  el.classList.add("active");
}

async function loadUser(){
  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId,username:tgUser.first_name})
  });

  let user = await res.json();

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];
  document.getElementById("points").innerText = user.points;
  document.getElementById("totalPoints").innerText = user.totalPoints;
  document.getElementById("level").innerText = user.level;

  renderHistory(user.history || []);
  loadLeaderboard();
}

function renderHistory(history){
  const box = document.getElementById("history");
  box.innerHTML="";
  history.slice().reverse().forEach(h=>{
    box.innerHTML += `<p>+${h.points} ⭐ (${h.type})</p>`;
  });
}

async function dailyTask(){
  let res = await fetch("/api/daily-task",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId})
  });

  let data = await res.json();
  if(data.msg==="Already done") alert("Already completed today");
  loadUser();
}

async function spin(){
  let res = await fetch("/api/spin",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId})
  });

  let data = await res.json();
  alert("You won "+data.reward+" points!");
  loadUser();
}

async function quiz(correct){
  await fetch("/api/quiz",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId,correct})
  });

  if(correct) alert("Correct! +4 points");
  else alert("Wrong answer");

  loadUser();
}

async function referral(){
  await fetch("/api/referral",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId})
  });

  alert("Referral bonus added!");
  loadUser();
}

async function watchAd(){
  if(!AdController){
    alert("Ad not active yet");
    return;
  }

  try{
    await AdController.show();
    await fetch("/api/bonus-ad",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId})
    });
    loadUser();
  }catch(e){
    console.log("Ad closed");
  }
}

async function loadLeaderboard(){
  let res = await fetch("/api/leaderboard");
  let data = await res.json();

  const box = document.getElementById("leaderboard");
  box.innerHTML="";
  data.forEach((u,i)=>{
    box.innerHTML += `<p>${i+1}. ${u.username} - ${u.totalPoints} ⭐</p>`;
  });
}

loadUser();
