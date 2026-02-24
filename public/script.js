const tg = window.Telegram.WebApp;
tg.expand();

let telegramId = null;
let AdController = null;
let adCooldown = false;

/* Navigation */
function showPage(id, el){

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>{
    n.classList.remove("active");
  });

  if(el){
    el.classList.add("active");
  }
}

/* AdsGram Init */
window.addEventListener("load", () => {
  if(window.Adsgram){
    AdController = window.Adsgram.init({
      blockId: "int-23635"
    });
  }
});

/* Load User */
async function loadUser(){

  if(!tg.initDataUnsafe?.user) return;

  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  const res = await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId,
      username:tgUser.first_name
    })
  });

  const user = await res.json();

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

    const res = await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId})
    });

    const data = await res.json();

    if(data.msg === "Daily limit reached"){
      text.innerText = "Daily Limit Reached (35)";
      btn.disabled = true;
      return;
    }

    document.getElementById("balance").innerText = data.balance;
    document.getElementById("todayAds").innerText = data.todayAds+" / 35";
    document.getElementById("totalEarn").innerText = data.totalEarn;

    adCooldown = true;
    btn.disabled = true;

    let seconds = 30;
    text.innerText = `⏳ ${seconds}s`;

    const interval = setInterval(()=>{
      seconds--;
      text.innerText = `⏳ ${seconds}s`;
      progress.style.width = ((30-seconds)/30)*100 + "%";

      if(seconds <= 0){
        clearInterval(interval);
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
