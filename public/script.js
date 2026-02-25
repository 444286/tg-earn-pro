const tg = window.Telegram.WebApp;
tg.expand();

let telegramId;
let AdController;
let cooldown=false;

window.addEventListener("load",()=>{
  if(window.Adsgram){
    AdController = window.Adsgram.init({
      blockId:"int-23635"
    });
  }
});

function showPage(id,el){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  el.classList.add("active");
}

async function loadUser(){
  const tgUser=tg.initDataUnsafe.user;
  telegramId=String(tgUser.id);

  const res=await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telegramId,
      username:tgUser.first_name
    })
  });

  const user=await res.json();

  document.getElementById("username").innerText=tgUser.first_name;
  document.getElementById("userid").innerText=telegramId;
  document.getElementById("avatar").innerText=tgUser.first_name[0];

  document.getElementById("balance").innerText=user.balance;
  document.getElementById("totalEarn").innerText=user.totalEarn;
  document.getElementById("todayAds").innerText=user.todayAds+"/35";

  document.getElementById("progressFill").style.width=(user.todayAds/35*100)+"%";
}

async function watchAd(){

  if(cooldown) return;

  const btn=document.getElementById("adBtn");
  const text=document.getElementById("countdownText");

  try{
    await AdController.show();

    await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId})
    });

    loadUser();

    cooldown=true;
    btn.disabled=true;

    let sec=30;
    text.innerText="৩০ সেকেন্ড অপেক্ষা করুন";

    const timer=setInterval(()=>{
      sec--;
      text.innerText="পুনরায় বিজ্ঞাপন দেখতে "+sec+"s";
      if(sec<=0){
        clearInterval(timer);
        cooldown=false;
        btn.disabled=false;
        text.innerText="";
      }
    },1000);

  }catch(e){
    console.log("Ad closed");
  }
}

loadUser();
