const SERVER_URL = 'http://192.168.157.91:5001';
let currentUser = null;
let currentPort = 60000;
let currentIP = '192.168.157.91';

window.registerUser = function() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  fetch(`${SERVER_URL}/register`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({username, password, ip: currentIP, port: currentPort})
  })
    .then(r=>r.json())
    .then(d=>alert(d.message))
    .catch(console.error);
}

window.login = function() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  fetch(`${SERVER_URL}/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username, password, ip: currentIP, port: currentPort})
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.username) {
      currentUser = username;
      document.querySelector('.actions').style.display='block';
      setInterval(()=>heartbeat(username),30000);
    } else {
      alert("Login failed");
    }
  })
  .catch(console.error);
}

function heartbeat(username) {
  fetch(`${SERVER_URL}/heartbeat`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username, ip: currentIP, port: currentPort})
  }).catch(console.error);
}

window.refreshFiles = function() {
  fetch(`${SERVER_URL}/files`)
    .then(r=>r.json())
    .then(data=>{
      const list = document.getElementById('filesList');
      list.innerHTML='';
      data.files.forEach(f=>{
        const li=document.createElement('li');
        li.textContent=`${f.filename} by ${f.username} (${f.peer_ip}:${f.peer_port})`;
        list.appendChild(li);
      });
    })
    .catch(console.error);
}

window.searchFiles = function() {
  const fn=document.getElementById('searchFilename').value.trim();
  const un=document.getElementById('searchUser').value.trim();
  const params=new URLSearchParams();
  if(fn) params.append('filename', fn);
  if(un) params.append('username', un);
  fetch(`${SERVER_URL}/search_files?${params.toString()}`)
    .then(r=>r.json())
    .then(data=>{
      const list = document.getElementById('filesList');
      list.innerHTML='';
      data.files.forEach(f=>{
        const li=document.createElement('li');
        li.textContent=`${f.filename} by ${f.username} (${f.peer_ip}:${f.peer_port})`;
        list.appendChild(li);
      });
    })
    .catch(console.error);
}

window.clearSearch = function() {
  document.getElementById('searchFilename').value='';
  document.getElementById('searchUser').value='';
  refreshFiles();
}
