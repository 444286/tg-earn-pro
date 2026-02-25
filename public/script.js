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

  document.getElementById("slot1").innerText=user.slot1+"/10 Watched";
  document.getElementById("slot2").innerText=user.slot2+"/10 Watched";
  document.getElementById("slot3").innerText=user.slot3+"/10 Watched";
  document.getElementById("slot4").innerText=user.slot4+"/10 Watched";

  document.getElementById("refLink").value=
    "https://t.me/your_bot?start="+telegramId;
}

async function watchAd(slot){

  if(cooldown) return;

  try{
    await AdController.show();

    const res=await fetch("/api/ad-complete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId,slot})
    });

    const data=await res.json();

    if(data.msg){
      alert(data.msg);
      return;
    }

    loadUser();

    cooldown=true;
    let sec=30;

    const timer=setInterval(()=>{
      sec--;
      if(sec<=0){
        clearInterval(timer);
        cooldown=false;
      }
    },1000);

  }catch(e){
    console.log("Ad closed");
  }
}

function copyRef(){
  const input=document.getElementById("refLink");
  input.select();
  document.execCommand("copy");
  alert("Copied!");
}

function shareRef(){
  tg.openTelegramLink(document.getElementById("refLink").value);
}

loadUser();
