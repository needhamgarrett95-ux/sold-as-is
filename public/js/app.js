// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  // URL bar refresh button: market uses cooldown refresh, others reload their view
  document.getElementById("refresh-btn").addEventListener("click", () => {
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") { Views.partsShop = genPartsShop(12); Views.renderParts(); }
    else Views.show(Views.current);
  });
  document.querySelectorAll("#tabstrip .wtab").forEach(b =>
    b.addEventListener("click", () => Views.show(b.dataset.view)));
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      UI.toast(`Showing: ${c.textContent} (filter coming soon)`);
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
