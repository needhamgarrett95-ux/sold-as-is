/* Travel map app — extracted from the travel-map prototype and refactored
   for game integration. Not auto-run: call TravelMap.init(rootEl, opts).
   Requires travel-lib.js (MapHelpers) and travel.css (#travel-root) loaded.
*/
window.TravelMap = (function () {
  'use strict';

  var HTML =
    `
      <main class="app-shell">
        <section class="hud" aria-label="Travel status">
          <div class="hud-block">
            <div class="eyebrow">Truck parked at</div>
            <div class="location-name" id="travel-locationName">Port Angeles, WA</div>
            <div class="location-sub" id="travel-locationSub">Home garage · keys on the hook</div>
          </div>
          <div class="hud-block">
            <div class="eyebrow">Gas tank · 16 mpg</div>
            <div class="fuel-row">
              <svg class="fuel-icon" viewBox="0 0 28 34" aria-hidden="true"><path d="M3 2h15v29H3zM6 5h9v8H6zM18 7h4l3 4v13c0 4-6 4-6 0v-7h3v7c0 1 1 1 1 0V12l-3-3h-2" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter"/></svg>
              <div class="fuel-stack"><div class="fuel-number"><span id="travel-fuelValue">15.0</span> / 15 gal</div><div class="fuel-bar" aria-label="Fuel level"><div id="travel-fuelFill" class="fuel-fill"></div></div></div>
            </div>
          </div>
          <div class="hud-block">
            <div class="eyebrow">Wallet</div>
            <div class="money" id="travel-walletValue">$140.00</div>
            <div class="location-sub">Fuel comes out of the flip money.</div>
          </div>
        </section>
    
        <section class="content-grid">
          <div class="left-stack">
            <div class="layer-bar" aria-label="Map layers">
              <div class="layer-chips">
                <button class="layer-chip active" id="travel-sellerLayerBtn" type="button" aria-pressed="true"><span class="chip-dollar" aria-hidden="true">$</span>Sellers</button>
                <button class="layer-chip" id="travel-gasLayerBtn" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10v18H5zM7 6h6v5H7zm8 1 3 3v8c0 2 3 2 3 0v-6h-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Gas</button>
                <button class="collapse-chip" id="travel-collapseClusterBtn" type="button" hidden>Collapse cluster</button>
              </div>
              <div class="layer-hint" id="travel-layerHint">Tap a numbered pin to spread out nearby sellers.</div>
            </div>
            <div class="map-frame">
              <div class="map-head">
                <div class="map-key" aria-label="Map legend">
                  <span class="key-item"><span class="key-swatch home"></span>Home</span>
                  <span class="key-item"><span class="legend-dollar" aria-hidden="true">$</span>Seller</span>
                  <span class="key-item"><svg class="legend-pump" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10v18H5zM7 6h6v5H7zm8 1 3 3v8c0 2 3 2 3 0v-6h-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Fuel</span>
                </div>
                <div class="map-note">Fixed view · sellers and fuel are separate stops</div>
              </div>
              <div id="travel-map" aria-label="Interactive map of seller towns around the Olympic Peninsula"></div>
              <div class="map-shade"></div>
              <div id="travel-mapFallback" class="map-unavailable" hidden></div>
              <div id="travel-travelRibbon" class="travel-ribbon" aria-live="polite">
                <div class="travel-copy" id="travel-travelCopy">Rolling out…</div><div class="ribbon-road"></div>
                <div class="truck" aria-hidden="true"><span class="truck-body"></span><span class="truck-cab"></span><span class="truck-wheel a"></span><span class="truck-wheel b"></span></div>
              </div>
            </div>
            <div class="balance-card" aria-label="Trip balance examples">
              <div class="balance-item"><small>Short hop</small><strong>Sequim · 34 mi RT</strong></div>
              <div class="balance-item"><small>Mid run</small><strong>Forks · 110 mi RT</strong></div>
              <div class="balance-item"><small>Long haul</small><strong>Neah Bay · 144 mi RT</strong></div>
              <div class="balance-item"><small>Max run</small><strong>Tacoma · 224 mi RT</strong></div>
            </div>
          </div>
    
          <aside class="right-stack">
            <section class="route-panel" aria-labelledby="routeTitle">
              <h2 class="section-title" id="travel-routeTitle">Choose a stop</h2>
              <div id="travel-townCard"></div>
            </section>
            <section class="log-panel" aria-labelledby="logTitle">
              <div class="log-head"><h2 class="section-title" id="travel-logTitle">Recent drives</h2><button class="tiny-btn" id="travel-resetBtn" type="button">Start over</button></div>
              <div class="log-list" id="travel-logList"><div class="log-empty">No road stories yet. Tap a pin, check the gas, and go see whether “ran when parked” means anything.</div></div>
            </section>
          </aside>
        </section>
    
        <footer class="footline">
          <span class="brand-line">Sold as-is. No warranties, no take-backs.</span>
          <span>15-gallon tank · 16 mpg · fixed game mileage and fuel prices.</span>
        </footer>
      </main>
    
      <div class="modal-backdrop" id="travel-fuelModal" role="dialog" aria-modal="true" aria-labelledby="fuelModalTitle">
        <div class="fuel-modal">
          <div class="eyebrow" id="travel-fuelStationName">Fuel stop</div>
          <h2 class="modal-title" id="travel-fuelModalTitle">Top off the truck</h2>
          <div class="range-wrap">
            <input id="travel-fuelSlider" type="range" min="0" max="0" step="0.1" value="0" aria-label="Gallons to purchase" />
            <div class="fill-readout"><div><div class="eyebrow">Add</div><div class="fill-gallons"><span id="travel-fillGallons">0.0</span> gal</div></div><div><div class="eyebrow">Total</div><div class="fill-cost" id="travel-fillCost">$0.00</div></div></div>
          </div>
          <div class="modal-actions"><button class="btn ghost" id="travel-cancelFuel" type="button">Not now</button><button class="btn gold" id="travel-buyFuel" type="button">Pay &amp; pump</button></div>
        </div>
      </div>
    
      
      
      
      </main>`;

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
    var HOME = 'Port Angeles';
    var CAPACITY = 15;
    var MPG = 16;
    var towns = [
      ['Port Angeles',0,48.11892,-123.43112],['Agnew',8,48.10524,-123.24794],['Carlsborg',12,48.0897,-123.17287],['Joyce',15,48.13635,-123.73438],['Sequim',17,48.07965,-123.10367],['Blyn',20,48.02157,-123.00063],['Diamond Point',25,48.08489,-122.95169],['Chimacum',28,48.01182,-122.77328],['Port Hadlock',30,48.02571,-122.75858],['Gardiner',32,48.05021,-122.9254],['Port Townsend',35,48.1212,-122.77263],['Nordland',36,48.05105,-122.69107],['Beaver',40,48.05431,-124.33152],['Marrowstone',41,48.07226,-122.70206],['Sappho',45,48.06878,-124.2919],['Quilcene',46,47.82642,-122.8775],['Clallam Bay',50,48.25379,-124.26015],['Forks',55,47.95014,-124.38543],['Brinnon',57,47.69838,-122.89646],['Sekiu',62,48.25978,-124.30041],['Poulsbo',63,47.73689,-122.64681],['Silverdale',66,47.65171,-122.69275],['La Push',70,47.9082,-124.63663],['Neah Bay',72,48.36786,-124.62755],['Bremerton',75,47.565,-122.62749],['Hoodsport',78,47.40639,-123.14135],['Port Orchard',82,47.54103,-122.63847],['Shelton',90,47.21253,-123.10616],['Olympia',108,47.03954,-122.89165],['Tacoma',112,47.25517,-122.44164]
    ].map(function(t){ return {name:t[0], miles:t[1], lat:t[2], lng:t[3], label:t[0]+', WA', locality:t[0], region:'WA'}; });
    var stations = {
      'Port Angeles':{name:'Strait View Fuel',price:4.20,lat:48.11892,lng:-123.43112},
      'Sequim':{name:'Rainshadow Fuel',price:4.15,lat:48.07965,lng:-123.10367},
      'Beaver':{name:'Beaver Junction',price:4.45,lat:48.05431,lng:-124.33152},
      'Forks':{name:'Forks Fuel & Timber',price:4.65,lat:47.95014,lng:-124.38543},
      'Neah Bay':{name:'Makah Bay Trading Post',price:4.95,lat:48.36786,lng:-124.62755},
      'Clallam Bay':{name:'Strait Side Gas',price:4.70,lat:48.25379,lng:-124.26015},
      'Port Townsend':{name:'Victorian Petrol',price:4.25,lat:48.1212,lng:-122.77263},
      'Quilcene':{name:'Quilcene Quick Stop',price:4.40,lat:47.82642,lng:-122.8775},
      'Hoodsport':{name:'Canal-side Gas',price:4.55,lat:47.40639,lng:-123.14135},
      'Shelton':{name:'Shelton Speedway',price:4.10,lat:47.21253,lng:-123.10616},
      'Olympia':{name:'Capital Fill-Up',price:4.05,lat:47.03954,lng:-122.89165},
      'Bremerton':{name:'Shipyard Fuel',price:4.20,lat:47.565,lng:-122.62749},
      'Poulsbo':{name:'Viking Pump',price:4.30,lat:47.73689,lng:-122.64681}
    };
    var byName = {}; towns.forEach(function(t){ byName[t.name]=t; });
    var routeNames = {
      'Port Angeles':['Port Angeles'],
      'Agnew':['Port Angeles','Agnew'], 'Carlsborg':['Port Angeles','Agnew','Carlsborg'], 'Sequim':['Port Angeles','Agnew','Carlsborg','Sequim'],
      'Blyn':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn'], 'Gardiner':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner'],
      'Diamond Point':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Diamond Point'],
      'Chimacum':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Chimacum'],
      'Port Hadlock':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Chimacum','Port Hadlock'],
      'Port Townsend':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Chimacum','Port Hadlock','Port Townsend'],
      'Nordland':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Chimacum','Port Hadlock','Nordland'],
      'Marrowstone':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Chimacum','Port Hadlock','Marrowstone'],
      'Quilcene':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene'],
      'Brinnon':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Brinnon'],
      'Hoodsport':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Brinnon','Hoodsport'],
      'Shelton':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Brinnon','Hoodsport','Shelton'],
      'Olympia':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Brinnon','Hoodsport','Shelton','Olympia'],
      'Tacoma':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Brinnon','Hoodsport','Shelton','Olympia','Tacoma'],
      'Poulsbo':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Poulsbo'],
      'Silverdale':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Poulsbo','Silverdale'],
      'Bremerton':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Poulsbo','Silverdale','Bremerton'],
      'Port Orchard':['Port Angeles','Agnew','Carlsborg','Sequim','Blyn','Gardiner','Quilcene','Poulsbo','Silverdale','Bremerton','Port Orchard'],
      'Joyce':['Port Angeles','Joyce'], 'Beaver':['Port Angeles','Joyce','Beaver'], 'Sappho':['Port Angeles','Joyce','Beaver','Sappho'],
      'Forks':['Port Angeles','Joyce','Beaver','Sappho','Forks'], 'La Push':['Port Angeles','Joyce','Beaver','Sappho','Forks','La Push'],
      'Clallam Bay':['Port Angeles','Joyce','Clallam Bay'], 'Sekiu':['Port Angeles','Joyce','Clallam Bay','Sekiu'], 'Neah Bay':['Port Angeles','Joyce','Clallam Bay','Sekiu','Neah Bay']
    };

    var destinations = [{id:'home',kind:'home',town:HOME,name:'Port Angeles home garage',lat:byName[HOME].lat,lng:byName[HOME].lng}];
    (opts.listings||[]).forEach(function(l){
          var t=byName[l.town];
          if(!t) return;
          destinations.push({id:'listing:'+l.id,kind:'seller',town:l.town,name:l.bike||(l.town+' seller'),lat:t.lat,lng:t.lng,price:l.price,seller:l.seller,listingId:l.id});
        });
    Object.keys(stations).forEach(function(town){
      var station=stations[town];
      destinations.push({id:'gas:'+town,kind:'gas',town:town,name:station.name,lat:station.lat,lng:station.lng,price:station.price});
    });
    var byId={}; destinations.forEach(function(d){byId[d.id]=d;});

    var firstListing=(opts.listings||[])[0];
        var initFuel=(opts.fuel!=null?opts.fuel:3), initWallet=(opts.wallet!=null?opts.wallet:140);
        var initSelectedId=firstListing?('listing:'+firstListing.id):'home';
        var state={fuel:initFuel,wallet:initWallet,currentId:'home',selectedId:initSelectedId,lastPrice:4.15,driving:false,logs:[]};
    var mapHandle=null;
    var selectedIndex=destinations.findIndex(function(d){return d.id===state.selectedId;});
    var resizeTimer=null;

    function money(v){return '$'+v.toFixed(2);}
    function gallonsFor(miles){return miles/MPG;}
    function routeForTown(name){return routeNames[name]||[HOME,name];}
    function townPath(fromTown,toTown){
      if(fromTown===toTown) return [fromTown];
      var a=routeForTown(fromTown),b=routeForTown(toTown),i=0;
      while(i<a.length&&i<b.length&&a[i]===b[i]) i++;
      var common=Math.max(0,i-1);
      return a.slice(common).reverse().concat(b.slice(common+1));
    }
    function milesBetween(a,b){
      if(a.id===b.id) return 0;
      if(a.town===b.town) return 1;
      var pa=routeForTown(a.town),pb=routeForTown(b.town),i=0;
      while(i<pa.length&&i<pb.length&&pa[i]===pb[i]) i++;
      var common=pa[Math.max(0,i-1)]||HOME;
      return Math.max(1,byName[a.town].miles+byName[b.town].miles-(2*byName[common].miles));
    }
    function milesHomeFrom(d){return d.kind==='home'?0:byName[d.town].miles+(d.kind==='gas'?1:0);}

    function project(lat,lng,zoom){
      var size=256*Math.pow(2,zoom),sin=Math.sin(lat*Math.PI/180);
      return {x:(lng+180)/360*size,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size};
    }
    function unproject(x,y,zoom){
      var size=256*Math.pow(2,zoom),n=Math.PI-2*Math.PI*y/size;
      return {lng:x/size*360-180,lat:180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)))};
    }
    var showSellers=true;
    var showGas=false;
    var expandedClusterId=null;
    var CLUSTER_RADIUS=31;
    var MIN_PIN_SEPARATION=24;
    function distance(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}
    function inlandAngle(d){
      /* Screen-space degrees: 0 east, 90 south. Every coastal nudge points inland. */
      if(d.lat>48.16) return 90;
      if(d.lng<-124.08) return 0;
      if(d.lat>48.0&&d.lng>-123.55) return 90;
      if(d.lng>-122.98) return 180;
      if(d.lat<47.52) return 270;
      if(d.lat<47.90&&d.lng>-123.2) return 180;
      return 90;
    }
    function candidateOffsets(d,forceSpread){
      var out=forceSpread?[]:[[0,0]],preferred=inlandAngle(d),angles=[0,24,-24,48,-48,76,-76,105,-105,138,-138,180];
      [24,32,42,54,68,82].forEach(function(r){
        angles.forEach(function(delta){
          var rad=(preferred+delta)*Math.PI/180;
          out.push([Math.cos(rad)*r,Math.sin(rad)*r]);
        });
      });
      return out;
    }
    function medoid(items,zoom){
      var projected=items.map(function(item){return {item:item,point:project(item.lat,item.lng,zoom)};});
      var best=projected[0],bestScore=Infinity;
      projected.forEach(function(candidate){
        var score=0; projected.forEach(function(other){score+=distance(candidate.point,other.point);});
        if(score<bestScore){best=candidate;bestScore=score;}
      });
      return best.item;
    }
    function sellerGroups(zoom){
      var pending=destinations.filter(function(d){return d.kind==='seller';}).map(function(d){return {destination:d,point:project(d.lat,d.lng,zoom)};});
      var groups=[];
      while(pending.length){
        var seed=pending.shift(),members=[seed],rest=[];
        pending.forEach(function(candidate){
          if(distance(seed.point,candidate.point)<CLUSTER_RADIUS) members.push(candidate); else rest.push(candidate);
        });
        pending=rest;
        groups.push(members.map(function(member){return member.destination;}));
      }
      return groups;
    }
    function displayItem(d,extra){
      var item={id:d.id,kind:d.kind,town:d.town,name:d.name,price:d.price,lat:d.lat,lng:d.lng,trueLat:d.lat,trueLng:d.lng,markerDx:0,markerDy:0,label:d.name,locality:d.town,region:'WA',destinationId:d.id,destinationIndex:destinations.findIndex(function(x){return x.id===d.id;})};
      if(extra) Object.keys(extra).forEach(function(key){item[key]=extra[key];});
      return item;
    }
    function selectDestination(index){
      if(state.driving||index<0) return;
      selectedIndex=index;
      state.selectedId=destinations[index].id;
      renderCard();
      mountMap();
    }
    function updateLayerControls(expandedCount){
      var sellers=document.getElementById('travel-sellerLayerBtn'),gas=document.getElementById('travel-gasLayerBtn'),collapse=document.getElementById('travel-collapseClusterBtn'),hint=document.getElementById('travel-layerHint');
      sellers.classList.toggle('active',showSellers); sellers.setAttribute('aria-pressed',showSellers?'true':'false');
      gas.classList.toggle('active',showGas); gas.setAttribute('aria-pressed',showGas?'true':'false');
      collapse.hidden=!expandedClusterId;
      if(expandedClusterId) hint.textContent=(expandedCount||'Nearby')+' seller pins spread apart. Tap one to choose it.';
      else if(showSellers&&showGas) hint.textContent='Both layers shown. Numbered seller pins keep dense areas clean.';
      else if(showSellers) hint.textContent='Tap a numbered pin to spread out nearby sellers.';
      else hint.textContent='Gas stops only · each stop is a separate destination.';
    }
    function toggleLayer(kind){
      if(kind==='seller'){
        if(showSellers&&!showGas) return;
        showSellers=!showSellers;
        if(!showSellers){expandedClusterId=null;if(byId[state.selectedId].kind==='seller') state.selectedId='gas:Port Angeles';}
      }else{
        if(showGas&&!showSellers) return;
        showGas=!showGas;
        if(!showGas&&byId[state.selectedId].kind==='gas') state.selectedId='seller:Tacoma';
      }
      selectedIndex=destinations.findIndex(function(d){return d.id===state.selectedId;});
      updateLayerControls(); renderCard(); mountMap();
    }
    function collapseCluster(){expandedClusterId=null;updateLayerControls();mountMap();}
    function tripMath(destination){
      var current=byId[state.currentId];
      var miles=milesBetween(current,destination);
      var driveFuel=gallonsFor(miles);
      var homeFuel=gallonsFor(milesHomeFrom(destination));
      var fullNeed=driveFuel+homeFuel;
      var tankAfter=state.fuel-driveFuel;
      var coversLeg=state.fuel+1e-6>=driveFuel;
      var coversHome=state.fuel+1e-6>=fullNeed;
      var reason,status;
      if(destination.id===current.id){reason='The truck is already here.';status='safe';}
      else if(coversHome){reason='Tank covers this drive and the trip home, with '+(state.fuel-fullNeed).toFixed(1)+' gal in reserve.';status='safe';}
      else if(coversLeg){reason='You can reach this stop, but you are '+(fullNeed-state.fuel).toFixed(1)+' gal short of getting home. Driving stays your call.';status='warn';}
      else{reason='Tank is '+(driveFuel-state.fuel).toFixed(1)+' gal short for this leg. The map will warn you, not stop you.';status='danger';}
      return {miles:miles,driveFuel:driveFuel,homeFuel:homeFuel,fullNeed:fullNeed,tankAfter:tankAfter,coversLeg:coversLeg,coversHome:coversHome,reason:reason,status:status};
    }
    function destinationTitle(d){return d.kind==='gas'?d.name:d.kind==='home'?'Port Angeles home garage':(d.name||d.town+' seller');}
    function renderCard(){
      var d=byId[state.selectedId],math=tripMath(d),atDestination=state.currentId===d.id;
      var arrival=math.tankAfter>=0?math.tankAfter.toFixed(1)+' gal':(Math.abs(math.tankAfter).toFixed(1)+' gal short');
      var eyebrow=d.kind==='gas'?'Fuel stop · '+d.town+', WA':d.kind==='seller'?'Seller meetup · '+d.town+', WA':'Home base';
      var listingHTML=d.kind==='seller'?'<div class="station-strip"><div class="station-title">'+(d.bike||d.name)+'</div><div class="station-price">'+money(d.price)+'</div><div class="location-sub">'+(d.seller?('Seller: '+d.seller):'')+'</div></div>':'';
      var stationHTML=d.kind==='gas'?'<div class="station-strip"><div class="station-title">'+d.name+'</div><div class="station-price">'+money(d.price)+' / gal</div><div class="location-sub">'+(atDestination?'Pump is ready.':'Drive here independently from the seller pin.')+'</div></div>':'';
      var fuelButton=d.kind==='gas'&&atDestination?'<button class="btn gold" type="button" id="travel-fuelBtn">Buy gas</button>':'';
      var driveLabel=!math.coversLeg?'Drive anyway':'Drive to '+(d.kind==='gas'?d.name:d.kind==='home'?'home':d.town);
      document.getElementById('travel-routeTitle').textContent='Trip details';
      document.getElementById('travel-townCard').innerHTML='<article class="town-card"><div class="town-card-head"><div><div class="eyebrow">'+eyebrow+'</div><div class="town-name">'+destinationTitle(d)+'</div></div><div class="town-tag">'+math.miles+' mi</div></div><div class="trip-summary"><div class="summary-row"><span>Drive from here</span><strong>'+math.miles+' mi · '+math.driveFuel.toFixed(1)+' gal</strong></div><div class="summary-row"><span>Tank now</span><strong>'+state.fuel.toFixed(1)+' gal</strong></div><div class="summary-row"><span>Tank on arrival</span><strong>'+arrival+'</strong></div><div class="summary-row"><span>Fuel needed from there to home</span><strong>'+math.homeFuel.toFixed(1)+' gal</strong></div><div class="summary-row"><span>Whole plan</span><strong>'+math.fullNeed.toFixed(1)+' gal</strong></div></div>'+stationHTML+listingHTML+'<div class="trip-status '+math.status+'">'+math.reason+'</div><div class="actions"><button class="btn primary" type="button" id="travel-driveBtn" '+(atDestination||state.driving?'disabled':'')+'>'+driveLabel+'</button>'+fuelButton+'</div></article>';
      var driveBtn=document.getElementById('travel-driveBtn'); if(driveBtn) driveBtn.addEventListener('click',drive);
      var fuelBtn=document.getElementById('travel-fuelBtn'); if(fuelBtn) fuelBtn.addEventListener('click',openFuel);
    }
    function drive(){
      if(state.driving||state.currentId===state.selectedId) return;
      var from=byId[state.currentId],to=byId[state.selectedId];
      var miles=milesBetween(from,to),used=gallonsFor(miles),shortfall=Math.max(0,used-state.fuel);
      state.driving=true;
      var ribbon=document.getElementById('travel-travelRibbon');
      document.getElementById('travel-travelCopy').textContent='Rolling '+miles+' miles · '+from.town+' → '+to.town;
      ribbon.classList.add('active');
      setTimeout(function(){
        state.fuel=Math.max(0,state.fuel-used);
        state.currentId=to.id;
        state.driving=false;
        state.logs.unshift({type:'trip',title:destinationTitle(to),meta:miles+' mi · '+used.toFixed(1)+' gal'+(shortfall>0?' · '+shortfall.toFixed(1)+' gal short':''),cost:'~'+money(used*state.lastPrice)});
        ribbon.classList.remove('active');
        renderAll();
        mountMap();
      },2250);
    }
    function currentStation(){var d=byId[state.currentId]; return d.kind==='gas'?d:null;}
    function openFuel(){
      var station=currentStation(); if(!station) return;
      var max=Math.max(0,Math.min(CAPACITY-state.fuel,state.wallet/station.price));
      var slider=document.getElementById('travel-fuelSlider');
      slider.max=max.toFixed(1); slider.value=max.toFixed(1);
      document.getElementById('travel-fuelStationName').textContent=station.name+' · '+money(station.price)+'/gal';
      updateFillReadout(); document.getElementById('travel-fuelModal').classList.add('open');
    }
    function updateFillReadout(){
      var gallons=+document.getElementById('travel-fuelSlider').value;
      var station=currentStation(),cost=station?gallons*station.price:0;
      document.getElementById('travel-fillGallons').textContent=gallons.toFixed(1);
      document.getElementById('travel-fillCost').textContent=money(cost);
      document.getElementById('travel-buyFuel').disabled=gallons<=0||cost>state.wallet+1e-6;
    }
    function buyFuel(){
      var station=currentStation(); if(!station) return;
      var gallons=+document.getElementById('travel-fuelSlider').value,cost=gallons*station.price;
      if(gallons<=0||cost>state.wallet+1e-6) return;
      state.fuel=Math.min(CAPACITY,state.fuel+gallons); state.wallet-=cost; state.lastPrice=station.price;
      state.logs.unshift({type:'fuel',title:station.name,meta:gallons.toFixed(1)+' gal @ '+money(station.price),cost:'-'+money(cost)});
      closeFuel(); renderAll();
    }
    function closeFuel(){document.getElementById('travel-fuelModal').classList.remove('open');}
    function renderHUD(){
      var current=byId[state.currentId];
      document.getElementById('travel-locationName').textContent=current.kind==='gas'?current.name:current.town+', WA';
      document.getElementById('travel-locationSub').textContent=current.kind==='home'?'Home garage · keys on the hook':current.kind==='gas'?'Fuel stop · '+current.town+', WA':'Seller meetup · choose any next stop';
      document.getElementById('travel-fuelValue').textContent=state.fuel.toFixed(1);
      var fill=document.getElementById('travel-fuelFill'); fill.style.width=(state.fuel/CAPACITY*100)+'%'; fill.classList.toggle('low',state.fuel<4);
      document.getElementById('travel-walletValue').textContent=money(state.wallet);
    }
    function renderLog(){
      var box=document.getElementById('travel-logList');
      if(!state.logs.length){box.innerHTML='<div class="log-empty">No road stories yet. Tap a seller or fuel pin, check the math, and make the call.</div>';return;}
      box.innerHTML=state.logs.slice(0,6).map(function(l){return '<div class="log-item"><div class="log-icon">'+(l.type==='fuel'?'GAS':'TRIP')+'</div><div class="log-main"><strong>'+l.title+'</strong><div class="log-meta">'+l.meta+'</div></div><div class="log-cost">'+l.cost+'</div></div>';}).join('');
    }
    function renderAll(){renderHUD();renderCard();renderLog();}
    function reset(){
      state={fuel:initFuel,wallet:initWallet,currentId:'home',selectedId:initSelectedId,lastPrice:4.15,driving:false,logs:[]};
      expandedClusterId=null;
      selectedIndex=destinations.findIndex(function(d){return d.id===state.selectedId;});
      updateLayerControls();renderAll();mountMap();
    }
    document.getElementById('travel-sellerLayerBtn').addEventListener('click',function(){toggleLayer('seller');});
    document.getElementById('travel-gasLayerBtn').addEventListener('click',function(){toggleLayer('gas');});
    document.getElementById('travel-collapseClusterBtn').addEventListener('click',collapseCluster);
    document.getElementById('travel-fuelSlider').addEventListener('input',updateFillReadout);
    document.getElementById('travel-cancelFuel').addEventListener('click',closeFuel);
    document.getElementById('travel-buyFuel').addEventListener('click',buyFuel);
    document.getElementById('travel-fuelModal').addEventListener('click',function(e){if(e.target===this) closeFuel();});
    document.getElementById('travel-resetBtn').addEventListener('click',reset);
    function onKeyDown(e){if(e.key==='Escape') closeFuel();}
        document.addEventListener('keydown',onKeyDown);
    function onResize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){expandedClusterId=null;updateLayerControls();mountMap();},180);}
        window.addEventListener('resize',onResize);
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
      "Port Angeles": [38.0, 22.8],
      "Port Hadlock": [66.8, 26.9],
      "Port Orchard": [75.2, 68.7],
      "Port Townsend": [64.2, 22.3],
      "Poulsbo": [75.0, 52.4],
      "Quilcene": [67.2, 48.3],
      "Sappho": [23.5, 29.7],
      "Sekiu": [15.0, 17.9],
      "Sequim": [51.0, 23.5],
      "Shelton": [60.0, 82.8],
      "Silverdale": [74.5, 57.9],
      "Tacoma": [73.0, 89.7]
    };
    function mountMap(){
      var el = rootEl.querySelector('#travel-map');
      if (!el) return;
      // Build the static map with pin overlays
      var townsWithListings = {};
      destinations.forEach(function(d){
        if (d.kind === 'seller') townsWithListings[d.town] = true;
      });
      var html = '<div class="static-map"><img src="img/olympic-map.png" alt="Hand-drawn map of the Olympic Peninsula" draggable="false">';
      // Seller pins (only towns with listings)
      Object.keys(townsWithListings).forEach(function(town){
        var pos = PIN_POS[town];
        if (!pos) return;
        var isSel = byId[state.selectedId] && byId[state.selectedId].town === town && byId[state.selectedId].kind === 'seller';
        html += '<button class="map-pin seller' + (isSel ? ' selected' : '') + '" data-town="' + town.replace(/"/g,'') + '" style="left:' + pos[0] + '%;top:' + pos[1] + '%" aria-label="' + town + ' listings"><span class="pin-dot"></span></button>';
      });
      // Home pin (always)
      var homePos = PIN_POS[HOME];
      if (homePos) {
        var isHomeSel = state.selectedId === 'home';
        html += '<button class="map-pin home' + (isHomeSel ? ' selected' : '') + '" data-town="__home__" style="left:' + homePos[0] + '%;top:' + homePos[1] + '%" aria-label="Home garage"><span class="pin-dot"></span></button>';
      }
      // Gas pins (if layer on)
      if (showGas) {
        Object.keys(stations).forEach(function(town){
          var pos = PIN_POS[town];
          if (!pos) return;
          var isSel = state.selectedId === 'gas:' + town;
          // Offset gas pins slightly so they don't cover seller pins
          html += '<button class="map-pin gas' + (isSel ? ' selected' : '') + '" data-gas="' + town.replace(/"/g,'') + '" style="left:' + (pos[0]+1.2) + '%;top:' + (pos[1]+1.8) + '%" aria-label="' + stations[town].name + '"><span class="pin-pump">G</span></button>';
        });
      }
      html += '</div>';
      el.innerHTML = html;
      // Wire clicks
      el.querySelectorAll('.map-pin.seller').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.driving) return;
          var town = btn.getAttribute('data-town');
          var idx = destinations.findIndex(function(d){ return d.kind === 'seller' && d.town === town; });
          if (idx >= 0) selectDestination(idx);
        });
      });
      var homeBtn = el.querySelector('.map-pin.home');
      if (homeBtn) homeBtn.addEventListener('click', function(){
        if (state.driving) return;
        var idx = destinations.findIndex(function(d){ return d.id === 'home'; });
        if (idx >= 0) selectDestination(idx);
      });
      el.querySelectorAll('.map-pin.gas').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.driving) return;
          var town = btn.getAttribute('data-gas');
          var idx = destinations.findIndex(function(d){ return d.id === 'gas:' + town; });
          if (idx >= 0) selectDestination(idx);
        });
      });
      // Hide the fallback
      var fb = rootEl.querySelector('#travel-mapFallback');
      if (fb) fb.hidden = true;
    }

    updateLayerControls();renderAll();mountMap();

    return {
      rootEl: rootEl,
      getState: function () { return { fuel: state.fuel, wallet: state.wallet }; },
      destroy: function () {
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', onResize);
        rootEl.innerHTML = '';
      }
    };
  }

  function getState() { return current && current.getState ? current.getState() : null; }
  return { HTML: HTML, init: init, destroy: destroy, getState: getState };
})();
