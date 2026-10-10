// Sold As-Is — Spotify embed player (iOS-compatible)
// Uses Spotify's embed iframe — no login, no SDK, works on iPhone.
const SPOTIFY_PLAYLIST_ID = "6VvwciGOBHM3XfEqtHqV8S";

const SpotifyPlayer = {
  embedVisible: false,

  toggleEmbed() {
    let wrap = document.getElementById("sp-embed-wrap");
    if (wrap) {
      wrap.remove();
      this.embedVisible = false;
      return;
    }
    wrap = document.createElement("div");
    wrap.id = "sp-embed-wrap";
    wrap.innerHTML =
      '<div class="sp-embed-head">' +
        "<strong>Sold As-Is Playlist</strong>" +
        '<button id="sp-embed-close">✕</button>' +
      "</div>" +
      '<iframe src="https://open.spotify.com/embed/playlist/' + SPOTIFY_PLAYLIST_ID + '?utm_source=generator&theme=0"' +
        ' width="100%" height="352" frameborder="0" allowfullscreen=""' +
        ' allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"' +
        ' loading="lazy"></iframe>';
    document.getElementById("browser").appendChild(wrap);
    wrap.querySelector("#sp-embed-close").addEventListener("click", () => {
      wrap.remove();
      this.embedVisible = false;
    });
    this.embedVisible = true;
  },

  renderMiniPlayer() {
    if (document.getElementById("sp-bar")) return;
    const bar = document.createElement("div");
    bar.id = "sp-bar";
    bar.innerHTML =
      '<button id="sp-open">' +
        '<span class="sp-note">♪</span>' +
        "<span>Sold As-Is Playlist</span>" +
      "</button>";
    const browser = document.getElementById("browser");
    if (browser) browser.appendChild(bar);
    bar.querySelector("#sp-open").addEventListener("click", () => this.toggleEmbed());
  },
};
