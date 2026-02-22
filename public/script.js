const tg = window.Telegram.WebApp;
tg.expand();

let userData = tg.initDataUnsafe.user;

async function login(){
  let res = await fetch("/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      id:userData.id,
      username:userData.first_name
    })
  });

  let data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("username").innerText = userData.first_name;
  document.getElementById("avatar").innerText = userData.first_name[0];
}

async function watchAd(){
  await fetch("/reward",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:userData.id})
  });
  login();
}

async function daily(){
  await fetch("/daily",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:userData.id})
  });
  login();
}

login();
