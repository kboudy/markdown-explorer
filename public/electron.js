const electron = require('electron');
const fs = require('fs');
const path = require('path');
const isDev = require('electron-is-dev');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;

function setupRecentsMenu() {
  const userDataPath = (electron.app || electron.remote.app).getPath(
    'userData'
  );
  const fullConfigPath = path.join(userDataPath, 'config.json');

  if (!fs.existsSync(fullConfigPath)) {
    return;
  }
  const c = JSON.parse(fs.readFileSync(fullConfigPath, 'utf8'));

  if (c.recentFiles && c.recentFiles.length > 0) {
    var menu = Menu.buildFromTemplate([
      {
        label: 'Recent files',
        submenu: c.recentFiles.map(f => {
          return {
            label: f
          };
        })
      }
    ]);
    Menu.setApplicationMenu(menu);
  }
}

let mainWindow;

global.sharedObject = { args: process.argv };

function createWindow() {
  mainWindow = new BrowserWindow({ width: 900, height: 680 });
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    //mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => (mainWindow = null));
  setupRecentsMenu();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
