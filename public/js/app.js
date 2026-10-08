// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  document.querySelectorAll(".mnav").forEach(b =>
    b.addEventListener("click", () => Views.show(b.dataset.view)));
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      UI.toast(`Showing: ${c.textContent} (filter coming soon)`);
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
