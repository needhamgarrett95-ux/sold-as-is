// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  // Hydrate custom icons
  Icon.hydrate();
  // Load saved progress (after Views is defined)
  const hadSave = Save.load();
  Feed.init();
  UI.refreshCash();
  Views.initPartsFilter();
  // Auto-save every 30s and when app goes to background
  setInterval(() => Save.save(), 30000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") Save.save();
  });
  // Clickable logos: reset to default view of each section
  document.getElementById("logo-main").addEventListener("click", () => {
    Views.show("market");
    Views.marketTab = "browse";
    Views.renderMarketFeed();
  });
  document.getElementById("logo-boneyard").addEventListener("click", () => {
    Views.show("parts");
    Views.boneyardTab = "buy";
    Views.renderParts();
  });
  // URL bar refresh button: market uses cooldown refresh, others reload their view
  const refreshBtn = document.getElementById("refresh-btn");
  const doRefresh = (e) => {
    if (e) e.preventDefault();
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") Views.refreshParts();
    else Views.show(Views.current);
  };
  refreshBtn.addEventListener("click", doRefresh);
  // iOS: only refresh on tap, not scroll
  let rty = 0, rtx = 0;
  refreshBtn.addEventListener("touchstart", (e) => {
    rty = e.touches[0].clientY; rtx = e.touches[0].clientX;
  }, { passive: true });
  refreshBtn.addEventListener("touchend", (e) => {
    const dy = Math.abs(e.changedTouches[0].clientY - rty);
    const dx = Math.abs(e.changedTouches[0].clientX - rtx);
    if (dy < 10 && dx < 10) doRefresh(e);
  }, { passive: false });
  document.querySelectorAll("#tabstrip .wtab").forEach(b => {
    const go = (e) => { if (e) e.preventDefault(); Views.show(b.dataset.view); };
    b.addEventListener("click", go);
    // iOS: only navigate on tap, not scroll
    let ty = 0, tx = 0;
    b.addEventListener("touchstart", (e) => {
      ty = e.touches[0].clientY; tx = e.touches[0].clientX;
    }, { passive: true });
    b.addEventListener("touchend", (e) => {
      const dy = Math.abs(e.changedTouches[0].clientY - ty);
      const dx = Math.abs(e.changedTouches[0].clientX - tx);
      if (dy < 10 && dx < 10) go(e);
    }, { passive: false });
  });
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      Feed.setFilter(c.dataset.filter);
    }));
  // Market search
  document.getElementById("market-search").addEventListener("input", (e) => {
    Feed.setSearch(e.target.value);
  });
  console.log("Sold As-Is: marketplace feed live.");
});
