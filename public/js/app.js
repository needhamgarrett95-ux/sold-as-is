// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  document.getElementById("refresh-btn").addEventListener("click", () => Feed.refresh());
  document.querySelectorAll("#tabbar .tab").forEach(b =>
    b.addEventListener("click", () => {
      document.querySelectorAll("#tabbar .tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      Views.show(b.dataset.view);
    }));
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      UI.toast(`Showing: ${c.textContent} (filter coming soon)`);
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
