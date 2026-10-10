// Sold As-Is — login / splash screen
document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("login-screen");
  // Skip login for trailer capture (?trailer=1)
  if (new URLSearchParams(location.search).get("trailer") === "1") {
    loginScreen.classList.add("hidden");
    return;
  }
  const btn = document.getElementById("login-btn");
  const pw = document.getElementById("password");
  // 140 wpm ≈ 11.67 chars/sec → ~86ms per asterisk
  const PER_ASTERISK_MS = 60000 / (140 * 5);

  const doLogin = () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Signing in...";
    // Typing SFX fires with the asterisk animation (7 ticks @ 86ms)
    if (typeof AudioEngine !== "undefined") AudioEngine.playTyping();
    // Note: no pw.focus() — iOS would pop the keyboard during auto-type
    let n = 0;
    const timer = setInterval(() => {
      n++;
      pw.value = "*".repeat(n);
      if (n >= 7) {
        clearInterval(timer);
        setTimeout(() => {
          loginScreen.classList.add("hidden");
        }, 450);
      }
    }, PER_ASTERISK_MS);
  };

  btn.addEventListener("click", doLogin);
  pw.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
});
