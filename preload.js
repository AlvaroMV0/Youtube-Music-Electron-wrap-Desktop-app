const { ipcRenderer } = require('electron');

const parseTimeToSeconds = (timeStr) => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

window.addEventListener('DOMContentLoaded', () => {
  let lastStatus = '';

  setInterval(() => {
    const playerBar = document.querySelector('ytmusic-player-bar');
    
    if (playerBar) {
      const titleElement = playerBar.querySelector('.title');
      const artistElement = playerBar.querySelector('.byline a');
      const timeInfoElement = playerBar.querySelector('.time-info');
      const playPauseButton = document.getElementById('play-pause-button');

      if (titleElement && artistElement && timeInfoElement && playPauseButton) {
        const title = titleElement.innerText;
        const artist = artistElement.innerText;
        const timeParts = timeInfoElement.innerText.split(' / ');
        const currentTime = parseTimeToSeconds(timeParts[0]);
        const isPlaying = playPauseButton.getAttribute('title').toLowerCase() === 'pause';

        const currentStatus = `${title}-${artist}-${currentTime}-${isPlaying}`;

        if (currentStatus !== lastStatus && title.toLowerCase() !== 'advertisement') {
          lastStatus = currentStatus;
          ipcRenderer.send('update-activity', { title, artist, currentTime, isPlaying });
        }
      }
    } else {
      if (lastStatus !== 'inactive') {
        lastStatus = 'inactive';
        ipcRenderer.send('clear-activity');
      }
    }
  }, 2000);
});

