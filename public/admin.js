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
      <b>Account:</b> ${w.number}<br>
      <b>Status:</b>
      <span style="color:${statusColor};font-weight:bold;">
        ${w.status.toUpperCase()}
      </span><br>
      ${w.reason ? `<b style="color:red;">Reason:</b> ${w.reason}<br>` : ""}
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

/* ================= USERS (GROUPED BY DEVICE) ================= */
async function loadUsers(){

  const res = await fetch("/api/admin/users-grouped",{headers:{authorization:token}});
  const data = await res.json();
  const box = document.getElementById("userList");
  box.innerHTML="";

  Object.keys(data).forEach(deviceId=>{

    const users = data[deviceId];

    const isMulti = users.length > 1;

    let userCards = "";

    users.forEach(u=>{
      userCards += `
        <div style="
          background:#f4f6fb;
          padding:10px;
          margin:6px;
          border-radius:8px;
          display:inline-block;
          width:220px;
          vertical-align:top;
        ">
          <b>${u.username || "NoName"}</b><br>
          ID: ${u.telegramId}<br>
          Balance: ৳ ${u.balance}<br>
          Blocked: ${u.blocked ? "YES" : "NO"}<br>
          Multi Allowed: ${u.allowMulti ? "YES" : "NO"}<br><br>

          <button onclick="editBalance('${u.telegramId}')">Edit</button>

          ${u.blocked
            ? `<button onclick="unblockUser('${u.telegramId}')">Unblock</button>`
            : `<button onclick="blockUser('${u.telegramId}')">Block</button>`
          }

          ${!u.allowMulti
            ? `<button onclick="allowMulti('${u.telegramId}')">Allow Multi</button>`
            : ""
          }
        </div>
      `;
    });

    box.innerHTML += `
      <div style="
        border:2px solid ${isMulti ? 'red' : '#ddd'};
        padding:15px;
        margin-bottom:20px;
        border-radius:10px;
        background:#ffffff;
      ">
        <b>Device:</b> ${deviceId.substring(0,60)}<br>
        <b>${users.length} Account(s)</b>

        <div style="margin-top:10px;">
          ${userCards}
        </div>
      </div>
    `;
  });
}

/* ================= BALANCE EDIT ================= */
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

/* ================= BLOCK ================= */
async function blockUser(id){
  await fetch("/api/admin/block",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id})
  });
  loadUsers();
}

/* ================= UNBLOCK ================= */
async function unblockUser(id){
  await fetch("/api/admin/unblock",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id})
  });
  loadUsers();
}

/* ================= ALLOW MULTI ================= */
async function allowMulti(id){
  await fetch("/api/admin/allow-multi",{
    method:"POST",
    headers:{"Content-Type":"application/json",authorization:token},
    body:JSON.stringify({telegramId:id})
  });
  loadUsers();
}
