const tg = window.Telegram.WebApp;
tg.expand();

let AdController;
let telegramId;
let user;

/* INIT ADSGRAM */
window.addEventListener("load", () => {
  if (window.Adsgram) {
    AdController = window.Adsgram.init({
      blockId: "YOUR_BLOCK_ID"
    });
  }
});

/* LOAD USER */
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
  document.getElementById("totalEarn").innerText = user.totalEarn;
}

/* DAILY CHECK-IN */
async function dailyCheckIn(){

  let res = await fetch("/api/daily-bonus",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({telegramId:telegramId})
  });

  let data = await res.json();

  if(data.msg === "Already claimed"){
    alert("Already claimed today");
  } 
  else if(data.msg === "Success"){
    alert("Daily bonus added!");
  }
  else{
    alert("Error");
  }

  loadUser();
}

/* OPTIONAL BONUS AD */
async function watchAd(){

  if(!AdController){
    alert("Ad not ready");
    return;
  }

  try{
    await AdController.show();

    await fetch("/api/bonus-ad",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({telegramId:telegramId})
    });

    loadUser();
    alert("Bonus Points Added!");

  }catch(e){
    console.log("Ad closed");
  }
}

loadUser();
