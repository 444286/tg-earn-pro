let token="";

async function adminLogin(){

const username=document.getElementById("adminUser").value;
const password=document.getElementById("adminPass").value;

const res=await fetch("/api/admin/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username,password})
});

const data=await res.json();

if(data.success){
token=data.token;
document.getElementById("loginBox").style.display="none";
document.getElementById("dashboard").style.display="block";
loadStats();
loadWithdraws();
loadUsers();
}else{
alert("Login failed");
}

}

async function loadStats(){
const res=await fetch("/api/admin/stats",{headers:{authorization:token}});
const data=await res.json();

document.getElementById("totalUsers").innerText=data.totalUsers;
document.getElementById("pendingCount").innerText=data.totalPending;
}

async function loadWithdraws(){

const res=await fetch("/api/admin/withdraws",{headers:{authorization:token}});
const data=await res.json();

const box=document.getElementById("withdrawList");
box.innerHTML="";

data.forEach(w=>{
box.innerHTML+=`
<div class="card">
User: ${w.telegramId}<br>
Amount: ${w.amount}<br>
Status: ${w.status}<br>

<button onclick="approve('${w._id}')">Approve</button>
<button onclick="reject('${w._id}')">Reject</button>
</div>
`;
});

}

async function approve(id){

await fetch("/api/admin/approve",{
method:"POST",
headers:{"Content-Type":"application/json",authorization:token},
body:JSON.stringify({id})
});

loadWithdraws();
loadStats();
}

async function reject(id){

const reason=prompt("Enter reject reason");

await fetch("/api/admin/reject",{
method:"POST",
headers:{"Content-Type":"application/json",authorization:token},
body:JSON.stringify({id,reason})
});

loadWithdraws();
loadStats();
}

async function loadUsers(){

const res=await fetch("/api/admin/users",{headers:{authorization:token}});
const data=await res.json();

const box=document.getElementById("userList");
box.innerHTML="";

data.forEach(u=>{
box.innerHTML+=`
<div class="card">
${u.username} (${u.telegramId})<br>
Balance: ${u.balance}<br>

<button onclick="editBalance('${u.telegramId}')">Edit Balance</button>
<button onclick="blockUser('${u.telegramId}')">Block</button>
</div>
`;
});

}

async function editBalance(id){

const amount=prompt("Enter new balance");

await fetch("/api/admin/edit-balance",{
method:"POST",
headers:{"Content-Type":"application/json",authorization:token},
body:JSON.stringify({telegramId:id,amount})
});

loadUsers();
}

async function blockUser(id){

await fetch("/api/admin/block",{
method:"POST",
headers:{"Content-Type":"application/json",authorization:token},
body:JSON.stringify({telegramId:id})
});

alert("User blocked");
loadUsers();
  }
