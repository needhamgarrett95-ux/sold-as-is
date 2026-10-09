// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  // URL bar refresh button: market uses cooldown refresh, others reload their view
  const refreshBtn = document.getElementById("refresh-btn");
  const doRefresh = (e) => {
    if (e) e.preventDefault();
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") { Views.partsShop = genPartsShop(12); Views.renderParts(); }
    else Views.show(Views.current);
  };
  refreshBtn.addEventListener("click", doRefresh);
  refreshBtn.addEventListener("touchend", doRefresh, { passive: false });
  document.querySelectorAll("#tabstrip .wtab").forEach(b => {
    const go = (e) => { if (e) e.preventDefault(); Views.show(b.dataset.view); };
    b.addEventListener("click", go);
    b.addEventListener("touchend", go, { passive: false });
  });
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      UI.toast(`Showing: ${c.textContent} (filter coming soon)`);
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
