const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const net = require("net");
const fs = require("fs");
const os = require("os");
const portfinder = require("portfinder");
const url = require('url');
let mainWindow;
const isDev = !app.isPackaged;

const getAppDataPath = () => path.join(app.getPath('userData'), 'p2p-file-sharing');

const APP_DATA_PATH = getAppDataPath();
const SHARED_FILES_DIR = path.join(APP_DATA_PATH, "shared_files");
const DOWNLOADS_DIR = path.join(APP_DATA_PATH, "downloads");

[APP_DATA_PATH, SHARED_FILES_DIR, DOWNLOADS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    show: false
  });

  // This single block correctly finds the index.html file in both
  // development (from your project folder) and in production (from the asar archive).
  const startUrl = url.format({
    pathname: path.join(__dirname, '../../public/index.html'),
    protocol: 'file:',
    slashes: true,
  });
  mainWindow.loadURL(startUrl);

  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());


// --- IPC Handlers (No changes needed here) ---

ipcMain.handle('get-app-data-path', () => APP_DATA_PATH);

ipcMain.handle('get-local-ip', () => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) return alias.address;
        }
    }
    return '127.0.0.1';
});

ipcMain.handle('get-free-port', () => portfinder.getPortPromise());

const readDirectory = (dir) => {
    try {
        return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    } catch (e) {
        console.error(`Error reading directory ${dir}:`, e);
        return [];
    }
};

ipcMain.handle('get-shared-files', () => readDirectory(SHARED_FILES_DIR));
ipcMain.handle('get-downloaded-files', () => readDirectory(DOWNLOADS_DIR));

ipcMain.handle('share-files-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile", "multiSelections"],
    });

    if (canceled || filePaths.length === 0) return 0;

    let copiedCount = 0;
    filePaths.forEach(filePath => {
        try {
            const fileName = path.basename(filePath);
            fs.copyFileSync(filePath, path.join(SHARED_FILES_DIR, fileName));
            copiedCount++;
        } catch (err) {
            console.error(`Failed to copy ${filePath}:`, err);
        }
    });
    return copiedCount;
});

// --- P2P Networking Logic (No changes needed here) ---
ipcMain.on("start-peer-server", (event, port) => startPeerServer(port));
ipcMain.on("send-file", (event, { filename, peer_ip, peer_port }) => sendFileToPeer(filename, peer_ip, peer_port));

function startPeerServer(port) {
  const server = net.createServer((socket) => {
    socket.once("data", (data) => {
      const requestedFile = data.toString().trim();
      const filePath = path.join(SHARED_FILES_DIR, requestedFile);

      if (!fs.existsSync(filePath)) {
        socket.write("FILE_NOT_FOUND");
        socket.end();
        return;
      }

      const fileSize = fs.statSync(filePath).size;
      socket.write(fileSize.toString());
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(socket);
    });

    socket.on("error", (err) => console.error("Socket error:", err));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Peer server listening on port ${port}`);
    mainWindow.webContents.send("peer-server-started", port);
  });

  server.on("error", (err) => console.error("Server error:", err));
}

function sendFileToPeer(filename, peer_ip, peer_port) {
  console.log(`Initiating download for file: ${filename} from ${peer_ip}:${peer_port}`);
  const client = new net.Socket();
  client.connect(peer_port, peer_ip, () => {
    console.log(`Connected to peer ${peer_ip}:${peer_port}, requesting file: ${filename}`);
    client.write(filename);
  });

  let fileHeaderReceived = false;

  client.on("data", (data) => {
    if (!fileHeaderReceived) {
      fileHeaderReceived = true;
      if (data.toString() === "FILE_NOT_FOUND") {
        mainWindow.webContents.send("download-error", "File not found on peer.");
        client.destroy();
        return;
      }

      const fileSize = parseInt(data.toString(), 10);
      let receivedBytes = 0;
      const filePath = path.join(DOWNLOADS_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      client.on("data", (chunk) => {
        writeStream.write(chunk);
        receivedBytes += chunk.length;
        const progress = (receivedBytes / fileSize) * 100;
        mainWindow.webContents.send("download-progress", { filename, progress });
      });

      client.on("end", () => {
        writeStream.end();
        console.log(`Download complete for file: ${filename}`);
        mainWindow.webContents.send("download-complete", filename);
      });
      return;
    }
  });

  client.on("error", (err) => {
    console.error("Client error:", err);
    mainWindow.webContents.send("download-error", `Connection error: ${err.message}`);
  });
}