// client/main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

let mainWindow;
const SHARED_FILES_DIR = path.join(__dirname, 'shared_files');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Ensure shared_files and downloads directories exist
if (!fs.existsSync(SHARED_FILES_DIR)) {
  fs.mkdirSync(SHARED_FILES_DIR);
}
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true, // Enable Node.js integration
      contextIsolation: false // Disable context isolation
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // IPC handler for opening file dialog
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections']
    });
    console.log('Selected files:', result.filePaths);
    if (result.canceled) {
      return [];
    }
    return result.filePaths;
  });

  // IPC listener to start the peer server
  ipcMain.on('start-peer-server', (event, port) => {
    startPeerServer(port);
  });

  // IPC listener to send a file to a peer
  ipcMain.on('send-file', (event, { filename, peer_ip, peer_port }) => {
    sendFileToPeer(filename, peer_ip, peer_port);
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Function to start the peer server
function startPeerServer(port) {
  const server = net.createServer((socket) => {
    socket.once('data', (data) => {
      const requestedFile = data.toString().trim();
      const filePath = path.join(SHARED_FILES_DIR, requestedFile);

      console.log(`Received request for file: ${requestedFile} from ${socket.remoteAddress}:${socket.remotePort}`);

      if (!fs.existsSync(filePath)) {
        socket.write('FILE_NOT_FOUND');
        socket.end();
        return;
      }

      const fileSize = fs.statSync(filePath).size;
      socket.write(fileSize.toString());

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(socket);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Peer server listening on port ${port}`);
    mainWindow.webContents.send('peer-server-started', port);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}

// Function to send a file to a peer (initiating download)
function sendFileToPeer(filename, peer_ip, peer_port) {
  console.log(`Initiating download for file: ${filename} from ${peer_ip}:${peer_port}`);
  const client = new net.Socket();
  client.connect(peer_port, peer_ip, () => {
    console.log(`Connected to peer ${peer_ip}:${peer_port}, requesting file: ${filename}`);
    client.write(filename);
  });

  client.once('data', (data) => {
    if (data.toString() === 'FILE_NOT_FOUND') {
      console.error('File not found on peer.');
      mainWindow.webContents.send('download-error', 'File not found on peer.');
      client.end();
      return;
    }

    const fileSize = parseInt(data.toString());
    console.log(`File size: ${fileSize} bytes`);
    let receivedBytes = 0;
    const filePath = path.join(DOWNLOADS_DIR, filename);
    const writeStream = fs.createWriteStream(filePath);

    client.on('data', (chunk) => {
      writeStream.write(chunk);
      receivedBytes += chunk.length;
      const progress = (receivedBytes / fileSize) * 100;
      mainWindow.webContents.send('download-progress', { filename, progress });
    });

    client.on('end', () => {
      writeStream.end();
      console.log(`Download complete for file: ${filename}`);
      mainWindow.webContents.send('download-complete', filename);
    });
  });

  client.on('error', (err) => {
    console.error('Client error:', err);
    mainWindow.webContents.send('download-error', `Connection error: ${err.message}`);
  });
}
