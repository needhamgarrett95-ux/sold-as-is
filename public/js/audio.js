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
    // Pause music when app goes to background (iOS PWA, tab switch, etc.)
    const pauseOnHide = () => {
      if (this.music && !this.music.paused) {
        this.music.pause();
        this._wasPlayingOnHide = true;
      }
      // Clear media session so iOS doesn't show it in Dynamic Island
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
        navigator.mediaSession.metadata = null;
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseOnHide();
    });
    window.addEventListener("pagehide", pauseOnHide);
    // Also handle blur for iOS standalone
    window.addEventListener("blur", pauseOnHide);
    // Load prefs
    try {
      const p = JSON.parse(localStorage.getItem("soldasis_audio") || "{}");
      this.musicOn = p.musicOn !== false;
      this.sfxOn = p.sfxOn !== false;
      this.currentTrack = p.track || 0;
    } catch (e) {}
    // Preload SFX
    this.sfxTyping = new Audio("assets/sfx-login-key.mp3");
    this.sfxTyping.preload = "auto";
    this.sfxTouch = new Audio("assets/sfx-tap-real.mp3");
    this.sfxTouch.preload = "auto";
    this.sfxBell = new Audio("assets/sfx-bell.mp3");
    this.sfxBell.preload = "auto";
    // Preload tap and typing tick into Web Audio buffers for zero-delay playback
    try {
      this._actx = this._actx || new (window.AudioContext || window.webkitAudioContext)();
      fetch("assets/sfx-tap-real.mp3").then(r => r.arrayBuffer()).then(buf => {
        this._actx.decodeAudioData(buf, (decoded) => { this._tapBuffer = decoded; });
      }).catch(() => {});
      fetch("assets/sfx-login-key.mp3").then(r => r.arrayBuffer()).then(buf => {
        this._actx.decodeAudioData(buf, (decoded) => { this._tickBuffer = decoded; });
      }).catch(() => {});
      fetch("assets/sfx-bell.mp3").then(r => r.arrayBuffer()).then(buf => {
        this._actx.decodeAudioData(buf, (decoded) => { this._bellBuffer = decoded; });
      }).catch(() => {});
    } catch (e) {}
    // Music starts only when the player taps play (no autoplay)
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
    this.music.onplay = () => this.updatePlayerUI();
    this.music.onpause = () => this.updatePlayerUI();
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
    if (!this.sfxOn) return;
    // Prefer Web Audio buffer (precise timing, no overlap issues)
    if (this._tickBuffer && this._actx) {
      try {
        // Resume context if suspended (iOS)
        if (this._actx.state === "suspended") this._actx.resume();
        const src = this._actx.createBufferSource();
        src.buffer = this._tickBuffer;
        const g = this._actx.createGain();
        g.gain.value = 0.5 * (this.sfxVolume || 1);
        src.connect(g); g.connect(this._actx.destination);
        src.start(0);
        return;
      } catch (e) {}
    }
    if (!this.sfxTyping) return;
    this.sfxTyping.currentTime = 0;
    this.sfxTyping.play().catch(() => {});
  },

  playTouch() {
    if (!this.sfxOn) return;
    // Prefer Web Audio buffer (zero delay, overlap allowed)
    if (this._tapBuffer && this._actx) {
      try {
        const src = this._actx.createBufferSource();
        src.buffer = this._tapBuffer;
        const g = this._actx.createGain();
        g.gain.value = 0.4 * (this.sfxVolume || 1);
        src.connect(g); g.connect(this._actx.destination);
        src.start(0);
        return;
      } catch (e) {}
    }
    if (!this.sfxTouch) return;
    const a = this.sfxTouch.cloneNode();
    a.volume = 0.4;
    a.play().catch(() => {});
  },

  playBell() {
    if (!this.sfxOn) return;
    if (this._bellBuffer && this._actx) {
      try {
        const src = this._actx.createBufferSource();
        src.buffer = this._bellBuffer;
        const g = this._actx.createGain();
        g.gain.value = 0.5 * (this.sfxVolume || 1);
        src.connect(g); g.connect(this._actx.destination);
        src.start(0);
        return;
      } catch (e) {}
    }
    if (!this.sfxBell) return;
    const a = this.sfxBell.cloneNode();
    a.volume = 0.5;
    a.play().catch(() => {});
  },

  updatePlayerUI() {
    const t = document.getElementById("music-track-name");
    if (t) t.textContent = this.tracks[this.currentTrack].name;
    const icon = document.getElementById("music-toggle-icon");
    if (icon) {
      // Swap play/pause SVG
      const playing = this.musicOn && this.music && !this.music.paused;
      icon.setAttribute("data-icon", playing ? "pause" : "play");
      if (typeof Icon !== "undefined") Icon.hydrate(icon.parentElement);
    }
  },

  renderPlayer() {
    // Wire up the popup player (in index.html)
    const popup = document.getElementById("music-popup");
    if (!popup || popup.dataset.wired) return;
    popup.dataset.wired = "1";
    document.getElementById("music-prev")?.addEventListener("click", (e) => { e.stopPropagation(); this.prevTrack(); });
    document.getElementById("music-toggle")?.addEventListener("click", (e) => { e.stopPropagation(); this.toggleMusic(); });
    document.getElementById("music-next")?.addEventListener("click", (e) => { e.stopPropagation(); this.nextTrack(); });
    document.getElementById("music-sfx-toggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSfx();
      const sub = document.getElementById("music-sfx-sub");
      if (sub) sub.textContent = this.sfxOn ? "on" : "off";
    });
    const sub = document.getElementById("music-sfx-sub");
    if (sub) sub.textContent = this.sfxOn ? "on" : "off";
    // Music note toggles the popup
    document.getElementById("music-note")?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("settings-menu")?.classList.add("hidden");
      document.getElementById("activity-popup")?.classList.add("hidden");
      popup.classList.toggle("hidden");
    });
    // Close popup when tapping elsewhere
    document.addEventListener("click", (e) => {
      if (!popup.classList.contains("hidden") && !popup.contains(e.target) &&
          !e.target.closest("#music-note")) {
        popup.classList.add("hidden");
      }
    });
    this.updatePlayerUI();
  },
};
