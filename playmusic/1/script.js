document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const audio = new Audio();
  const albumCover = document.getElementById('album-cover');
  const songTitle = document.getElementById('song-title');
  const artist = document.getElementById('artist');
  const album = document.getElementById('album');
  const currentTime = document.getElementById('current-time');
  const totalTime = document.getElementById('total-time');
  const progressBar = document.getElementById('progress-bar');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const volumeBar = document.getElementById('volume-bar');
  const lyricsContainer = document.getElementById('lyrics-container');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const miniPlayPauseBtn = document.getElementById('mini-play-pause-btn');
  const miniSongTitle = document.getElementById('mini-song-title');
  const miniArtist = document.getElementById('mini-artist');

  // 状态变量
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;
  let lyrics = [];
  let currentLyricIndex = -1;

  // 加载配置文件
  fetch('config.json')
    .then(response => {
      if (!response.ok) throw new Error('无法加载配置文件');
      return response.json();
    })
    .then(config => {
      // 设置歌曲信息
      songTitle.textContent = config.songTitle;
      artist.textContent = config.artist;
      album.textContent = config.album;
      miniSongTitle.textContent = config.songTitle;
      miniArtist.textContent = config.artist;
      
      // 设置专辑封面
      albumCover.src = config.coverPath;
      
      // 设置音频源
      audio.src = config.audioPath;
      
      // 加载歌词
      return fetch(config.lyricsPath);
    })
    .then(response => {
      if (!response.ok) throw new Error('无法加载歌词文件');
      return response.text();
    })
    .then(lyricsText => {
      // 解析歌词
      lyrics = parseLyrics(lyricsText);
      renderLyrics();
      
      // 加载完成后显示播放按钮
      playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
      miniPlayPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
    })
    .catch(error => {
      showError(`加载失败: ${error.message}`);
      console.error('加载错误:', error);
    });

  // 解析LRC歌词
  function parseLyrics(lrcText) {
    const lines = lrcText.split('\n');
    const lyricsArray = [];
    
    lines.forEach(line => {
      const timeMatch = line.match(/\[(\d+):(\d+\.\d+)\]/);
      if (timeMatch && timeMatch.length === 3) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseFloat(timeMatch[2]);
        const timeInSeconds = minutes * 60 + seconds;
        const text = line.replace(/\[(\d+):(\d+\.\d+)\]/, '').trim();
        
        if (text) {
          lyricsArray.push({ time: timeInSeconds, text });
        }
      }
    });
    
    return lyricsArray.sort((a, b) => a.time - b.time);
  }

  // 渲染歌词
  function renderLyrics() {
    if (!lyrics.length) {
      lyricsContainer.innerHTML = '<p class="text-gray-400 text-lg">没有找到歌词</p>';
      return;
    }
    
    const lyricsHTML = lyrics.map((line, index) => `
      <p class="lyric-line" data-time="${line.time}" data-index="${index}">
        ${line.text}
      </p>
    `).join('');
    
    lyricsContainer.innerHTML = lyricsHTML;
  }

  // 更新歌词高亮
  function updateLyrics() {
    const currentTime = audio.currentTime;
    
    // 找到当前歌词行
    let newIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (i === lyrics.length - 1 || (lyrics[i].time <= currentTime && lyrics[i+1].time > currentTime)) {
        newIndex = i;
        break;
      }
    }
    
    // 如果歌词行发生变化，更新高亮
    if (newIndex !== currentLyricIndex) {
      // 移除之前的高亮
      if (currentLyricIndex !== -1) {
        const prevLine = lyricsContainer.querySelector(`[data-index="${currentLyricIndex}"]`);
        if (prevLine) prevLine.classList.remove('active');
      }
      
      // 添加新高亮
      if (newIndex !== -1) {
        const currentLine = lyricsContainer.querySelector(`[data-index="${newIndex}"]`);
        if (currentLine) {
          currentLine.classList.add('active');
          
          // 滚动到当前歌词
          const containerHeight = lyricsContainer.clientHeight;
          const lineHeight = currentLine.clientHeight;
          const lineTop = currentLine.offsetTop;
          const scrollPosition = lineTop - containerHeight / 2 + lineHeight / 2;
          
          lyricsContainer.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
      
      currentLyricIndex = newIndex;
    }
  }

  // 格式化时间
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }

  // 显示错误信息
  function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }

  // 播放/暂停切换
  function togglePlayPause() {
    if (isPlaying) {
      audio.pause();
      albumCover.classList.remove('playing');
      playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
      miniPlayPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
    } else {
      if (audio.src === '') {
        showError('没有加载音频文件');
        return;
      }
      
      audio.play()
        .then(() => {
          albumCover.classList.add('playing');
          playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
          miniPlayPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
        })
        .catch(error => {
          showError(`播放失败: ${error.message}`);
          console.error('播放错误:', error);
        });
    }
    
    isPlaying = !isPlaying;
  }

  // 事件监听器
  playPauseBtn.addEventListener('click', togglePlayPause);
  miniPlayPauseBtn.addEventListener('click', togglePlayPause);

  // 进度条点击
  progressBar.parentElement.addEventListener('click', (e) => {
    const progressWidth = progressBar.parentElement.clientWidth;
    const clickPosition = e.offsetX;
    const seekTime = (clickPosition / progressWidth) * audio.duration;
    audio.currentTime = seekTime;
  });

  // 音量条点击
  volumeBar.parentElement.addEventListener('click', (e) => {
    const volumeWidth = volumeBar.parentElement.clientWidth;
    const clickPosition = e.offsetX;
    const volume = clickPosition / volumeWidth;
    audio.volume = volume;
    volumeBar.style.width = `${volume * 100}%`;
  });

  // 音频时间更新
  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
    currentTime.textContent = formatTime(audio.currentTime);
    updateLyrics();
  });

  // 音频加载元数据
  audio.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audio.duration);
  });

  // 音频播放结束
  audio.addEventListener('ended', () => {
    if (isRepeat) {
      // 单曲循环
      audio.currentTime = 0;
      audio.play();
    } else {
      // 停止播放
      isPlaying = false;
      albumCover.classList.remove('playing');
      playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
      miniPlayPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
    }
  });

  // 音频加载错误
  audio.addEventListener('error', () => {
    showError('音频加载错误');
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case ' ': // 空格 - 播放/暂停
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowRight': // 右箭头 - 快进5秒
        audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
        break;
      case 'ArrowLeft': // 左箭头 - 快退5秒
        audio.currentTime = Math.max(audio.currentTime - 5, 0);
        break;
      case 'ArrowUp': // 上箭头 - 增大音量
        audio.volume = Math.min(audio.volume + 0.1, 1);
        volumeBar.style.width = `${audio.volume * 100}%`;
        break;
      case 'ArrowDown': // 下箭头 - 减小音量
        audio.volume = Math.max(audio.volume - 0.1, 0);
        volumeBar.style.width = `${audio.volume * 100}%`;
        break;
    }
  });

  // 歌词点击跳转
  lyricsContainer.addEventListener('click', (e) => {
    const lyricLine = e.target.closest('.lyric-line');
    if (lyricLine && lyricLine.dataset.time) {
      audio.currentTime = parseFloat(lyricLine.dataset.time);
    }
  });

  // 初始化
  audio.volume = 0.7;
  volumeBar.style.width = '70%';
});