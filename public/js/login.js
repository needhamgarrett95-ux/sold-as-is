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
  const doLogin = () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Signing in...";
    // Note: no pw.focus() — iOS would pop the keyboard during auto-type
    let n = 0;
    // Natural typing rhythm: base ~90ms with human variation,
    // occasional slightly longer pause (like thinking between chars)
    const typeNext = () => {
      n++;
      pw.value = "*".repeat(n);
      // Tick plays at the exact moment the asterisk renders
      if (typeof AudioEngine !== "undefined") AudioEngine.playTyping();
      if (n >= 7) {
        setTimeout(() => {
          loginScreen.classList.add("hidden");
          // Start tutorial on first run (after login)
          if (typeof Tutorial !== "undefined") {
            setTimeout(() => Tutorial.start(), 800);
          }
        }, 450);
        return;
      }
      // Human variation: 70-110ms base, 15% chance of a 180-250ms "think" pause
      const delay = Math.random() < 0.15
        ? 180 + Math.random() * 70
        : 70 + Math.random() * 40;
      setTimeout(typeNext, delay);
    };
    // Small delay before typing starts (like reaching for the keyboard)
    setTimeout(typeNext, 300);
  };

  btn.addEventListener("click", doLogin);
  pw.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
});
