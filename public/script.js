const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let telegramId;
let AdController;
let cooldown = false;
let lastBalance = 0;

window.addEventListener("load", () => {
  if (window.Adsgram) {
    AdController = window.Adsgram.init({
      blockId: "int-23635"
    });
  }
  loadUser();
});

/* ================= NAV ================= */
function showPage(id, el) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
  el.classList.add("active");
}

/* ================= BALANCE ANIMATION ================= */
function animateBalance(newBalance) {
  const el = document.getElementById("balance");
  const el2 = document.getElementById("balanceWithdraw");

  let start = lastBalance;
  let end = newBalance;
  let duration = 500;
  let startTime = null;

  function animate(time) {
    if (!startTime) startTime = time;
    let progress = Math.min((time - startTime) / duration, 1);
    let value = Math.floor(start + (end - start) * progress);

    if (el) el.innerText = value;
    if (el2) el2.innerText = value;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  lastBalance = newBalance;
}

/* ================= LOAD USER ================= */
async function loadUser() {
  if (!tg.initDataUnsafe?.user) return;

  const tgUser = tg.initDataUnsafe.user;
  telegramId = String(tgUser.id);

  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId,
      username: tgUser.first_name || "No Name"
    })
  });

  const data = await res.json();
  if (!data) return;

  if (data.blocked) {
    alert("Account Blocked");
    Telegram.WebApp.close();
    return;
  }

  document.getElementById("username").innerText = tgUser.first_name || "User";
  document.getElementById("userid").innerText = telegramId;
  document.getElementById("avatar").innerText =
    (tgUser.first_name || "U").charAt(0).toUpperCase();

  animateBalance(data.balance || 0);

  if (document.getElementById("totalEarn"))
    document.getElementById("totalEarn").innerText = data.totalEarn || 0;

  if (document.getElementById("todayAds"))
    document.getElementById("todayAds").innerText =
      (data.todayAds || 0) + "/35";

  if (document.getElementById("progressFill"))
    document.getElementById("progressFill").style.width =
      ((data.todayAds || 0) / 35) * 100 + "%";

  loadWithdrawHistory();
}

/* ================= WATCH AD ================= */
async function watchAd() {
  if (cooldown) return;

  const btn = document.getElementById("adBtn");
  const cd = document.getElementById("countdownText");

  try {
    await AdController.show();

    const res = await fetch("/api/ad-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId })
    });

    const data = await res.json();
    if (data.success) await loadUser();

    cooldown = true;
    btn.disabled = true;

    let sec = 30;
    cd.innerText = "পুনরায় " + sec + "s পরে";

    const timer = setInterval(() => {
      sec--;
      cd.innerText = "পুনরায় " + sec + "s পরে";
      if (sec <= 0) {
        clearInterval(timer);
        cooldown = false;
        btn.disabled = false;
        cd.innerText = "";
      }
    }, 1000);

  } catch {
    console.log("Ad closed");
  }
}

/* ================= TG TASK AUTO CHECK ================= */
async function handleTGTask(button, channel, reward) {

  const key = "joined_" + channel;
  const last = localStorage.getItem(key);

  // 24 hour disable check
  if (last && Date.now() - parseInt(last) < 86400000) {
    button.innerText = "Completed";
    button.disabled = true;
    return;
  }

  // Open channel
  Telegram.WebApp.openTelegramLink("https://t.me/" + channel);

  // Wait 4 seconds then check
  setTimeout(async () => {

    button.innerText = "Checking...";
    button.disabled = true;

    try {
      const res = await fetch("/api/check-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          channel,
          reward
        })
      });

      const data = await res.json();

      if (data.success) {
        button.innerText = "Completed";
        localStorage.setItem(key, Date.now());
        loadUser();
      } else {
        button.innerText = "Join";
        button.disabled = false;
        alert("Join channel first!");
      }

    } catch {
      button.innerText = "Join";
      button.disabled = false;
    }

  }, 4000);
}

/* ================= WITHDRAW ================= */
async function withdraw() {

  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value.trim();
  const amount = parseInt(document.getElementById("amount").value);

  if (!amount || !number) {
    alert("সব ঘর পূরণ করুন");
    return;
  }

  if (amount < 1000) {
    alert("Minimum withdraw 1000 টাকা");
    return;
  }

  const btn = document.querySelector("#wallet button");
  btn.disabled = true;
  btn.innerText = "Processing...";

  try {

    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, amount, method, number })
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById("number").value = "";
      document.getElementById("amount").value = "";
      await loadUser();
      btn.innerText = "✅ Success";
    } else {
      alert(data.message || "Withdraw failed");
      btn.innerText = "❌ Failed";
    }

  } catch {
    btn.innerText = "❌ Failed";
  }

  setTimeout(() => {
    btn.innerText = "Request Withdraw";
    btn.disabled = false;
  }, 2000);
}

/* ================= WITHDRAW HISTORY ================= */
async function loadWithdrawHistory() {
  const box = document.getElementById("withdrawHistory");
  if (!box || !telegramId) return;

  const res = await fetch("/api/user/withdraws/" + telegramId);
  const data = await res.json();

  box.innerHTML = "";

  if (!data || data.length === 0) {
    box.innerHTML = "<p style='opacity:0.6'>No Withdraw Yet</p>";
    return;
  }

  data.forEach(w => {
    box.innerHTML += `
    <div class="withdraw-item">
      <strong>৳ ${w.amount}</strong>
      <span>${w.status.toUpperCase()}</span>
    </div>`;
  });
}

/* ================= REF COPY ================= */
function copyRef() {

  const input = document.getElementById("refLink");

  if (!input) return;

  // Modern method
  if (navigator.clipboard) {
    navigator.clipboard.writeText(input.value)
      .then(() => {
        alert("Referral link copied!");
      })
      .catch(() => {
        fallbackCopy(input);
      });
  } else {
    fallbackCopy(input);
  }
}

/* Fallback */
function fallbackCopy(input) {
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Referral link copied!");
}