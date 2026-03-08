const tg = window.Telegram.WebApp;
tg.expand();

let telegramId;

let AdControllerInterstitial;
let AdControllerReward;
const smartlink = "https://omg10.com/4/10689589";
let cooldown=false;
let lastBalance = 0;

window.addEventListener("load",()=>{

if(window.Adsgram){

AdControllerInterstitial = window.Adsgram.init({
blockId:"int-23635"
});

AdControllerReward = window.Adsgram.init({
blockId:"23638"
});

}

loadUser();

});

/* NAV */
function showPage(id,el){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");
document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
el.classList.add("active");
}

/* BALANCE ANIMATION */
function animateBalance(newBalance){
const el = document.getElementById("balance");
const el2 = document.getElementById("balanceWithdraw");

let start = lastBalance;
let end = newBalance;
let duration = 500;
let startTime = null;

function animate(time){
if(!startTime) startTime = time;
let progress = Math.min((time-startTime)/duration,1);
let value = Math.floor(start + (end-start)*progress);
el.innerText = value;
el2.innerText = value;
if(progress < 1) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
lastBalance = newBalance;
}

/* LOAD USER */
async function loadUser(){

if(!tg.initDataUnsafe?.user) return;

const tgUser = tg.initDataUnsafe.user;
telegramId = String(tgUser.id);

const res = await fetch("/api/user",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({ telegramId })
});

const data = await res.json();
if(!data) return;

/* BLOCK CHECK */
if(data.blocked){
alert("Chek your internet connection...");
Telegram.WebApp.close();
return;
}

document.getElementById("username").innerText = tgUser.first_name;
document.getElementById("userid").innerText = telegramId;
document.getElementById("avatar").innerText =
tgUser.first_name.charAt(0).toUpperCase();

animateBalance(data.balance || 0);

document.getElementById("totalEarn").innerText = data.totalEarn || 0;
document.getElementById("todayAds").innerText = (data.todayAds || 0)+"/35";

document.getElementById("progressFill").style.width =
((data.todayAds || 0)/35*100)+"%";

document.getElementById("refLink").value =
"https://t.me/loyalti_app_bot?start="+telegramId;

/* AUTO DETECT COMPLETED TASKS */

if(data.completedTasks){

["task1","task2","task3"].forEach(task=>{

if(data.completedTasks.includes(task)){

const btn = document.getElementById(task+"Btn");

if(btn){
btn.innerText = "Completed";
btn.classList.add("completed");
btn.disabled = true;
}

}

});

}

loadWithdrawHistory();

}

/* WATCH AD */

async function watchAd(){

if(cooldown) return;

const btn=document.getElementById("adBtn");
const cd=document.getElementById("countdownText");

btn.disabled=true;

/* SMARTLINK */

openSmartlink();
await new Promise(r => setTimeout(r,2000));


try{

/* MONETAG */

await showMonetag();

/* ADSGRAM INTERSTITIAL */

try{

if(AdControllerInterstitial){
await AdControllerInterstitial.show();
}

}catch(e){
console.log("Adsgram failed");
}

/* MONETAG */

await showMonetag();

/* REWARD */

const res = await fetch("/api/ad-complete",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({telegramId})
});

const data = await res.json();

if(data.limit){
alert("Daily 35 ads limit reached!");
btn.disabled=true;
return;
}

if(data.success){
await loadUser();
}

}catch(e){
console.log("Ad chain stopped");
}

/* COOLDOWN */

cooldown=true;

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

}

/* WITHDRAW */

async function withdraw(){

const method = document.getElementById("method").value;
const number = document.getElementById("number").value.trim();
const amount = parseInt(document.getElementById("amount").value);

if(!amount || !number){
alert("সব ঘর পূরণ করুন");
return;
}

if(amount < 500){
alert("Minimum withdraw 500 টাকা");
return;
}

const btn = document.querySelector("#wallet button");
btn.disabled = true;
btn.innerText = "Processing...";

try{

/* MONETAG 1 */

try{
await showMonetag();
}catch(e){
console.log("Monetag failed");
}

/* ADSGRAM REWARDED */

try{
if(AdControllerReward){
await AdControllerReward.show();
}
}catch(e){
console.log("Adsgram reward failed");
}

/* MONETAG 2 */

try{
await showMonetag();
}catch(e){
console.log("Monetag 2 failed");
}

/* WITHDRAW REQUEST */

const res = await fetch("/api/withdraw",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({telegramId,amount,method,number})
});

const data = await res.json();

if(data.success){

await loadUser();
await loadWithdrawHistory();

document.getElementById("number").value="";
document.getElementById("amount").value="";

btn.innerText = "✅ Withdraw Success";

}else{

btn.innerText = "❌ Withdraw Failed";

}

setTimeout(()=>{
btn.innerText = "Request Withdraw";
btn.disabled = false;
},3000);

}catch{

btn.innerText = "❌ Error";

setTimeout(()=>{
btn.innerText = "Request Withdraw";
btn.disabled = false;
},3000);

}

}

/* WITHDRAW HISTORY */

async function loadWithdrawHistory(){

const box=document.getElementById("withdrawHistory");

if(!telegramId) return;

const res=await fetch("/api/user/withdraws/"+telegramId);
const data=await res.json();

box.innerHTML="";

if(!data || data.length===0){
box.innerHTML="<p style='opacity:0.6'>No Withdraw Yet</p>";
return;
}

data.forEach(w=>{

let statusClass="status-pending";

if(w.status==="approved") statusClass="status-approved";
if(w.status==="rejected") statusClass="status-rejected";

box.innerHTML+=`
<div class="withdraw-item">
<strong>৳ ${w.amount}</strong>
<span class="status-badge ${statusClass}">
${w.status.toUpperCase()}
</span>
<div style="font-size:12px;opacity:0.7;">
${new Date(w.createdAt).toLocaleString()}
</div>
${w.reason ? `<div class="reject-reason">Reason: ${w.reason}</div>`:""}
</div>
`;

});

}

/* REF COPY */

function copyRef(){

const input=document.getElementById("refLink");

input.select();

document.execCommand("copy");

alert("Referral link copied");

}

/* TASK SYSTEM */

function startTask(taskId, link){

const btn = document.getElementById(taskId+"Btn");

window.open(link,"_blank");

btn.innerText = "Checking...";
btn.disabled = true;

setTimeout(()=>{
checkTask(taskId);
},5000);

}

async function checkTask(taskId){

const btn = document.getElementById(taskId+"Btn");

const res = await fetch("/api/verify-task",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({ telegramId, taskId })
});

const data = await res.json();

if(data.success){

btn.innerText = "Completed";
btn.classList.add("completed");
btn.disabled = true;

await loadUser();

}else{

btn.innerText = "Start";
btn.disabled = false;

alert("Join channel first!");

}

}

function showMonetag(){

return new Promise((resolve)=>{

try{

show_10692813().then(()=>{

resolve();

}).catch(()=>{

resolve();

});

}catch{

resolve();

}

});

}






function openSmartlink(){

try{

const a = document.createElement("a");
a.href = smartlink;
a.target = "_blank";
a.rel = "noopener noreferrer";

document.body.appendChild(a);
a.click();

document.body.removeChild(a);

}catch{
console.log("Smartlink failed");
}

}