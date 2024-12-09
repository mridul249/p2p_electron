// client/renderer.js

const { ipcRenderer } = require('electron');
const net = require('net');
const fs = require('fs');
const path = require('path');
const portfinder = require('portfinder'); // ensure it's installed

const SERVER_URL = 'http://192.168.157.91:5001';
let currentUser = null;
let currentPort = 60000; // default port
let currentIP = getLocalIP();

// Function to get local IP address
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// Function to find a free port
async function getFreePort() {
  try {
    const port = await portfinder.getPortPromise();
    return port;
  } catch (err) {
    console.error('Error finding free port:', err);
    return 60000; // fallback port
  }
}

// Function to start the peer server via main process
function startPeerServer() {
  ipcRenderer.send('start-peer-server', currentPort);
}

// Register User
window.registerUser = function () {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  fetch(`${SERVER_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, ip: currentIP, port: currentPort })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
    })
    .catch(err => {
      console.error(err);
      alert('Registration failed.');
    });
}

// Login User
window.login = async function () {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  currentPort = await getFreePort();

  fetch(`${SERVER_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, ip: currentIP, port: currentPort })
  })
    .then(res => res.json())
    .then(data => {
      if (data.username) {
        currentUser = username;
        document.querySelector('.actions').style.display = 'block';
        document.querySelector('.login-section').style.display = 'none';
        startPeerServer();
        setInterval(() => heartbeat(username), 30000);
        refreshFiles();
      } else {
        alert(data.message || 'Login failed.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Login failed.');
    });
}

// Heartbeat to server
function heartbeat(username) {
  fetch(`${SERVER_URL}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, ip: currentIP, port: currentPort })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Heartbeat:', data.message);
    })
    .catch(err => {
      console.error('Heartbeat error:', err);
    });
}

// Share Files via file dialog
window.shareFiles = async function () {
  try {
    const filePaths = await ipcRenderer.invoke('open-file-dialog');
    console.log('Selected file paths:', filePaths);
    if (filePaths.length === 0) return;

    const sharedDir = path.join(__dirname, 'shared_files');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir);
    }

    filePaths.forEach(filePath => {
      if (!filePath) {
        console.error('File path is undefined');
        return;
      }
      const fileName = path.basename(filePath);
      const destPath = path.join(sharedDir, fileName);
      try {
        fs.copyFileSync(filePath, destPath);
      } catch (err) {
        console.error(`Failed to copy ${filePath} to ${destPath}:`, err);
      }
    });

    shareFilesToServer();
    refreshFiles();
    alert('Files shared successfully!');
  } catch (err) {
    console.error('Error selecting files:', err);
    alert('Failed to select files.');
  }
}

// Share files with the central server
function shareFilesToServer() {
  const sharedDir = path.join(__dirname, 'shared_files');
  const files = fs.existsSync(sharedDir) ? fs.readdirSync(sharedDir) : [];

  fetch(`${SERVER_URL}/share_files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: currentUser,
      filename: files,
      peer_ip: currentIP,
      peer_port: currentPort
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Share files:', data.message);
    })
    .catch(err => {
      console.error('Share files error:', err);
    });
}

// Refresh Files List
window.refreshFiles = function () {
  fetch(`${SERVER_URL}/files`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('filesList');
      list.innerHTML = '';
      data.files.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${f.filename}</strong> by ${f.username} 
          (<em>${f.peer_ip}:${f.peer_port}</em>)
          <button onclick="downloadFile('${f.filename}', '${f.peer_ip}', ${f.peer_port})">Download</button>
        `;
        list.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Refresh files error:', err);
      alert('Failed to fetch files.');
    });
}

// Search Files
window.searchFiles = function () {
  const fn = document.getElementById('searchFilename').value.trim();
  const un = document.getElementById('searchUser').value.trim();
  const params = new URLSearchParams();
  if (fn) params.append('filename', fn);
  if (un) params.append('username', un);

  fetch(`${SERVER_URL}/search_files?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('filesList');
      list.innerHTML = '';
      data.files.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${f.filename}</strong> by ${f.username} 
          (<em>${f.peer_ip}:${f.peer_port}</em>)
          <button onclick="downloadFile('${f.filename}', '${f.peer_ip}', ${f.peer_port})">Download</button>
        `;
        list.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Search files error:', err);
      alert('Failed to search files.');
    });
}

// Clear Search
window.clearSearch = function () {
  document.getElementById('searchFilename').value = '';
  document.getElementById('searchUser').value = '';
  refreshFiles();
}

// Download File
window.downloadFile = function (filename, peer_ip, peer_port) {
  ipcRenderer.send('send-file', { filename, peer_ip, peer_port });
}

// Listen for download progress and completion
ipcRenderer.on('download-progress', (event, { filename, progress }) => {
  document.getElementById('downloadProgress').value = progress;
  document.getElementById('downloadStatus').innerText = `Downloading ${filename}: ${progress.toFixed(2)}%`;
});

ipcRenderer.on('download-complete', (event, filename) => {
  document.getElementById('downloadProgress').value = 0;
  document.getElementById('downloadStatus').innerText = `Download of ${filename} complete!`;
  refreshFiles();
});

ipcRenderer.on('download-error', (event, message) => {
  document.getElementById('downloadProgress').value = 0;
  document.getElementById('downloadStatus').innerText = `Download error: ${message}`;
  alert(`Download error: ${message}`);
});
