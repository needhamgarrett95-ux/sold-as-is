# Travel Mechanics (locked 2026-10-15)

## Listings & Pins
- Marketplace refreshes with 16 listings. Travel map shows 16 red pins, 1:1.
- Striking a deal (haggle or BIN) commits cash immediately, pulls listing from marketplace. Pin turns green.
- Green pins = struck deals. Survive marketplace refreshes. Clear only on pickup.
- Green pins stack unlimited. Truck hauls 3 max per trip; player picks which 3.
- Same-town listings: separate pins, fanned out (not count badges).

## Deals & Cash
- Warn at deal time if it leaves player without fuel money (no hard floor).
- Port Angeles (home) deals: straight to garage, no travel, no cost.
- Marketplace browsing/deals are home-only. Nothing mid-trip.
- Struck listings leave marketplace pool immediately; backfill to 16.

## Trips
- Start and end at Port Angeles (home).
- Player picks green pins in the order they want to drive (no auto-optimize).
- Fuel math shown upfront for the full route.
- Gas stops allowed mid-trip, worked into fuel math.
- At each green pin, bike loads. Drive home -> garage.
- Travel pickup + return is the ONLY way a bike reaches the garage.
- Boneyard parts ship normally; travel is bikes only.
- Garage has no capacity limit.
- Pause the 3:30 marketplace refresh timer during trips.

## Fuel
- Flat $2.50/gal at every station (no price variation).
- 12 MPG consumption. 15-gal tank = 180 mile range.
- 12 yellow gas pin stations (not as many as the 30 towns, but enough for logical routes).
- Fuel consumed leg-by-leg (not upfront).
- Run dry: tow fee scaled by distance from home. Bikes still come home, deal never lost.

## Map
- Hand-drawn PNG base (olympic-map-cropped-tight.png, 1040x1120).
- 30 town pins at Garrett-reviewed positions (see /tmp/pin-positions.json).
- PC only. Never push to webapp.
