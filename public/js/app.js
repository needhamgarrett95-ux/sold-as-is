// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  document.getElementById("refresh-btn").addEventListener("click", () => Feed.refresh());
  // Fake browser reload button actually reloads the current view
  document.querySelector(".urlbar .reload").addEventListener("click", () => {
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") { Views.partsShop = genPartsShop(12); Views.renderParts(); }
    else Views.show(Views.current);
  });
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
