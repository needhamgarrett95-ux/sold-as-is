# Interior Visual Pass — Comparison Brief

**Date:** 2026-10-14 · **Status:** BRIEF ONLY. No game files edited, no deploy.
**Design reference:** `~/workspace/ts-spaces/phone-home-screen/index.html` (the phone expansion demo — 6 interior screens: Marketplace, Boneyard, Garage, Collection, Crate Fresh, Settings).
**Live reference:** aud213 at `~/workspace/sold-as-is/public/`, screenshotted at 390×844 in `~/workspace/.gametest/interior-brief/` (live `01–13`, demo `demo-*`).
**Scope rule:** presentation layer only. Every behavior, tap target, and interaction stays exactly as-is.

## The single biggest finding

**The demo's theme IS the live game's dark mode.** The demo's root tokens (`--paper:#1a1d22 --card:#242930 --line:#3a4048 --ink:#ece9e1 --dim:#9aa0a8`) are byte-identical to live's `body.dark-mode` tokens in `css/style.css`. The "seam" Garrett sees is **not** a theme problem — it's a *component language* problem. The live views use the same tokens but different components (segmented buttons where the demo uses chips, underline navs where the demo uses pill chips, inconsistent card treatments).

Implication: the pass does not need to invent a new look. It needs to bring the live components in line with the demo's component language, in **both** themes. Dark mode (screenshot `13`) already proves the tokens carry over.

---

## Global tokens to introduce (so the pass stays consistent)

These are distilled from the demo's CSS and should become the shared vocabulary. Most already exist as live vars; the pass standardizes their *use*.

| Token | Demo value | Notes |
|---|---|---|
| `--radius-card` | `12px` | All content cards (featured, bike-hero, coll-summary, set-row, profile-card, set-list) |
| `--radius-btn` | `9–11px` | Buttons, filter bars, back-home |
| `--radius-pill` | `20px` | Chips, cond-pills, badges |
| `--hairline` | `1px solid var(--line)` | Card borders, row dividers. **No drop shadows anywhere in the demo.** |
| `--gutter` | `12px` page margins | Demo uses `margin:12px 12px 0` / `padding:13px 14px` consistently |
| `--type-h2` | `1.32rem / 800 / var(--ink)` | Section titles (`.pane-head h2`) |
| `--type-sub` | `~0.9rem / var(--dim)` | Section subtitles |
| `--type-section-label` | small caps, letterspaced, `var(--dim)` | iOS-style group headers (GAME, DISPLAY, YOUR DATA) |
| App accents | market `--red:#e04536` · boneyard `--rust:#c96f1e` · crate `--gold:#febc2e` | Each app owns one accent; used for active chips, CTAs, badges |

**Component patterns to standardize:**
1. **Chip rows** — pill chips (`padding ~8px 14px`, `1px` hairline border), active = accent fill + white text. Demo: `.chip.on{background:var(--red);border-color:var(--red);color:#fff}`.
2. **Pane heads** — `h2` + dim `sub` line at the top of every content section. Live has these on some screens but not all.
3. **Cards** — `12px` radius, `1px` hairline, flat (no shadow). Live sometimes uses `8–10px` radii and shadows.
4. **Part/listing rows** — horizontal: thumb left (`88px`, `10px` radius, hairline), info right, `1px` hairline dividers between rows, full-width accent CTA button (`9px` radius, `700` weight).
5. **iOS settings groups** — rounded `14px` group card, rows with icon tile + label + chevron/switch, hairline dividers between rows, small-caps section labels above. Live settings already does this (closest match in the game).

---

## Screen-by-screen

### 1. Marketplace feed
- **Demo does:** Dark. `site-header` (card bg, `2px` bottom border, logo + "Search mopeds" box). `pane-head`: "Fresh listings" + sub. **Chip row** (`All bikes` active red, `Under $500`, `Runners`, `Near you`). Featured card (`12px` radius, hairline): photo with `Featured`/`Just listed`/`Price drop` tags top-left, `cond-pill` (white pill, dark text) bottom-right, body with `Name — $Price` + `View` link right. 2-col listing grid, same card treatment.
- **Live does today:** Light (dark exists). Same logo+search header. **Underline nav** (`All mopeds` / `Under $500` / `Runs & drives` / `Projects`, red underline on active) instead of chips. Two big segmented buttons (`Browse` filled red / `My Listings` outline). 2-col listing cards: `8px` photo radius, no hairline border, photo on cream, white `cond-pill`, `$Price · Name` + location below.
- **Deltas:** (1) filter control is underline-links + segmented buttons vs demo's chip row; (2) cards lack the hairline border; (3) no featured card; (4) no "Fresh listings" pane-head (live goes straight from filters to grid).
- **Recommendation: CHANGE.** Adopt the chip row (drop the Browse/My Listings segmented pair in favor of chips: `Browse`, `My Listings` as chips), add hairline borders to cards, add the `pane-head`. Keep the live photo treatment (real sprites beat the demo's gradient placeholders). **Judgment call:** whether to add a Featured card — it's demo-only chrome; I'd skip it unless Garrett wants it.

### 2. Listing detail (photo → title → seller → condition → actions)
- **Demo does:** No listing-detail screen exists in the demo.
- **Live does today:** `← Back` pill button, full-bleed photo, white card (`~14px` radius) with `$Price` + `Good` pill, title, location/time, description, seller card (avatar + handle + rating), Condition Report panel, 4-col part-condition grid.
- **Deltas:** None vs demo (no reference). Live is already card-based and clean.
- **Recommendation: KEEP.** Apply global card tokens (`12px` radius, hairline) for consistency; no structural change.

### 3. Garage › Bikes (list)
- **Demo does:** The demo's "Garage" screen is actually a *bike detail* (see §4). It has no bike-list screen.
- **Live does today:** `g-tab` bar: pill-ish buttons (`Bikes (2)` active = red fill, `Collection (1)`, `Parts (2)`, `Skills`), `pane-head` ("Pending Listings" + sub), sort dropdown, full-width bike cards (photo, price, name, Pending + green `+$500`).
- **Deltas:** The g-tab bar is close to demo chips but chunkier (`~10px` radius, icon+label, count badges). Cards are borderless; demo would give them hairlines.
- **Recommendation: CHANGE (light).** Restyle g-tabs as true demo chips (pill, `20px` radius, hairline, active = red fill), add hairline borders to bike cards. Keep the tab order, counts, and sort control exactly.

### 4. Bike detail (garage)
- **Demo does:** `bike-hero` card (`12px` radius, hairline): photo on sunset gradient, body row with name + sub left, `cond-tag` pill right. `pane-head` "Inspect Parts" + sub. **4-col parts grid**: cells with part icon, label, state (color-coded: Pristine green / Good amber / Shot red). `g-actions`: full-width stacked buttons (`List on Marketplace` red, `Strip Parts`, `Add to Collection`) with icon + label, `11px` radius.
- **Live does today:** `← Back`, photo card, name, bought-for/fair-value line, description box, then action buttons (need scroll to see all). Live buttons are smaller (`.g-actions button { padding:9px; border-radius:8px; font-size:.82rem }`) — noticeably less thumb-friendly than the demo's `15px` padding / `.97rem`.
- **Deltas:** (1) Live action buttons are small and sit low; demo's are full-width, tall, thumb-first. (2) Live part states shown as text list; demo's parts grid is more visual. (3) Live lacks the hero-card treatment (photo + name + cond pill in one card).
- **Recommendation: CHANGE.** Promote action buttons to the demo's full-width tall treatment (this also fixes the "finger-reachable" bar), wrap photo+name+condition in a `bike-hero` card, keep every action and its gating logic identical. The parts-grid-vs-list is a **judgment call** — live's list carries more info (repair states); I'd keep the list but style cells to the grid's visual language.

### 5. Garage › Collection (kept bikes)
- **Demo does:** No garage-collection tab in the demo (the demo's Collection app is the brand-set wall, §10).
- **Live does today:** Same card language as Bikes tab: "Your Collection" pane-head, kept-bike cards, single "Remove from Collection" action in detail.
- **Deltas:** None vs demo (no reference).
- **Recommendation: KEEP.** Inherits whatever card/tab tokens come out of §3. No independent change.

### 6. Garage › Parts (inventory)
- **Demo does:** No parts-inventory screen; the demo's "Inspect Parts" grid (§4) is the closest cousin.
- **Live does today:** "Parts Inventory" pane-head, `eby-item` rows: thumb left (`~10px` radius), name, condition + %, condition bar, `Repair — $X` / `Sell This Part` buttons (red, full-width-ish).
- **Deltas:** Live rows already match the demo's part-row pattern closely (thumb + info + full-width CTA). The `cond-bar` and NOS badge are live-only additions.
- **Recommendation: KEEP.** Minor: align thumb to `88px`/`10px` radius and ensure hairline dividers match the demo's `part-row`. No structural change.

### 7. Garage › Skills
- **Demo does:** No skills screen in the demo.
- **Live does today:** "Skills" pane-head, dark XP summary card (`0 XP`, progress bar, `0 skill points` in gold), skill cards (icon + name + description + 3 tier boxes).
- **Deltas:** None vs demo (no reference). Live's XP card already uses the demo's card language (rounded, flat).
- **Recommendation: KEEP.** Optionally tint the XP progress bar with the gold accent; otherwise untouched.

### 8. Boneyard
- **Demo does:** Dark. `boneyard` logo header (bone icon + `bone` ink / `yard` rust). `filter-bar` card (`Find parts that fit: Ronin Wasp` + chevron). **Chip row** (`All parts` active = rust fill, `Auctions`, `Buy It Now`, `Ending soon`). Gold `set-bonus` banner (high-bid notice). `part-row`s: `88px` thumb, name, cond, `$price` + strikethrough `was`, `Free delivery · N watchers`, **full-width rust** `Buy It Now` / `Place Bid` buttons.
- **Live does today:** Light. Same logo + "Add model" dropdown. "Find parts that fit" header + cart. **Segmented buttons**: `Buy Parts` (red fill) / `My Listings` (outline); then `All` (red fill) / `Buy It Now` / `Auctions` (outline). Part rows: thumb left, name, cond + flavor line, `$price` + was, watchers, full-width CTA — **red** for Buy It Now, **rust** only for Place Bid.
- **Deltas:** (1) Filter controls are segmented buttons vs demo chips. (2) Accent discipline broken: live uses red for boneyard CTAs where the demo uses rust throughout (`--rust:#c96f1e`). (3) Live has no high-bid banner equivalent (it shows a timer chip on the thumb instead — fine).
- **Recommendation: CHANGE.** Convert both button rows to demo chip rows; **move all boneyard CTAs to rust** (red is the marketplace's accent — this is the clearest accent-discipline violation in the game). Keep the live flavor lines, watcher counts, and auction timers.

### 9. Crate Fresh
- **Demo does:** Dark. `crate fresh` logo (crate icon + `crate` ink / `fresh` gold). `filter-bar` (`Find parts that fit`). Chip row (`All NOS parts` active gold). `fresh-banner` (star icon, gold-tinted card). `part-row`s with NOS seal pills (gold outline pill on the name), price, `Free delivery · Only 1 left`, **full-width gold** `Buy Now` buttons.
- **Live does today:** Light. Same logo + "Add model". "NOS Parts Co." header. Dealer-voice description card ("Still in the factory plastic…"). Part rows with gold `NOS` badges, `NOS · Factory-sealed · 100%` in gold, price, stock line, **full-width GREEN** `Buy It Now` buttons.
- **Deltas:** (1) Live CTA is green; demo's is gold. (2) Live has the dealer-voice card (an approved copy addition — keep). (3) Live lacks the chip row (no category filter visible in screenshot; there's an "Add model" dropdown instead).
- **Recommendation: CHANGE (accent only).** Move CTAs from green to **gold** for accent discipline (green reads as "go/confirm" and collides with nothing else, but the demo's per-app accent system is the cleaner rule). **Judgment call:** green CTAs tested fine with Garrett — if he prefers green, keep it and note the exception. Keep the dealer-voice card untouched. Consider adding the demo's chip row only if category filtering exists; otherwise skip.

### 10. Collection wall (brand sets)
- **Demo does:** Dark. `pane-head` "The Collection Wall" + sub. `coll-summary` card: `12 / 29 collected` + `41%`, gold progress bar, sub line. `set-row` cards (`12px` radius, hairline): brand name + `n / 4` left, **slot pills** — filled = green-tinted with green border, empty = dashed hairline. Gold `set-bonus` banner at the end.
- **Live does today:** Light. "Collection Wall" + `1 of 47 bikes collected`. Brand rows: name + `0/6` left, slot pills — collected = green check in green-outline box, uncollected = dashed `?` boxes. Rows separated by hairlines, no card containers.
- **Deltas:** (1) Demo wraps each brand set in a card; live uses hairline-separated rows (cleaner, arguably better). (2) Demo has the summary card with progress bar; live has a plain text line. (3) Slot pills are conceptually identical (filled green / dashed empty).
- **Recommendation: CHANGE (light).** Add the `coll-summary` card with the gold progress bar (it's the best "at a glance" element the demo has and live lacks it). **Keep** live's row layout (don't re-card every brand — the hairline rows are fine and less heavy). Keep slot pill language as-is.

### 11. Ledger
- **Demo does:** No ledger screen in the demo.
- **Live does today:** "The Ledger" + tagline. `ledger-section` cards (`10px` radius, hairline): `THE GRIND` / `THE GLORY` / `THE SHAME` small-caps titles, rows with label + sub left, value right, hairline dividers.
- **Deltas:** None vs demo (no reference). Already matches the demo's card + small-caps-label language better than any other screen.
- **Recommendation: KEEP.** Closest match in the game; only align radius to `12px` for token consistency.

### 12. Settings
- **Demo does:** Dark. `set-title` "Settings". `profile-card` (avatar + name + wallet/collection sub). iOS groups: small-caps labels (`GAME`, `DISPLAY`, `YOUR DATA — DEMO`, `ABOUT`), `set-list` cards (`14px` radius, hairline), rows with colored icon tile + label + green iOS switch or chevron.
- **Live does today:** Light. Profile card (red avatar + "sold as-is" + wallet/collection). Same iOS groups (`GAME`, `MUSIC`, `YOUR DATA`), `14px` radius group cards, rows with colored icon tiles + labels + chevron/value. (Live uses text rows like `off >` instead of switches.)
- **Deltas:** Near-identical structure. Demo uses iOS switches; live uses detail-row chevrons. Demo groups: GAME / DISPLAY / YOUR DATA / ABOUT; live: GAME / MUSIC / YOUR DATA.
- **Recommendation: KEEP.** This is the best demo match in the game. Optional polish: standardize group-card radius to the demo's `14px` (live already `14px` — confirmed match). No change needed.

---

## Biggest deltas, ranked

1. **Filter controls: chips vs segmented buttons.** Demo uses pill chip rows everywhere (Marketplace, Boneyard, Crate). Live uses underline nav links + big segmented buttons. Chips are the single most "mobile app" signal in the demo. (Screens: 1, 8, 9)
2. **Accent discipline.** Demo assigns one accent per app (red market, rust boneyard, gold crate). Live leaks red into Boneyard CTAs and uses green in Crate Fresh. (Screens: 8, 9)
3. **Action buttons too small.** Live garage detail buttons are `9px` padding / `.82rem`; demo's are full-width, `15px` padding / `.97rem`, icon + label. Thumb-reach bar. (Screen: 4)
4. **Collection summary card.** Demo's `12 / 29 collected` + gold progress bar card; live has a plain text line. Cheap, high-value add. (Screen: 10)
5. **Card token drift.** Live radii wander (`8px`, `10px`, `14px`); demo is a disciplined `12px` card / `9–11px` button / `20px` pill with hairlines and zero shadows. Standardize, don't redesign.

## Explicitly out of scope (already approved — do not touch)
- The 7 app icons, lock screen, home screen, Safari chrome, tab strip.
- The light theme itself and the dark-mode toggle. The pass applies the demo's component language to **both** themes.
- All copy (dealer-voice NOS card, flavor lines, taglines), all behaviors, all gating logic.

## Open judgment calls for Garrett
1. **Crate Fresh CTA color:** demo gold vs live green. (My lean: gold, for accent discipline — but green shipped fine.)
2. **Featured card on Marketplace:** demo-only chrome; skip unless wanted.
3. **Parts display in bike detail:** keep live's info-rich list vs adopt demo's visual grid. (My lean: keep the list, style to grid language.)
4. **Theme default:** the demo is dark-only and dark mode already matches it token-for-token. No change proposed — but if Garrett ever wants the app to *default* to dark, the work is a one-line default flip, not a redesign.
