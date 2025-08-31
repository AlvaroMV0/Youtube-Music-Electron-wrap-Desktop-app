const { app, BrowserWindow, nativeTheme, ipcMain } = require('electron');
const path = require('path');
const RPC = require('discord-rpc');

const clientId = '1411784720252928052';
let rpc;
let inactivityTimer = null; // Holds the timer for clearing activity

const setActivity = (songInfo) => {
  if (!rpc) return;

  // Always clear the previous timer when a new update comes in.
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  
  const { title, artist, currentTime, isPlaying } = songInfo;

  let activityData;

  if (isPlaying) {
    // When a song is playing, show its details and the elapsed time.
    const startTimestamp = Math.floor(Date.now() / 1000) - currentTime;
    activityData = {
      details: `🎵 ${title}`,
      state: `👤 ${artist}`,
      largeImageKey: 'ytm-logo',
      largeImageText: `${title} - ${artist}`,
      instance: false,
      startTimestamp: startTimestamp,
    };
  } else {
    // When paused, show the custom "Picking..." message and hide the timer.
    activityData = {
      details: '✨ Picking the perfect song...',
      state: '  ',
      largeImageKey: 'ytm-logo',
      largeImageText: 'YouTube Music',
      instance: false,
      startTimestamp: Date.now(),
    };
    // Start a 2-minute timer to clear the activity if still paused.
    inactivityTimer = setTimeout(clearActivity, 120000); // 2 minutes in ms
  }

  rpc.setActivity(activityData);
  console.log(`Activity updated. Playing: ${isPlaying}`);
};

const clearActivity = () => {
  if (!rpc) return;
  rpc.clearActivity();
  console.log('Activity cleared due to 2 minutes of inactivity.');
};

const createWindow = () => {
  nativeTheme.themeSource = 'dark';
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadURL("https://music.youtube.com");
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

  rpc.login({ clientId }).catch(err => console.error(err));
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (rpc) rpc.destroy();
    app.quit();
  }
});

