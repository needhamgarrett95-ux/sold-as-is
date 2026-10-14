// Sold As-Is — native iOS bridge (personal edition only, not in the web build)
// Loaded only inside the native app wrapper. It mirrors the game's save
// (localStorage key "soldasis_save_v1") into a real file in the app's
// Documents folder via the Swift side, so the save lives in the app's
// native sandbox — Safari cache clears and service workers can't touch it.
// The Swift side seeds localStorage from that file before the page loads.
(function () {
  var handler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saveSync;
  if (!handler) return; // plain web build: do nothing
  window.SoldAsIsNative = true;

  var KEY = "soldasis_save_v1";
  function post(msg) { try { handler.postMessage(msg); } catch (e) {} }

  var origSet = Storage.prototype.setItem;
  var origRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (k, v) {
    origSet.call(this, k, v);
    if (k === KEY) post({ action: "save", value: String(v) });
  };
  Storage.prototype.removeItem = function (k) {
    origRemove.call(this, k);
    if (k === KEY) post({ action: "clear" });
  };

  document.addEventListener("DOMContentLoaded", function () {
    var menu = document.getElementById("settings-menu");
    if (!menu || document.getElementById("settings-export")) return;
    var about = menu.querySelector(".settings-about");

    var exp = document.createElement("button");
    exp.className = "settings-item";
    exp.id = "settings-export";
    exp.innerHTML = 'Export save <span class="settings-sub">backup file</span>';
    exp.addEventListener("click", function () {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      post({ action: "export", value: raw || "" });
    });

    var imp = document.createElement("button");
    imp.className = "settings-item";
    imp.id = "settings-import";
    imp.innerHTML = 'Import save <span class="settings-sub">restore backup</span>';
    imp.addEventListener("click", function () { post({ action: "import" }); });

    if (about) { menu.insertBefore(exp, about); menu.insertBefore(imp, about); }
    else { menu.appendChild(exp); menu.appendChild(imp); }
  });
})();
