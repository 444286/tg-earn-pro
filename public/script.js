const tg = window.Telegram.WebApp;
tg.expand();

let user;
let telegramId;
let AdController;
let adCooldown = false;
let cooldownTimer = null;

/* AdsGram Init */
window.addEventListener("load", () => {
  if (window.Adsgram) {
    AdController = window.Adsgram.init({
      blockId: "int-23635"
    });
  }
});

/* Navigation */
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>{
    n.classList.remove("active");
  });
  if(el) el.classList.add("active");
}

/* Load User */
async function loadUser(){

  if(!tg.initDataUnsafe || !tg.initDataUnsafe.user){
    return;
  }

  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  let res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId:telegramId,
      username:tgUser.first_name
    })
  });

  user = await res.json();

  document.getElementById("username").innerText = tgUser.first_name;
  document.getElementById("avatar").innerText = tgUser.first_name[0];
  document.getElementById("balance").innerText = user.balance;
  document.getElementById("todayAds").innerText = user.todayAds+" / 35";
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* Watch Ad */
async function watchAd(){

  const btn = document.getElementById("adBtn");
  const text = document.getElementById("adText");
  const progress = document.getElementById("progressBar");

  if(adCooldown) return;

  if(!AdController){
    alert("Ad not ready");
    return;
  }

  try{

    await AdController.show();

    let res = await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:telegramId})
    });

    let data = await res.json();

    if(data.msg === "Daily limit reached"){
      text.innerText = "Daily Limit Reached (35)";
      btn.disabled = true;
      return;
    }

    loadUser();

    adCooldown = true;
    btn.disabled = true;

    let seconds = 30;
    let total = 30;

    text.innerText = `⏳ ${seconds}s`;

    cooldownTimer = setInterval(()=>{
      seconds--;
      text.innerText = `⏳ ${seconds}s`;

      let percent = ((total - seconds) / total) * 100;
      progress.style.width = percent + "%";

      if(seconds <= 0){
        clearInterval(cooldownTimer);
        btn.disabled = false;
        text.innerText = "🎬 এড দেখুন (+5)";
        progress.style.width = "0%";
        adCooldown = false;
      }

    },1000);

  }catch(e){
    console.log("Ad closed");
  }
}

loadUser();
