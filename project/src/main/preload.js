const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (your React app)
contextBridge.exposeInMainWorld('electron', {
  // --- Invoke/Handle (Renderer -> Main -> Renderer) ---
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
  getFreePort: () => ipcRenderer.invoke('get-free-port'),
  getSharedFiles: () => ipcRenderer.invoke('get-shared-files'),
  getDownloadedFiles: () => ipcRenderer.invoke('get-downloaded-files'),
  shareFilesDialog: () => ipcRenderer.invoke('share-files-dialog'),

  // --- Send (Renderer -> Main, one-way) ---
  startPeerServer: (port) => ipcRenderer.send('start-peer-server', port),
  sendFile: (fileDetails) => ipcRenderer.send('send-file', fileDetails),

  // --- On (Main -> Renderer) ---
  on: (channel, listener) => {
    const subscription = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, subscription);
    // Return a function to unsubscribe the listener
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});