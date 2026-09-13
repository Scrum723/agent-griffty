import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

const LOCAL = 'http://127.0.0.1:8787';
const DEV_DASH = process.env.GRIFFTY_DASHBOARD_URL ?? 'http://127.0.0.1:5173';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProc: ChildProcess | null = null;

function iconPath(): string {
  const icns = path.join(__dirname, '../assets/icon.icns');
  const png = path.join(__dirname, '../assets/icon.png');
  if (fs.existsSync(icns)) return icns;
  if (fs.existsSync(png)) return png;
  return '';
}

function dashboardFile(): string {
  const packaged = path.join(process.resourcesPath, 'dashboard', 'index.html');
  const dev = path.join(__dirname, '../../dashboard/dist/index.html');
  return fs.existsSync(packaged) ? packaged : dev;
}

function waitFor(url: string, tries = 40): Promise<boolean> {
  return new Promise((resolve) => {
    const tick = (n: number) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (n <= 0) resolve(false);
        else setTimeout(() => tick(n - 1), 250);
      });
    };
    tick(tries);
  });
}

function startLocalApi(): void {
  if (!app.isPackaged) return;
  const repoHint = path.join(process.resourcesPath, 'repo');
  const cwd = fs.existsSync(path.join(repoHint, 'package.json')) ? repoHint : process.cwd();
  try {
    serverProc = spawn('npm', ['run', 'start:web'], {
      cwd,
      env: { ...process.env, PORT: '8787', GRIFFTY_STORE: 'file', GRIFFTY_STATE_DIR: path.join(app.getPath('userData'), '.griffty') },
      stdio: 'ignore',
      detached: false,
    });
  } catch {
    /* operator can start npm run start:web themselves */
  }
}

async function createWindow(): Promise<void> {
  const icon = iconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Griffty',
    icon: icon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  const localUp = await waitFor(`${LOCAL}/api/health?token=dev-operator-token`, app.isPackaged ? 50 : 8);
  if (localUp) {
    await mainWindow.loadURL(LOCAL);
  } else if (app.isPackaged && fs.existsSync(dashboardFile())) {
    await mainWindow.loadFile(dashboardFile());
  } else {
    await mainWindow.loadURL(DEV_DASH);
  }
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray(): void {
  const p = iconPath();
  const icon = p ? nativeImage.createFromPath(p) : nativeImage.createEmpty();
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 18, height: 18 }));
  tray.setToolTip('Griffty is running locally');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => { mainWindow?.show() ?? void createWindow(); } },
    { type: 'separator' },
    { label: 'Quit Griffty', click: () => app.quit() },
  ]));
}

// Native notification helper — called via IPC from renderer
ipcMain.on('notify', (_event, opts: { title: string; body: string }) => {
  new Notification({ title: opts.title, body: opts.body }).show();
});

app.whenReady().then(async () => {
  startLocalApi();
  await createWindow();
  createTray();
  if (app.isPackaged) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch {}
  }
});

app.on('before-quit', () => {
  if (serverProc && !serverProc.killed) serverProc.kill();
});

app.on('window-all-closed', () => {
  // Keep app alive in system tray on macOS
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
