const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('metaAds', {
  status: () => ipcRenderer.invoke('app:status'),
  saveToken: token => ipcRenderer.invoke('app:save-token', token),
  saveAccount: accountId => ipcRenderer.invoke('app:save-account', accountId),
  test: () => ipcRenderer.invoke('app:test'),
  dashboard: period => ipcRenderer.invoke('app:dashboard', period),
});

