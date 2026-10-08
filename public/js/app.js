// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      Detail.close();
      UI.toast(`Showing: ${c.textContent} (filter coming soon)`);
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
