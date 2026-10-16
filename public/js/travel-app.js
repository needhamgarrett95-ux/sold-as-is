/* Travel map — clean rebuild (2026-10-16).
 * Single system: plan trips from green pins, drive leg by leg, pick up bikes.
 * No legacy single-destination code. State is simple and explicit.
 */
window.TravelMap = (function () {
  'use strict';

  var HOME = 'Port Angeles';
  var CAPACITY = 15;      // gallons
  var MPG = 12;           // miles per gallon
  var FUEL_PRICE = 2.50;  // $/gal flat
  var TOW_RATE = 3.50;    // $/mile tow fee
  var MAX_STOPS = 3;

  // Town data: name, miles from home, lat, lng
  var towns = [
    ['Port Angeles',0,48.11892,-123.43112],['Agnew',8,48.10524,-123.24794],['Carlsborg',12,48.0897,-123.17287],['Joyce',15,48.13635,-123.73438],['Sequim',17,48.07965,-123.10367],['Blyn',20,48.02157,-123.00063],['Diamond Point',25,48.08489,-122.95169],['Chimacum',28,48.01182,-122.77328],['Port Hadlock',30,48.02571,-122.75858],['Gardiner',32,48.05021,-122.9254],['Port Townsend',35,48.1212,-122.77263],['Nordland',36,48.05105,-122.69107],['Beaver',40,48.05431,-124.33152],['Marrowstone',41,48.07226,-122.70206],['Sappho',45,48.06878,-124.2919],['Quilcene',46,47.82642,-122.8775],['Clallam Bay',50,48.25379,-124.26015],['Forks',55,47.95014,-124.38543],['Brinnon',57,47.69838,-122.89646],['Sekiu',62,48.25978,-124.30041],['Poulsbo',63,47.73689,-122.64681],['Silverdale',66,47.65171,-122.69275],['La Push',70,47.9082,-124.63663],['Neah Bay',72,48.36786,-124.62755],['Bremerton',75,47.565,-122.62749],['Hoodsport',78,47.40639,-123.14135],['Port Orchard',82,47.54103,-122.63847],['Shelton',90,47.21253,-123.10616],['Olympia',108,47.03954,-122.89165],['Tacoma',112,47.25517,-122.44164]
  ].map(function(t){ return {name:t[0], miles:t[1], lat:t[2], lng:t[3]}; });
  var byName = {};
  towns.forEach(function(t){ byName[t.name] = t; });

  // Gas stations: town -> {name, price}
  var stations = {
    'Port Angeles':{name:'Strait View Fuel',price:FUEL_PRICE},
    'Sequim':{name:'Rainshadow Fuel',price:FUEL_PRICE},
    'Beaver':{name:'Beaver Junction',price:FUEL_PRICE},
    'Forks':{name:'Forks Fuel & Timber',price:FUEL_PRICE},
    'Neah Bay':{name:'Makah Bay Trading Post',price:FUEL_PRICE},
    'Clallam Bay':{name:'Strait Side Gas',price:FUEL_PRICE},
    'Port Townsend':{name:'Victorian Petrol',price:FUEL_PRICE},
    'Quilcene':{name:'Quilcene Quick Stop',price:FUEL_PRICE},
    'Hoodsport':{name:'Canal-side Gas',price:FUEL_PRICE},
    'Shelton':{name:'Shelton Speedway',price:FUEL_PRICE},
    'Olympia':{name:'Capital Fill-Up',price:FUEL_PRICE},
    'Bremerton':{name:'Shipyard Fuel',price:FUEL_PRICE},
    'Poulsbo':{name:'Viking Pump',price:FUEL_PRICE}
  };

  // Pin positions on the map image (percent coordinates) — Garrett approved
  var PIN_POS = {
    "Agnew": [43.0, 22.3],
    "Beaver": [20.0, 28.3],
    "Blyn": [55.5, 22.3],
    "Bremerton": [74.2, 64.6],
    "Brinnon": [66.8, 59.3],
    "Carlsborg": [46.8, 23.2],
    "Chimacum": [65.5, 32.0],
    "Clallam Bay": [18.5, 19.0],
    "Diamond Point": [59.5, 21.8],
    "Forks": [19.0, 40.0],
    "Gardiner": [61.2, 25.5],
    "Hoodsport": [65.5, 71.0],
    "Joyce": [28.0, 21.4],
    "La Push": [11.5, 43.5],
    "Marrowstone": [69.8, 34.2],
    "Neah Bay": [5.5, 13.1],
    "Nordland": [69.2, 29.7],
    "Olympia": [63.0, 93.8],
    "Port Angeles": [35.0, 20.5],
    "Port Hadlock": [67.5, 33.5],
    "Port Orchard": [73.5, 68.0],
    "Port Townsend": [68.5, 28.0],
    "Poulsbo": [72.0, 60.0],
    "Quilcene": [64.0, 52.0],
    "Sekiu": [12.0, 15.0],
    "Shelton": [62.0, 78.0],
    "Silverdale": [73.0, 62.0],
    "Tacoma": [70.0, 95.0]
  };

  var HTML =
    '<main class="app-shell">' +
      '<section class="hud" aria-label="Travel status">' +
        '<div class="hud-block">' +
          '<div class="eyebrow">Truck parked at</div>' +
          '<div class="location-name" id="travel-locationName">Port Angeles, WA</div>' +
          '<div class="location-sub" id="travel-locationSub">Home garage · keys on the hook</div>' +
        '</div>' +
        '<div class="hud-block">' +
          '<div class="eyebrow">Gas tank · 12 mpg</div>' +
          '<div class="fuel-row">' +
            '<div class="fuel-stack"><div class="fuel-number"><span id="travel-fuelValue">15.0</span> / 15 gal</div><div class="fuel-bar"><div id="travel-fuelFill" class="fuel-fill"></div></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="hud-block">' +
          '<div class="eyebrow">Wallet</div>' +
          '<div class="money" id="travel-walletValue">$0.00</div>' +
          '<div class="location-sub">Fuel comes out of the flip money.</div>' +
        '</div>' +
      '</section>' +
      '<section class="content-grid">' +
        '<div class="left-stack">' +
          '<div class="layer-bar"><div class="layer-hint">Red pins are listings · green are your deals · yellow are gas stations.</div></div>' +
          '<div class="map-frame">' +
            '<div id="travel-map" aria-label="Map of the Olympic Peninsula"></div>' +
            '<div id="travel-travelRibbon" class="travel-ribbon"><div class="travel-copy" id="travel-travelCopy">Rolling out…</div><div class="ribbon-road"></div></div>' +
          '</div>' +
        '</div>' +
        '<aside class="right-stack">' +
          '<section class="route-panel">' +
            '<h2 class="section-title">Trip planner</h2>' +
            '<div class="trip-panel" id="travel-tripPanel">' +
              '<div class="trip-stops" id="travel-tripStops"><span class="trip-empty">Tap green pins in the order you want to visit them (up to 3).</span></div>' +
              '<div class="trip-math" id="travel-tripMath" hidden></div>' +
              '<div class="trip-actions">' +
                '<button class="btn" id="travel-tripClear" type="button">Clear</button>' +
                '<button class="btn gold" id="travel-tripGo" type="button" disabled>Roll out</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<section class="log-panel">' +
            '<div class="log-head"><h2 class="section-title">Recent drives</h2></div>' +
            '<div class="log-list" id="travel-logList"><div class="log-empty">No road stories yet.</div></div>' +
          '</section>' +
        '</aside>' +
      '</section>' +
      '<div class="modal-backdrop" id="travel-fuelModal">' +
        '<div class="fuel-modal">' +
          '<div class="eyebrow" id="travel-fuelStationName">Fuel stop</div>' +
          '<h2 class="modal-title">Top off the truck</h2>' +
          '<div class="range-wrap">' +
            '<input id="travel-fuelSlider" type="range" min="0" max="0" step="0.1" value="0" />' +
            '<div class="fill-readout"><div><div class="eyebrow">Add</div><div class="fill-gallons"><span id="travel-fillGallons">0.0</span> gal</div></div><div><div class="eyebrow">Total</div><div class="fill-cost" id="travel-fillCost">$0.00</div></div></div>' +
          '</div>' +
          '<div class="modal-actions"><button class="btn ghost" id="travel-cancelFuel" type="button">Not now</button><button class="btn gold" id="travel-buyFuel" type="button">Pay &amp; pump</button></div>' +
        '</div>' +
      '</div>' +
    '</main>';

  var current = null;

  function init(rootEl, opts) {
    opts = opts || {};
    destroy();
    rootEl.innerHTML = HTML;
    rootEl.setAttribute('data-theme', opts.theme === 'light' ? 'light' : 'dark');
    current = createInstance(rootEl, opts);
    return current;
  }

  function destroy() {
    if (current) { try { current.destroy(); } catch (e) {} current = null; }
  }

  function createInstance(rootEl, opts) {
    // Simple state — everything the trip needs, nothing more
    var state = {
      fuel: (opts.fuel != null ? opts.fuel : 15),
      currentTown: HOME,
      tripStops: [],     // array of deal listingIds in visit order
      driving: false,
      logs: []
    };

    function money(v) { return '$' + v.toFixed(2); }

    function milesBetweenTowns(a, b) {
      if (a === b) return 0;
      var ta = byName[a], tb = byName[b];
      if (!ta || !tb) return 10;
      return Math.abs(ta.miles - tb.miles) || 5;
    }

    // Get deal objects for the planned stops, in order
    function tripDeals() {
      return (opts.deals || []).filter(function(d){
        return state.tripStops.indexOf(d.listingId) >= 0;
      }).sort(function(a, b){
        return state.tripStops.indexOf(a.listingId) - state.tripStops.indexOf(b.listingId);
      });
    }

    function tripMiles() {
      var stops = tripDeals();
      if (!stops.length) return 0;
      var miles = 0, from = HOME;
      stops.forEach(function(d){
        miles += milesBetweenTowns(from, d.town);
        from = d.town;
      });
      miles += milesBetweenTowns(from, HOME);
      return miles;
    }

    // --- Rendering ---

    function renderHUD() {
      document.getElementById('travel-locationName').textContent = state.currentTown + ', WA';
      document.getElementById('travel-locationSub').textContent =
        state.currentTown === HOME ? 'Home garage · keys on the hook' : 'On the road · ' + state.currentTown;
      document.getElementById('travel-fuelValue').textContent = state.fuel.toFixed(1);
      var fill = document.getElementById('travel-fuelFill');
      fill.style.width = (state.fuel / CAPACITY * 100) + '%';
      fill.classList.toggle('low', state.fuel < 4);
      document.getElementById('travel-walletValue').textContent = money(State.cash);
    }

    function renderLog() {
      var box = document.getElementById('travel-logList');
      if (!state.logs.length) {
        box.innerHTML = '<div class="log-empty">No road stories yet.</div>';
        return;
      }
      box.innerHTML = state.logs.slice(0, 6).map(function(l){
        return '<div class="log-item"><div class="log-main"><strong>' + l.title + '</strong><div class="log-meta">' + l.meta + '</div></div></div>';
      }).join('');
    }

    function renderTripPanel() {
      var stopsEl = rootEl.querySelector('#travel-tripStops');
      var mathEl = rootEl.querySelector('#travel-tripMath');
      var goBtn = rootEl.querySelector('#travel-tripGo');
      var clearBtn = rootEl.querySelector('#travel-tripClear');
      if (!stopsEl || !mathEl || !goBtn) return;

      if (state.driving) {
        stopsEl.innerHTML = '<span class="trip-empty">On the road…</span>';
        mathEl.hidden = true;
        goBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        return;
      }
      if (clearBtn) clearBtn.disabled = false;

      if (!state.tripStops.length) {
        stopsEl.innerHTML = '<span class="trip-empty">Tap green pins in the order you want to visit them (up to 3).</span>';
        mathEl.hidden = true;
        goBtn.disabled = true;
      } else {
        var stops = tripDeals();
        stopsEl.innerHTML = stops.map(function(d, i){
          return '<span class="trip-stop">' + (i+1) + '. ' + d.town + ' — ' + (d.bike.brand || '') + ' ' + (d.bike.model || '') + '</span>';
        }).join('');
        var miles = tripMiles();
        var gals = miles / MPG;
        var firstLegGals = milesBetweenTowns(HOME, stops[0].town) / MPG;
        var canStart = state.fuel >= firstLegGals;
        var enoughForAll = state.fuel >= gals;
        mathEl.hidden = false;
        mathEl.innerHTML =
          '<div class="trip-math-row"><span>Route</span><strong>' + HOME + ' → ' + stops.map(function(d){return d.town;}).join(' → ') + ' → ' + HOME + '</strong></div>' +
          '<div class="trip-math-row"><span>Distance</span><strong>' + miles + ' mi</strong></div>' +
          '<div class="trip-math-row"><span>Fuel needed</span><strong>' + gals.toFixed(1) + ' gal</strong></div>';
        goBtn.disabled = !canStart;
        if (!canStart) {
          mathEl.innerHTML += '<div class="trip-warn">Not enough fuel for the first leg (' + firstLegGals.toFixed(1) + ' gal). Fill up first.</div>';
        } else if (!enoughForAll) {
          mathEl.innerHTML += '<div class="trip-warn">You\'ll need gas stations along the way — yellow pins mark them.</div>';
        }
      }
    }

    function mountMap() {
      var el = rootEl.querySelector('#travel-map');
      if (!el) return;
      var html = '<div class="static-map"><img src="img/olympic-map.png" alt="Olympic Peninsula map" />';

      // Red pins: listings (reference only)
      var listings = opts.listings || [];
      // Fan out same-town listings
      var byTown = {};
      listings.forEach(function(l){
        if (!byTown[l.town]) byTown[l.town] = [];
        byTown[l.town].push(l);
      });
      Object.keys(byTown).forEach(function(town){
        var pos = PIN_POS[town];
        if (!pos) return;
        byTown[town].forEach(function(l, i){
          var angle = (i / Math.max(byTown[town].length, 1)) * Math.PI * 2 - Math.PI/2;
          var spread = byTown[town].length > 1 ? 1.6 : 0;
          var px = pos[0] + Math.cos(angle) * spread;
          var py = pos[1] + Math.sin(angle) * spread;
          html += '<button class="map-pin seller" style="left:' + px + '%;top:' + py + '%" aria-label="Listing in ' + town + '"><span class="pin-dot"></span></button>';
        });
      });

      // Green pins: deals (tap to add to trip)
      (opts.deals || []).forEach(function(deal){
        var pos = PIN_POS[deal.town];
        if (!pos) return;
        var stopNum = state.tripStops.indexOf(deal.listingId);
        var badge = stopNum >= 0 ? '<span class="pin-order">' + (stopNum + 1) + '</span>' : '<span class="pin-check">✓</span>';
        var selClass = stopNum >= 0 ? ' in-trip' : '';
        html += '<button class="map-pin deal' + selClass + '" data-deal="' + deal.listingId + '" style="left:' + pos[0] + '%;top:' + (pos[1] - 2.2) + '%" aria-label="Your deal in ' + deal.town + '">' + badge + '</button>';
      });

      // Route line
      if (state.tripStops.length > 0) {
        var pts = [PIN_POS[HOME]];
        tripDeals().forEach(function(d){
          var p = PIN_POS[d.town];
          if (p) pts.push(p);
        });
        pts.push(PIN_POS[HOME]);
        pts = pts.filter(Boolean);
        if (pts.length >= 2) {
          var d = pts.map(function(p, i){ return (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]; }).join(' ');
          html += '<svg class="route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="#febc2e" stroke-width="0.8" stroke-dasharray="2 1.2" stroke-linecap="round" opacity="0.9"/></svg>';
        }
      }

      // Home pin
      var hp = PIN_POS[HOME];
      if (hp) html += '<button class="map-pin home" style="left:' + hp[0] + '%;top:' + hp[1] + '%" aria-label="Home"><span class="pin-dot"></span></button>';

      // Yellow pins: gas stations (tap for fuel)
      Object.keys(stations).forEach(function(town){
        var pos = PIN_POS[town];
        if (!pos) return;
        html += '<button class="map-pin gas" data-gas="' + town + '" style="left:' + (pos[0]+1.2) + '%;top:' + (pos[1]+1.8) + '%" aria-label="' + stations[town].name + '"><span class="pin-pump">G</span></button>';
      });

      html += '</div>';
      el.innerHTML = html;

      // Green pins: toggle trip stops
      el.querySelectorAll('.map-pin.deal').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.driving) return;
          var dealId = +btn.getAttribute('data-deal');
          var idx = state.tripStops.indexOf(dealId);
          if (idx >= 0) {
            state.tripStops.splice(idx, 1);
          } else if (state.tripStops.length < MAX_STOPS) {
            state.tripStops.push(dealId);
          }
          renderTripPanel();
          mountMap();
        });
      });

      // Yellow pins: open fuel
      el.querySelectorAll('.map-pin.gas').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.driving) return;
          var town = btn.getAttribute('data-gas');
          var stn = stations[town];
          if (stn) openFuel(stn);
        });
      });
    }

    // --- Fuel ---

    var fuelStation = null;
    var pausedTrip = null;

    function openFuel(station) {
      fuelStation = station;
      var max = Math.max(0, Math.min(CAPACITY - state.fuel, State.cash / station.price));
      var slider = document.getElementById('travel-fuelSlider');
      slider.max = max.toFixed(1);
      slider.value = max.toFixed(1);
      document.getElementById('travel-fuelStationName').textContent = station.name + ' · $' + station.price.toFixed(2) + '/gal';
      updateFillReadout();
      document.getElementById('travel-fuelModal').classList.add('open');
    }

    function updateFillReadout() {
      var gallons = +document.getElementById('travel-fuelSlider').value;
      var cost = fuelStation ? gallons * fuelStation.price : 0;
      document.getElementById('travel-fillGallons').textContent = gallons.toFixed(1);
      document.getElementById('travel-fillCost').textContent = money(cost);
      document.getElementById('travel-buyFuel').disabled = gallons <= 0 || cost > State.cash + 1e-6;
    }

    function buyFuel() {
      if (!fuelStation) return;
      var gallons = +document.getElementById('travel-fuelSlider').value;
      var cost = gallons * fuelStation.price;
      if (gallons <= 0 || cost > State.cash + 1e-6) return;
      state.fuel = Math.min(CAPACITY, state.fuel + gallons);
      State.cash -= cost;
      state.logs.unshift({ title: fuelStation.name, meta: gallons.toFixed(1) + ' gal @ $' + fuelStation.price.toFixed(2) });
      closeFuel();
      renderHUD();
      renderLog();
      if (typeof UI !== "undefined" && UI.refreshCash) UI.refreshCash();
      // Resume paused trip if there is one
      if (pausedTrip) {
        var resume = pausedTrip;
        pausedTrip = null;
        fuelStation = null;
        setTimeout(resume, 500);
      }
      fuelStation = null;
    }

    function closeFuel() {
      document.getElementById('travel-fuelModal').classList.remove('open');
    }

    // --- Trip execution ---

    function executeTrip() {
      var stops = tripDeals();
      if (!stops.length || state.driving) return;
      var firstLegGals = milesBetweenTowns(HOME, stops[0].town) / MPG;
      if (state.fuel < firstLegGals) return;

      state.driving = true;
      renderTripPanel();

      // Build legs: home -> stop1 -> stop2 -> stop3 -> home
      var legs = [];
      var from = HOME;
      stops.forEach(function(d){
        legs.push({ from: from, to: d.town, deal: d });
        from = d.town;
      });
      legs.push({ from: from, to: HOME, deal: null });

      var legIdx = 0;
      var pickedUp = [];

      // Show progress ribbon
      var ribbon = rootEl.querySelector('#travel-travelRibbon');
      var copy = rootEl.querySelector('#travel-travelCopy');
      if (ribbon && copy) {
        copy.textContent = 'Rolling: ' + stops.map(function(d){ return d.town; }).join(' → ') + ' → home';
        ribbon.classList.add('active');
      }

      function runLeg() {
        if (legIdx >= legs.length) {
          finishTrip(pickedUp, null);
          return;
        }
        var leg = legs[legIdx];
        var miles = milesBetweenTowns(leg.from, leg.to);
        var need = miles / MPG;

        // Ran dry?
        if (state.fuel < need) {
          var towMiles = milesBetweenTowns(leg.from, HOME);
          var fee = Math.round(towMiles * TOW_RATE);
          finishTrip(pickedUp, { fee: fee, from: leg.from });
          return;
        }

        state.fuel -= need;
        state.currentTown = leg.to;
        renderHUD();

        // Pick up bike at this stop
        if (leg.deal) {
          pickedUp.push(leg.deal);
          // Remove from persistent deals
          var ts = State.travel;
          if (ts && ts.deals) {
            ts.deals = ts.deals.filter(function(d){ return d.listingId !== leg.deal.listingId; });
            opts.deals = ts.deals;
          }
          state.logs.unshift({
            title: 'Picked up ' + (leg.deal.bike.brand || '') + ' ' + (leg.deal.bike.model || ''),
            meta: leg.deal.town + ' · ' + miles + ' mi'
          });
          renderLog();
        }

        legIdx++;

        // Gas stop opportunity: station here, fuel low, more legs to go
        var stn = stations[leg.to];
        if (stn && state.fuel < CAPACITY * 0.5 && legIdx < legs.length) {
          pausedTrip = runLeg;
          openFuel(stn);
          mountMap();
          return;
        }

        mountMap();
        setTimeout(runLeg, 1200);
      }

      runLeg();
    }

    function finishTrip(pickedUp, towed) {
      state.driving = false;
      state.tripStops = [];
      state.currentTown = HOME;

      var ribbon = rootEl.querySelector('#travel-travelRibbon');
      if (ribbon) ribbon.classList.remove('active');

      if (towed) {
        State.cash = Math.max(0, State.cash - towed.fee);
        state.logs.unshift({ title: 'Ran dry near ' + towed.from + ' — towed home', meta: 'Tow fee: $' + towed.fee });
      }

      // Bikes enter the garage
      pickedUp.forEach(function(deal){
        var bike = deal.bike;
        bike.bornCond = bike.condition || null;
        bike.missingParts = Object.keys(bike.partStates || {}).filter(function(k){ return bike.partStates[k] === "missing"; });
        State.garage.push(bike);
      });

      if (typeof Save !== "undefined") Save.save();
      renderHUD();
      renderLog();
      renderTripPanel();
      mountMap();
      if (typeof UI !== "undefined" && UI.refreshCash) UI.refreshCash();
    }

    function clearTrip() {
      state.tripStops = [];
      renderTripPanel();
      mountMap();
    }

    // --- Wire up ---

    document.getElementById('travel-fuelSlider').addEventListener('input', updateFillReadout);
    document.getElementById('travel-cancelFuel').addEventListener('click', closeFuel);
    document.getElementById('travel-buyFuel').addEventListener('click', buyFuel);
    document.getElementById('travel-fuelModal').addEventListener('click', function(e){ if (e.target === this) closeFuel(); });
    var goBtn = document.getElementById('travel-tripGo');
    if (goBtn) goBtn.addEventListener('click', executeTrip);
    var clearBtn = document.getElementById('travel-tripClear');
    if (clearBtn) clearBtn.addEventListener('click', clearTrip);

    // Initial render
    renderHUD();
    renderLog();
    renderTripPanel();
    mountMap();

    return {
      rootEl: rootEl,
      getState: function () { return { fuel: state.fuel, wallet: 0 }; },
      destroy: function () { rootEl.innerHTML = ''; }
    };
  }

  function getState() { return current && current.getState ? current.getState() : null; }
  return { HTML: HTML, init: init, destroy: destroy, getState: getState };
})();
