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
  loadUser();
});

function showPage(id,el){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  el.classList.add("active");
}

async function loadUser(){
  const user=tg.initDataUnsafe.user;
  telegramId=String(user.id);

  const res=await fetch("/api/user",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId})
  });

  const data=await res.json();

  document.getElementById("balance").innerText=data.balance;
  document.getElementById("totalEarn").innerText=data.totalEarn;
  document.getElementById("todayAds").innerText=data.todayAds+"/35";
  document.getElementById("progressFill").style.width=(data.todayAds/35*100)+"%";

  document.getElementById("refLink").value=
    "https://t.me/your_bot?start="+telegramId;

  loadWithdrawHistory();
}

async function watchAd(){
  if(cooldown) return;

  const btn=document.getElementById("adBtn");
  const cd=document.getElementById("countdown");

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
    cd.innerText="পুনরায় "+sec+"s পরে";

    const timer=setInterval(()=>{
      sec--;
      cd.innerText="পুনরায় "+sec+"s পরে";
      if(sec<=0){
        clearInterval(timer);
        cooldown=false;
        btn.disabled=false;
        cd.innerText="";
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

async function withdraw(){
  const method=document.getElementById("method").value;
  const number=document.getElementById("number").value;
  const amount=parseInt(document.getElementById("amount").value);

  await fetch("/api/withdraw",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId,amount,method,number})
  });

  alert("Withdraw request sent");
  loadWithdrawHistory();
}

async function loadWithdrawHistory(){
  const res=await fetch("/api/user/withdraws/"+telegramId);
  const data=await res.json();
  const box=document.getElementById("withdrawHistory");
  box.innerHTML="";

  data.forEach(w=>{
    box.innerHTML+=`
      <div style="margin-bottom:10px;">
        <b>৳ ${w.amount}</b> - ${w.status}
        ${w.reason? `<div style="color:red;">Reason: ${w.reason}</div>`:""}
      </div>
    `;
  });
        }
