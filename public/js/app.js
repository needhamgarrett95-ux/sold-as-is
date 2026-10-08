// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  Feed.init();
  UI.refreshCash();
  document.querySelectorAll("#tabbar .tab").forEach(t =>
    t.addEventListener("click", () => {
      document.querySelectorAll("#tabbar .tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      if (t.dataset.tab === "feed") Detail.close();
      else UI.toast(t.dataset.tab === "garage"
        ? (State.garage.length ? `${State.garage.length} bike(s) in the garage` : "Garage is empty — go buy something")
        : "Collection wall coming soon");
    }));
  console.log("Sold As-Is: marketplace feed live.");
});
