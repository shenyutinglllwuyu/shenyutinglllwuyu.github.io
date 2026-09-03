
/**
 * 音乐播放器核心逻辑
 * 支持 JSON 配置加载、流式播放、列表管理
 */

// 配置项：实际使用时可替换为真实的 JSON 文件路径
// 为了演示，这里模拟一个 fetch 请求返回的数据结构
const PLAYLIST_URL = '../json/playlist.json'; 

// DOM 元素引用
const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const currentCover = document.getElementById('current-cover');
const discContainer = document.getElementById('disc-container');
const playlistContainer = document.getElementById('playlist-container');
const trackCount = document.getElementById('track-count');
const toggleListBtn = document.getElementById('toggle-list-btn');
const playlistPanel = document.getElementById('playlist-panel');
const bgLayer = document.getElementById('bg-layer');

// 状态变量
let playlist = [];
let currentIndex = 0;
let isPlaying = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylist();
    setupEventListeners();
});

// 1. 加载播放列表 (模拟从 JSON 文件读取)
async function loadPlaylist() {
    try {
        // 在实际项目中，使用 fetch(PLAYLIST_URL)
        // 这里为了演示直接运行，使用模拟数据。如果存在 playlist.json 文件，浏览器会自动缓存并流式加载
        const response = await fetch(PLAYLIST_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        playlist = await response.json();
    } catch (error) {
        console.warn('未找到 playlist.json，使用默认模拟数据:', error);
        // 模拟数据：确保有可用的在线音频链接用于测试流式播放
        playlist = [
            {
                title: "",
                artist: "",
                cover: "",
                src: "" 
            },
            {
                title: "",
                artist: "",
                cover: "",
                src: ""
            },
            {
                title: "",
                artist: "",
                cover: "",
                src: ""
            },
            {
                title: "",
                artist: "",
                cover: "",
                src: ""
            }
        ];
    }
    
    renderPlaylist();
    if (playlist.length > 0) {
        loadTrack(0);
    }
}

// 2. 渲染播放列表
function renderPlaylist() {
    playlistContainer.innerHTML = '';
    trackCount.textContent = `${playlist.length} 首`;

    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = `flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/10 group ${index === currentIndex ? 'bg-white/20 border border-white/10' : ''}`;
        item.onclick = () => playTrack(index);

        item.innerHTML = `
            <div class="relative w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                <img src="${track.cover}" alt="${track.title}" class="w-full h-full object-cover">
                ${index === currentIndex && isPlaying ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><i class="fas fa-waveform text-white text-xs animate-pulse"></i></div>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold truncate ${index === currentIndex ? 'text-pink-300' : 'text-white'}">${track.title}</h4>
                <p class="text-xs text-gray-400 truncate">${track.artist}</p>
            </div>
            <div class="text-xs text-gray-500 group-hover:text-white transition">
                <i class="fas fa-play-circle text-lg"></i>
            </div>
        `;
        playlistContainer.appendChild(item);
    });
}

// 3. 加载指定索引的歌曲
function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    
    currentIndex = index;
    const track = playlist[currentIndex];

    // 更新 UI 信息
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    currentCover.src = track.cover;
    
    // 更新背景模糊图 (使用同一张封面或随机图，这里用封面保持风格统一)
    bgLayer.style.backgroundImage = `url('${track.cover}')`;

    // 核心：设置音频源
    // 浏览器原生 <audio> 标签在 src 改变时，会自动处理 HTTP Range 请求
    // 只要服务器支持 Range 头（大多数静态服务器如 Nginx/Apache/S3 都支持），
    // 浏览器就会自动实现“边下载边播放”，无需额外 JS 逻辑。
    audio.src = track.src;
    audio.load(); // 重新加载资源

    // 重置进度条
    progressBar.value = 0;
    currentTimeEl.textContent = "00:00";
    durationEl.textContent = "00:00";

    // 更新列表高亮
    renderPlaylist();

    // 如果之前是播放状态，则继续播放新歌曲
    if (isPlaying) {
        playAudio();
    }
}

// 4. 播放控制
function playTrack(index) {
    if (currentIndex === index && isPlaying) {
        pauseAudio();
    } else {
        if (currentIndex !== index) {
            loadTrack(index);
        }
        playAudio();
    }
}

function playAudio() {
    audio.play().then(() => {
        isPlaying = true;
        updatePlayButton();
        discContainer.classList.remove('paused-disc');
        renderPlaylist(); // 更新列表中的播放图标
    }).catch(e => console.error("播放失败:", e));
}

function pauseAudio() {
    audio.pause();
    isPlaying = false;
    updatePlayButton();
    discContainer.classList.add('paused-disc');
    renderPlaylist();
}

function updatePlayButton() {
    playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play ml-1"></i>';
}

// 5. 事件监听设置
function setupEventListeners() {
    // 播放/暂停按钮
    playBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        if (isPlaying) pauseAudio();
        else playAudio();
    });

    // 上一首
    prevBtn.addEventListener('click', () => {
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = playlist.length - 1;
        loadTrack(newIndex);
        playAudio();
    });

    // 下一首
    nextBtn.addEventListener('click', () => {
        let newIndex = currentIndex + 1;
        if (newIndex >= playlist.length) newIndex = 0;
        loadTrack(newIndex);
        playAudio();
    });

    // 自动播放下一首
    audio.addEventListener('ended', () => {
        let newIndex = currentIndex + 1;
        if (newIndex >= playlist.length) newIndex = 0;
        loadTrack(newIndex);
        playAudio();
    });

    // 进度条更新
    audio.addEventListener('timeupdate', () => {
        if (isNaN(audio.duration)) return;
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    });

    // 拖动进度条
    progressBar.addEventListener('input', () => {
        const time = (progressBar.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    // 音量控制
    volumeBar.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    // 移动端切换列表显示
    toggleListBtn.addEventListener('click', () => {
        playlistPanel.classList.toggle('hidden');
        playlistPanel.classList.toggle('flex');
        playlistPanel.classList.toggle('absolute');
        playlistPanel.classList.toggle('inset-0');
        playlistPanel.classList.toggle('z-50');
        playlistPanel.classList.toggle('bg-gray-900/95');
    });
}

// 工具函数：格式化时间
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
