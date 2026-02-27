let token = "";

/* ================= LOGIN ================= */
async function adminLogin(){

  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;

  const res = await fetch("/api/admin/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username,password})
  });

  const data = await res.json();

  if(data.success){
    token = data.token;
    document.getElementById("loginBox").style.display="none";
    document.getElementById("dashboard").style.display="block";
    loadStats();
    loadWithdraws();
    loadUsers();
  }else{
    alert("Login failed");
  }
}

/* ================= STATS ================= */
async function loadStats(){
  const res = await fetch("/api/admin/stats",{headers:{authorization:token}});
  const data = await res.json();

  document.getElementById("totalUsers").innerText=data.totalUsers;
  document.getElementById("pendingCount").innerText=data.totalPending;
}

/* ================= WITHDRAW LIST ================= */
async function loadWithdraws(){

  const res=await fetch("/api/admin/withdraws",{headers:{authorization:token}});
  const data=await res.json();

  const box=document.getElementById("withdrawList");
  box.innerHTML="";

  data.forEach(w=>{

    let statusColor="#f1c40f";
    if(w.status==="approved") statusColor="green";
    if(w.status==="rejected") statusColor="red";

    box.innerHTML+=`
    <div class="card">
      <b>User ID:</b> ${w.telegramId}<br>
      <b>Amount:</b> ৳ ${w.amount}<br>
      <b>Wallet:</b> ${w.method}<br>
      <b>Account:</b> ${w.number}
      <button onclick="copyText('${w.number}')">Copy</button><br>

      <b>Status:</b> 
      <span style="color:${statusColor};font-weight:bold;">
        ${w.status.toUpperCase()}
      </span><br>

      ${w.reason ? `<b style="color:red;">Reason:</b> ${w.reason}<br>` : ""}

      <br>

      ${w.status==="pending" ? `
        <button onclick="approve('${w._id}')">Approve</button>
        <button onclick="reject('${w._id}')">Reject</button>
      ` : ""}

    </div>
    `;
  });
}

/* ================= APPROVE ================= */
async function approve(id){
  await fetch("/api/admin/approve",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({id})
  });
  loadWithdraws();
  loadStats();
}

/* ================= REJECT ================= */
async function reject(id){
  const reason=prompt("Enter reject reason");
  if(!reason) return;

  await fetch("/api/admin/reject",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({id,reason})
  });

  loadWithdraws();
  loadStats();
}

/* ================= USERS ================= */
async function loadUsers(){

  const res=await fetch("/api/admin/users",{headers:{authorization:token}});
  const data=await res.json();

  const box=document.getElementById("userList");
  box.innerHTML="";

  data.forEach(u=>{

    box.innerHTML+=`
    <div class="card" style="${u.blocked ? 'border-left:5px solid red;' : ''}">
      <b>${u.username || "No Name"}</b> (${u.telegramId})<br>
      Balance: ৳ ${u.balance}<br>
      Blocked: ${u.blocked ? "<span style='color:red;'>YES</span>" : "NO"}<br>

      <button onclick="editBalance('${u.telegramId}')">Edit Balance</button>

      ${u.blocked
        ? `<button onclick="unblockUser('${u.telegramId}')">Unblock</button>`
        : `<button onclick="blockUser('${u.telegramId}')">Block</button>`
      }

      <button onclick="deleteUser('${u.telegramId}')" 
      style="background:red;color:white;">
      Delete
      </button>

    </div>
    `;
  });
}

/* ================= EDIT BALANCE ================= */
async function editBalance(id){
  const amount=prompt("Enter new balance");
  if(amount===null) return;

  await fetch("/api/admin/edit-balance",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id,amount})
  });

  loadUsers();
}

/* ================= BLOCK USER ================= */
async function blockUser(id){

  if(!confirm("Are you sure to block this user?")) return;

  await fetch("/api/admin/block",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id})
  });

  loadUsers();
}

/* ================= UNBLOCK USER ================= */
async function unblockUser(id){

  if(!confirm("Unblock this user?")) return;

  await fetch("/api/admin/unblock",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id})
  });

  loadUsers();
}

/* ================= DELETE USER ================= */
async function deleteUser(id){

  if(!confirm("Permanently delete this user?")) return;

  await fetch("/api/admin/delete-user",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      authorization:token
    },
    body:JSON.stringify({telegramId:id})
  });

  alert("User deleted permanently");
  loadUsers();
  loadStats();
}

/* ================= COPY FUNCTION ================= */
function copyText(text){
  navigator.clipboard.writeText(text);
  alert("Copied: "+text);
}