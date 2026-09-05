import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('grifftyElectron', {
  notify: (title: string, body: string) => ipcRenderer.send('notify', { title, body }),
  platform: process.platform,
});
