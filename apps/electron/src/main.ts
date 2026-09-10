import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

const GRIFFTY_SERVER = process.env.GRIFFTY_SERVER_URL ?? 'http://127.0.0.1:8787';
const DASHBOARD_URL = process.env.GRIFFTY_DASHBOARD_URL ?? 'http://127.0.0.1:5173';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Griffty — The Weatherman Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(DASHBOARD_URL);
    }, 1500);
  });
  mainWindow.loadURL(DASHBOARD_URL);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray(): void {
  // Use a default empty icon in dev; replace with real asset in production build
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Griffty is running');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => { mainWindow?.show() ?? createWindow(); } },
    { type: 'separator' },
    { label: 'Quit Griffty', click: () => app.quit() },
  ]));
}

// Native notification helper — called via IPC from renderer
ipcMain.on('notify', (_event, opts: { title: string; body: string }) => {
  new Notification({ title: opts.title, body: opts.body }).show();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  if (app.isPackaged) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch {}
  }
});

app.on('window-all-closed', () => {
  // Keep app alive in system tray on macOS
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
