// Sold As-Is — Spotify integration (Web Playback SDK + PKCE)
// Client ID goes here once Garrett creates the Spotify Developer app.
const SPOTIFY_CLIENT_ID = "YOUR_CLIENT_ID_HERE";
const SPOTIFY_REDIRECT = location.origin + location.pathname;
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

const SpotifyPlayer = {
  token: null,
  refreshToken: null,
  expiresAt: 0,
  player: null,
  deviceId: null,
  connected: false,
  currentTrack: null,

  configured() {
    return SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_ID !== "YOUR_CLIENT_ID_HERE";
  },

  // ---- PKCE helpers ----
  _rand(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
  },
  async _challenge(verifier) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },

  // ---- Auth flow ----
  async login() {
    if (!this.configured()) {
      UI.toast("Spotify isn't set up yet — need a client ID");
      return;
    }
    const verifier = this._rand(32);
    sessionStorage.setItem("sp_verifier", verifier);
    const challenge = await this._challenge(verifier);
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: SPOTIFY_REDIRECT,
      scope: SPOTIFY_SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
    location.href = "https://accounts.spotify.com/authorize?" + params.toString();
  },

  async handleCallback() {
    const code = new URLSearchParams(location.search).get("code");
    if (!code) return false;
    const verifier = sessionStorage.getItem("sp_verifier");
    if (!verifier) return false;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: SPOTIFY_REDIRECT,
          code_verifier: verifier,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        this.token = data.access_token;
        this.refreshToken = data.refresh_token;
        this.expiresAt = Date.now() + data.expires_in * 1000;
        localStorage.setItem("sp_refresh", data.refresh_token);
        // Clean the URL
        history.replaceState(null, "", location.pathname + location.search.replace(/[?&]code=[^&]*/, "").replace(/^[?&]/, "?"));
        sessionStorage.removeItem("sp_verifier");
        this.initPlayer();
        return true;
      }
    } catch (e) {
      console.warn("Spotify token exchange failed", e);
    }
    return false;
  },

  async refresh() {
    const rt = this.refreshToken || localStorage.getItem("sp_refresh");
    if (!rt || !this.configured()) return false;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: rt,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        this.token = data.access_token;
        this.expiresAt = Date.now() + data.expires_in * 1000;
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
          localStorage.setItem("sp_refresh", data.refresh_token);
        }
        return true;
      }
    } catch (e) {
      console.warn("Spotify refresh failed", e);
    }
    return false;
  },

  async ensureToken() {
    if (this.token && Date.now() < this.expiresAt - 60000) return true;
    return this.refresh();
  },

  logout() {
    this.token = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    this.connected = false;
    this.currentTrack = null;
    localStorage.removeItem("sp_refresh");
    if (this.player) { try { this.player.disconnect(); } catch (e) {} this.player = null; }
    this.renderMiniPlayer();
    UI.toast("Signed out of Spotify");
  },

  // ---- Web Playback SDK ----
  initPlayer() {
    if (!this.configured() || this.player) return;
    if (!window.Spotify) {
      // SDK not loaded yet — load it
      const s = document.createElement("script");
      s.src = "https://sdk.scdn.co/spotify-player.js";
      s.onload = () => this._createPlayer();
      document.head.appendChild(s);
    } else {
      this._createPlayer();
    }
  },

  _createPlayer() {
    window.onSpotifyWebPlaybackSDKReady = () => this._createPlayer();
    if (!window.Spotify || this.player) return;
    this.player = new Spotify.Player({
      name: "Sold As-Is",
      getOAuthToken: async (cb) => {
        const ok = await this.ensureToken();
        if (ok) cb(this.token);
      },
      volume: 0.8,
    });
    this.player.addListener("ready", ({ device_id }) => {
      this.deviceId = device_id;
      this.connected = true;
      this.renderMiniPlayer();
      UI.toast("Spotify connected — pick something to play");
    });
    this.player.addListener("not_ready", () => {
      this.connected = false;
      this.renderMiniPlayer();
    });
    this.player.addListener("player_state_changed", (state) => {
      if (!state) return;
      const t = state.track_window.current_track;
      this.currentTrack = t ? { name: t.name, artist: t.artists.map(a => a.name).join(", "), img: t.album.images[0]?.url } : null;
      this.renderMiniPlayer();
    });
    this.player.connect();
  },

  async _api(path, method = "GET", body = null) {
    const ok = await this.ensureToken();
    if (!ok) return null;
    const res = await fetch("https://api.spotify.com/v1" + path, {
      method,
      headers: { Authorization: "Bearer " + this.token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return {};
    try { return await res.json(); } catch (e) { return null; }
  },

  async playContext(uri) {
    if (!this.deviceId) { UI.toast("Spotify not ready yet"); return; }
    await this._api(`/me/player/play?device_id=${this.deviceId}`, "PUT",
      uri ? { context_uri: uri } : {});
  },
  async toggle() {
    if (!this.player) return;
    const state = await this.player.getCurrentState();
    if (!state) { this.playContext(); return; }
    this.player.togglePlay();
  },
  async next() { if (this.player) this.player.nextTrack(); },
  async prev() { if (this.player) this.player.previousTrack(); },

  async getPlaylists() {
    const data = await this._api("/me/playlists?limit=20");
    return (data && data.items) || [];
  },

  // ---- Mini player UI ----
  renderMiniPlayer() {
    let bar = document.getElementById("sp-bar");
    if (!this.connected && !this.configured()) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "sp-bar";
      document.getElementById("browser").appendChild(bar);
      bar.innerHTML = `
        <div class="sp-info"><img id="sp-art" alt=""><div><div id="sp-title">Not playing</div><div id="sp-artist"></div></div></div>
        <div class="sp-controls">
          <button id="sp-prev" aria-label="Previous">⏮</button>
          <button id="sp-toggle" aria-label="Play/Pause">▶</button>
          <button id="sp-next" aria-label="Next">⏭</button>
          <button id="sp-pl" aria-label="Playlists">☰</button>
        </div>
        <div class="sp-playlists hidden" id="sp-playlists"></div>`;
      bar.querySelector("#sp-toggle").addEventListener("click", () => this.toggle());
      bar.querySelector("#sp-next").addEventListener("click", () => this.next());
      bar.querySelector("#sp-prev").addEventListener("click", () => this.prev());
      bar.querySelector("#sp-pl").addEventListener("click", () => this.togglePlaylists());
    }
    const t = this.currentTrack;
    bar.querySelector("#sp-title").textContent = t ? t.name : (this.connected ? "Pick a playlist ☰" : "Connecting…");
    bar.querySelector("#sp-artist").textContent = t ? t.artist : "";
    const art = bar.querySelector("#sp-art");
    if (t && t.img) { art.src = t.img; art.style.display = "block"; }
    else art.style.display = "none";
  },

  async togglePlaylists() {
    const list = document.getElementById("sp-playlists");
    if (!list) return;
    if (!list.classList.contains("hidden")) { list.classList.add("hidden"); return; }
    list.innerHTML = `<div class="sp-pl-loading">Loading…</div>`;
    list.classList.remove("hidden");
    const playlists = await this.getPlaylists();
    if (!playlists.length) {
      list.innerHTML = `<div class="sp-pl-loading">No playlists found</div>`;
      return;
    }
    list.innerHTML = playlists.map(p =>
      `<button class="sp-pl-item" data-uri="${p.uri}">
        ${p.images[0] ? `<img src="${p.images[0].url}" alt="">` : ""}
        <span>${p.name}</span>
      </button>`).join("");
    list.querySelectorAll(".sp-pl-item").forEach(b =>
      b.addEventListener("click", () => {
        this.playContext(b.dataset.uri);
        list.classList.add("hidden");
      }));
  },
};
