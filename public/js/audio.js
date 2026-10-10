// Sold As-Is — Audio engine: music player + SFX
const AudioEngine = {
  music: null,
  musicOn: true,
  sfxOn: true,
  currentTrack: 0,
  tracks: [
    { file: "audio/soldasis-01.mp3", name: "Marketplace Haze" },
    { file: "audio/soldasis-02.mp3", name: "Garage Blues" },
    { file: "audio/soldasis-03.mp3", name: "Midnight Scroll" },
    { file: "audio/soldasis-04.mp3", name: "Keeper's Wall" },
    { file: "audio/soldasis-05.mp3", name: "Lowball Shuffle" },
    { file: "audio/soldasis-06.mp3", name: "Sold As-Is Theme" },
  ],

  init() {
    // Load prefs
    try {
      const p = JSON.parse(localStorage.getItem("soldasis_audio") || "{}");
      this.musicOn = p.musicOn !== false;
      this.sfxOn = p.sfxOn !== false;
      this.currentTrack = p.track || 0;
    } catch (e) {}
    // Preload SFX
    this.sfxTyping = new Audio("audio/sfx-typing-fixed.mp3");
    this.sfxTyping.preload = "auto";
    this.sfxTouch = new Audio("audio/sfx-touch-b.mp3");
    this.sfxTouch.preload = "auto";
    // Start music (after user gesture — iOS requirement)
    const startOnGesture = () => {
      if (this.musicOn) this.playMusic();
      document.removeEventListener("touchstart", startOnGesture);
      document.removeEventListener("click", startOnGesture);
    };
    document.addEventListener("touchstart", startOnGesture, { once: true });
    document.addEventListener("click", startOnGesture, { once: true });
  },

  savePrefs() {
    localStorage.setItem("soldasis_audio", JSON.stringify({
      musicOn: this.musicOn, sfxOn: this.sfxOn, track: this.currentTrack,
    }));
  },

  playMusic() {
    if (!this.musicOn) return;
    if (!this.music) {
      this.music = new Audio();
      this.music.loop = true;
      this.music.volume = 0.5;
      this.music.addEventListener("ended", () => this.nextTrack());
    }
    const t = this.tracks[this.currentTrack];
    if (this.music.src !== new URL(t.file, location.href).href) {
      this.music.src = t.file;
    }
    this.music.play().catch(() => {});
    this.updatePlayerUI();
  },

  stopMusic() {
    if (this.music) this.music.pause();
  },

  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    if (this.music) {
      this.music.src = this.tracks[this.currentTrack].file;
      if (this.musicOn) this.music.play().catch(() => {});
    }
    this.savePrefs();
    this.updatePlayerUI();
  },

  prevTrack() {
    this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
    if (this.music) {
      this.music.src = this.tracks[this.currentTrack].file;
      if (this.musicOn) this.music.play().catch(() => {});
    }
    this.savePrefs();
    this.updatePlayerUI();
  },

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.playMusic();
    else this.stopMusic();
    this.savePrefs();
    this.updatePlayerUI();
  },

  toggleSfx() {
    this.sfxOn = !this.sfxOn;
    this.savePrefs();
    this.updatePlayerUI();
  },

  playTyping() {
    if (!this.sfxOn || !this.sfxTyping) return;
    this.sfxTyping.currentTime = 0;
    this.sfxTyping.play().catch(() => {});
  },

  playTouch() {
    if (!this.sfxOn || !this.sfxTouch) return;
    // Clone for overlap
    const a = this.sfxTouch.cloneNode();
    a.volume = 0.6;
    a.play().catch(() => {});
  },

  updatePlayerUI() {
    const t = document.getElementById("music-track-name");
    if (t) t.textContent = this.tracks[this.currentTrack].name;
    const btn = document.getElementById("music-toggle");
    if (btn) btn.textContent = this.musicOn ? "⏸" : "▶";
  },

  renderPlayer() {
    if (document.getElementById("music-bar")) return;
    const bar = document.createElement("div");
    bar.id = "music-bar";
    bar.innerHTML =
      '<button id="music-prev" aria-label="Previous track">⏮</button>' +
      '<button id="music-toggle" aria-label="Play/Pause">⏸</button>' +
      '<button id="music-next" aria-label="Next track">⏭</button>' +
      '<div class="music-info"><span class="music-note">♪</span><span id="music-track-name">' +
        this.tracks[this.currentTrack].name + "</span></div>" +
      '<button id="music-sfx" aria-label="Toggle sound effects" title="Sound effects">🔔</button>';
    document.getElementById("browser").appendChild(bar);
    bar.querySelector("#music-prev").addEventListener("click", (e) => { e.stopPropagation(); this.prevTrack(); });
    bar.querySelector("#music-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMusic();
    });
    bar.querySelector("#music-next").addEventListener("click", (e) => { e.stopPropagation(); this.nextTrack(); });
    const sfxBtn = bar.querySelector("#music-sfx");
    sfxBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSfx();
      sfxBtn.textContent = this.sfxOn ? "🔔" : "🔕";
      sfxBtn.style.opacity = this.sfxOn ? "1" : "0.4";
    });
    if (!this.sfxOn) { sfxBtn.textContent = "🔕"; sfxBtn.style.opacity = "0.4"; }
    // Tapping the bar (not buttons) toggles music too
    bar.addEventListener("click", () => this.toggleMusic());
    this.updatePlayerUI();
  },
};
