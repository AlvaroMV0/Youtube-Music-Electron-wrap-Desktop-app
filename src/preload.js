const { ipcRenderer } = require('electron');

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

window.addEventListener('DOMContentLoaded', () => {
  let lastStatus = '';

  const getPlayerInfo = () => {
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (!playerBar) return null;

    const titleElement = playerBar.querySelector('.title');
    const artistElements = playerBar.querySelectorAll('.byline a');
    const timeInfoElement = playerBar.querySelector('.time-info');
    const playPauseButton = document.getElementById('play-pause-button');

    if (!titleElement || artistElements.length === 0 || !timeInfoElement || !playPauseButton) {
      return null;
    }

    const title = titleElement.innerText.trim();
    const artist = Array.from(artistElements).map(el => el.innerText.trim()).join(', ');
    const timeParts = timeInfoElement.innerText.split(' / ');
    const currentTime = parseTimeToSeconds(timeParts[0]);

    const playPauseLabel = playPauseButton.getAttribute('title') || playPauseButton.getAttribute('aria-label') || '';
    const isPlaying = playPauseLabel.toLowerCase() === 'pause';

    return { title, artist, currentTime, isPlaying };
  };

  const update = () => {
    const info = getPlayerInfo();

    if (info) {
      const { title, artist, currentTime, isPlaying } = info;

      // Filter out ads or empty titles/artists
      if (!title || title.toLowerCase() === 'advertisement' || !artist) return;

      const statusKey = `${title}-${artist}-${currentTime}-${isPlaying}`;
      if (statusKey !== lastStatus) {
        lastStatus = statusKey;
        ipcRenderer.send('update-activity', { title, artist, currentTime, isPlaying });
        console.log('[Rich Presence] Updated:', { title, artist, currentTime, isPlaying });
      }
    } else {
      if (lastStatus !== 'inactive') {
        lastStatus = 'inactive';
        ipcRenderer.send('clear-activity');
        console.log('[Rich Presence] Cleared due to inactivity.');
      }
    }
  };

  setInterval(update, 2000);
});
