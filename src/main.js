const { app, BrowserWindow, nativeTheme, ipcMain } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');

const clientId = '1411784720252928052';
let rpc;
let inactivityTimer = null;

if (require('electron-squirrel-startup')) {
  app.quit();
}

app.setAppUserModelId('com.example.youtube-music');

const setActivity = (songInfo) => {
  if (!rpc) return;

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  const { title, artist, currentTime, isPlaying } = songInfo;

  const activityData = isPlaying
    ? {
        details: `🎵 ${title}`,
        state: `👤 ${artist}`,
        largeImageKey: 'icon-512',
        largeImageText: `${title} - ${artist}`,
        instance: false,
        startTimestamp: Math.floor(Date.now() / 1000) - currentTime,
      }
    : {
        details: '✨ Picking the perfect song...',
        state: '  ',
        largeImageKey: 'icon-512',
        largeImageText: 'YouTube Music',
        instance: false,
        startTimestamp: Math.floor(Date.now() / 1000),
      };

  if (!isPlaying) {
    inactivityTimer = setTimeout(clearActivity, 120000);
  }

  rpc.setActivity(activityData);
  console.log(`Activity updated. Playing: ${isPlaying}`);
};

const clearActivity = () => {
  if (!rpc) return;
  rpc.clearActivity();
  console.log('Activity cleared due to 2 minutes of inactivity.');
};

let mainWindow;

const createWindow = () => {
  nativeTheme.themeSource = 'dark';
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'youtube_music_32.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('https://music.youtube.com');

  mainWindow.on('close', () => {
    process.exit(0);
  });
};

app.whenReady().then(() => {
  createWindow();

  rpc = new RPC.Client({ transport: 'ipc' });

  ipcMain.on('update-activity', (event, songInfo) => {
    setActivity(songInfo);
  });

  ipcMain.on('clear-activity', () => {
    clearActivity();
  });

  rpc.login({ clientId })
    .then(() => console.log('Discord RPC connected!'))
    .catch(err => console.error('Failed to login to Discord RPC:', err));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
