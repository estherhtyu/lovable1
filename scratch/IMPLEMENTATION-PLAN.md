# Detailed Implementation Plan — Automotive Accessories POC

## File Inventory

### Foundation Files (Feature 0-1)
| File | Action | Description |
|------|--------|-------------|
| `styles/styles.css` | MODIFY | Override design tokens for black/grey/white Mazda palette |
| `scripts/features.js` | CREATE | Feature flag utility |
| `config.json` | MODIFY | Add `features` object |
| `mock-data/vehicles.json` | CREATE | Mock vehicle fitment data |
| `mock-data/dealers.json` | CREATE | Mock dealer locations |
| `mock-data/stock.json` | CREATE | Mock stock/availability data |
| `mock-data/installation.json` | CREATE | Mock installation info + iSheet links |
| `mock-data/schedule.json` | CREATE | Mock dealer calendar/time slots |

### New Blocks
| Block | Files | Feature |
|-------|-------|---------|
| `blocks/vehicle-fitment/` | `.js`, `.css` | F3: Vehicle compatibility |
| `blocks/dealer-locator/` | `.js`, `.css` | F4: Dealer finder |
| `blocks/fulfillment-options/` | `.js`, `.css` | F5: Ship/Pickup/Install selector |
| `blocks/dealer-scheduling/` | `.js`, `.css` | F5: Calendar/time slot picker |
| `blocks/stock-availability/` | `.js`, `.css` | F6: Stock status + ETA |
| `blocks/installation-info/` | `.js`, `.css` | F7: Install difficulty/pricing/iSheets |
| `blocks/cookie-consent/` | `.js`, `.css` | F8: Cookie banner |
| `blocks/notify-me/` | `.js`, `.css` | F9: Back-in-stock email |
| `blocks/contact-support/` | `.js`, `.css` | F10: FAQ/chat/call/email links |
| `blocks/order-cancellation/` | `.js`, `.css` | F12: Cancel order UI |
| `blocks/return-flow/` | `.js`, `.css` | F11: Enhanced return process |
| `blocks/category-cards/` | `.js`, `.css` | F2: Home page category grid |
| `blocks/promo-banner/` | `.js`, `.css` | F2: Home page promotions |
| `blocks/checkout-fulfillment/` | `.js`, `.css` | F14: Checkout fulfillment summary |
| `blocks/order-confirmation-enhanced/` | `.js`, `.css` | F15: Enhanced confirmation |

### Modified Existing Files
| File | Action | Description |
|------|--------|-------------|
| `blocks/hero/hero.css` | MODIFY | Brand-styled full-width hero |
| `blocks/header/header.css` | MODIFY | Black/white brand header |
| `blocks/footer/footer.css` | MODIFY | Brand-styled footer |
| `blocks/product-details/product-details.js` | MODIFY | Integrate vehicle-fitment, fulfillment-options, stock-availability, installation-info, notify-me via events. Add iSheet links section in PDP (external document links from product data). |
| `blocks/product-details/product-details.css` | MODIFY | Brand styling |
| `blocks/product-list-page/product-list-page.css` | MODIFY | Brand styling |
| `blocks/commerce-cart/commerce-cart.css` | MODIFY | Brand styling |
| `blocks/commerce-checkout/commerce-checkout.css` | MODIFY | Brand styling |
| `blocks/commerce-checkout/commerce-checkout.js` | MODIFY | Enforce auth, add fulfillment summary slot |
| `blocks/commerce-checkout/fragments.js` | MODIFY | Add fulfillment/scheduling containers |

---

## Feature 0: Brand Theming (Mazda-Style)

### `styles/styles.css` — Token Overrides

Replace color tokens to match mazdausa.com:
```css
/* Mazda-inspired palette */
--color-brand-300: #666;
--color-brand-500: #333;
--color-brand-600: #222;
--color-brand-700: #111;
--color-neutral-50: #fff;
--color-neutral-100: #fafafa;
--color-neutral-200: #f5f5f5;
--color-neutral-300: #e5e5e5;
--color-neutral-400: #ccc;
--color-neutral-500: #999;
--color-neutral-600: #666;
--color-neutral-700: #444;
--color-neutral-800: #222;
--color-neutral-900: #111;

/* Primary action = black */
--color-button-active: #000;
--color-button-hover: #222;
--color-button-focus: #111;
```

Add new brand-specific tokens:
```css
--color-mazda-black: #000;
--color-mazda-dark: #1a1a1a;
--color-mazda-grey: #666;
--color-mazda-light: #f5f5f5;
--color-mazda-white: #fff;
--color-mazda-accent: #910a2a; /* Mazda soul red for accents/alerts */
```

### `blocks/header/header.css` — Brand Header
- Black background, white text
- Logo area left-aligned
- Clean nav links in white/grey

### `blocks/footer/footer.css` — Brand Footer
- Dark grey (#1a1a1a) background
- White text, grey links
- Multi-column layout

### `blocks/hero/hero.css` — Full-Width Hero
- Full viewport width, min-height 500px
- Dark overlay on image for text readability
- White headline text, CTA button in brand style

---

## Feature 1: Feature Flags System

### `scripts/features.js` (NEW)
```javascript
import { getConfigValue } from '@dropins/tools/config.js';

let featuresCache = null;

async function loadFeatures() {
  if (featuresCache) return featuresCache;
  try {
    const features = await getConfigValue('features');
    featuresCache = features || {};
  } catch {
    featuresCache = {};
  }
  return featuresCache;
}

export async function isFeatureEnabled(name) {
  const features = await loadFeatures();
  return features[name] === true || features[name] === 'true';
}

export function getFeatureFlag(name) {
  // Synchronous check for already-loaded flags
  if (!featuresCache) return true; // default enabled if not loaded
  return featuresCache[name] === true || featuresCache[name] === 'true';
}
```

### `config.json` — Add Features Object
```json
"features": {
  "vehicle-fitment": true,
  "dealer-locator": true,
  "fulfillment-options": true,
  "dealer-scheduling": true,
  "stock-availability": true,
  "installation-info": true,
  "cookie-consent": true,
  "notify-me": true,
  "contact-support": true,
  "custom-returns": true,
  "order-cancellation": true,
  "promo-code": true,
  "checkout-fulfillment-summary": true,
  "checkout-installation-scheduling": true,
  "order-confirmation-enhanced": true,
  "landing-page-hero": true,
  "landing-page-categories": true,
  "landing-page-promotions": true
}
```

### Block Integration Pattern
Every new block will use:
```javascript
import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('feature-name')) {
    block.remove();
    return;
  }
  // ... block logic
}
```

---

## Feature 2: Custom Home Page

### `blocks/category-cards/category-cards.js` (NEW)
- Reads category data from block table (author-friendly: image | name | link per row)
- Renders responsive grid of category cards with hover effects
- Each card: image, category name, "Shop Now" link
- Feature flag: `landing-page-categories`

### `blocks/category-cards/category-cards.css` (NEW)
- CSS Grid: 2 columns mobile, 3 columns tablet, 4 columns desktop
- Cards: image fills container, dark overlay with white text at bottom
- Hover: slight zoom on image, underline on text

### `blocks/promo-banner/promo-banner.js` (NEW)
- Reads promo content from block table (image | headline | description | CTA link)
- Supports single promo (full-width) or multi-promo (side-by-side)
- Feature flag: `landing-page-promotions`

### `blocks/promo-banner/promo-banner.css` (NEW)
- Full-width background image with text overlay
- Multi-promo: 2-column layout on desktop
- Dark/light variants via block class (`promo-banner dark`)

### `blocks/hero/hero.css` (MODIFY)
- Full viewport width hero with dark image overlay
- Centered white headline + subhead
- CTA button: white outline or solid black

---

## Feature 3: Vehicle Fitment Selector

### `mock-data/vehicles.json` (NEW)
```json
{
  "years": [2024, 2025, 2026],
  "makes": {
    "2024": ["Mazda"],
    "2025": ["Mazda"],
    "2026": ["Mazda"]
  },
  "models": {
    "Mazda": ["CX-5", "CX-30", "CX-50", "CX-70", "CX-90", "Mazda3"]
  },
  "trims": {
    "CX-5": ["S", "S Select", "S Preferred", "S Carbon Edition", "S Premium", "S Premium Plus", "S Turbo"],
    "CX-30": ["Base", "Select", "Preferred", "Carbon Edition", "Premium", "Turbo"],
    "CX-50": ["S", "S Preferred", "S Premium", "S Premium Plus", "Turbo", "Turbo Premium", "Turbo Premium Plus"],
    "CX-70": ["Premium", "Premium Plus"],
    "CX-90": ["Base", "Preferred", "Preferred Plus", "Premium", "Premium Plus", "S Premium", "S Premium Plus"],
    "Mazda3": ["Base", "Select", "Preferred", "Carbon Edition", "Premium", "Turbo", "Turbo Premium Plus"]
  }
}
```

### `blocks/vehicle-fitment/vehicle-fitment.js` (NEW)
```
Structure:
1. Feature flag check
2. Two-tab UI: "Select Vehicle" (YMM dropdowns) | "Enter VIN" (text input)
3. Cascading dropdowns: Year → Make → Model → Trim
4. On selection: store in sessionStorage, dispatch custom event 'vehicle:selected'
5. Shows selected vehicle as summary bar when collapsed
6. "Change Vehicle" button to re-open selector
7. Reads mock data from mock-data/vehicles.json via fetch()
```

**DOM Structure:**
```html
<div class="vehicle-fitment__wrapper">
  <div class="vehicle-fitment__tabs">
    <button class="vehicle-fitment__tab active" data-tab="ymm">Select Vehicle</button>
    <button class="vehicle-fitment__tab" data-tab="vin">Enter VIN</button>
  </div>
  <div class="vehicle-fitment__panel vehicle-fitment__panel--ymm active">
    <select class="vehicle-fitment__select" data-level="year">...</select>
    <select class="vehicle-fitment__select" data-level="make">...</select>
    <select class="vehicle-fitment__select" data-level="model">...</select>
    <select class="vehicle-fitment__select" data-level="trim">...</select>
    <button class="vehicle-fitment__confirm">Confirm Vehicle</button>
  </div>
  <div class="vehicle-fitment__panel vehicle-fitment__panel--vin">
    <input type="text" placeholder="Enter your 17-digit VIN" maxlength="17" />
    <button class="vehicle-fitment__confirm">Look Up VIN</button>
  </div>
  <div class="vehicle-fitment__selected" hidden>
    <span class="vehicle-fitment__vehicle-name">2025 Mazda CX-5 S Premium</span>
    <button class="vehicle-fitment__change">Change Vehicle</button>
  </div>
</div>
```

**Events dispatched:**
- `vehicle:selected` — payload: `{ year, make, model, trim, vin }`
- `vehicle:cleared` — when user resets selection

**sessionStorage key:** `selected-vehicle`

### `blocks/vehicle-fitment/vehicle-fitment.css` (NEW)
- Tab buttons: black active, grey inactive
- Dropdowns: full-width, stacked on mobile, inline on desktop
- Selected state: compact bar with vehicle name and change button
- Border: 1px solid grey, border-radius per token

---

## Feature 4: Dealer Locator

### `mock-data/dealers.json` (NEW)
```json
[
  {
    "id": "dealer-001",
    "name": "Metro Mazda",
    "address": "1234 Main Street, Dallas, TX 75201",
    "phone": "(214) 555-0100",
    "distance": "3.2 mi",
    "hours": "Mon-Sat 9AM-8PM, Sun 11AM-5PM",
    "services": ["pickup", "installation"],
    "lat": 32.7767,
    "lng": -96.7970
  },
  // ... 4 more dealers
]
```

### `blocks/dealer-locator/dealer-locator.js` (NEW)
```
Structure:
1. Feature flag check
2. Zip code input field with search button
3. Results list showing matching dealers
4. Each dealer card: name, address, distance, hours, services available
5. "Select Dealer" button per card
6. Selected dealer highlighted, stored in sessionStorage
7. Dispatches 'dealer:selected' event
8. Listens for 'fulfillment:changed' to show/hide
```

**DOM Structure:**
```html
<div class="dealer-locator__wrapper">
  <h3 class="dealer-locator__title">Find a Dealer</h3>
  <div class="dealer-locator__search">
    <input type="text" placeholder="Enter ZIP code" maxlength="5" />
    <button class="dealer-locator__search-btn">Search</button>
  </div>
  <div class="dealer-locator__results">
    <div class="dealer-locator__card" data-dealer-id="dealer-001">
      <h4 class="dealer-locator__name">Metro Mazda</h4>
      <p class="dealer-locator__address">1234 Main Street, Dallas, TX 75201</p>
      <p class="dealer-locator__distance">3.2 mi away</p>
      <p class="dealer-locator__hours">Mon-Sat 9AM-8PM, Sun 11AM-5PM</p>
      <div class="dealer-locator__services">
        <span class="dealer-locator__badge">Pickup</span>
        <span class="dealer-locator__badge">Installation</span>
      </div>
      <button class="dealer-locator__select-btn">Select This Dealer</button>
    </div>
    <!-- more cards -->
  </div>
</div>
```

**Events:**
- `dealer:selected` — payload: `{ id, name, address, phone, services }`
- Listens to: `fulfillment:changed`

**sessionStorage key:** `selected-dealer`

### `blocks/dealer-locator/dealer-locator.css` (NEW)
- Cards: white background, 1px grey border, slight shadow on hover
- Selected card: black border, checkmark icon
- Search: inline input + button
- Responsive: single column mobile, 2 columns desktop

---

## Feature 5: Fulfillment Options + Dealer Scheduling

### `blocks/fulfillment-options/fulfillment-options.js` (NEW)
```
Structure:
1. Feature flag check
2. Three card-style radio options: Ship to Address | Pick Up at Dealer | Dealer Installation
3. Each shows estimated time (from mock stock data)
4. Selecting Pick-up or Installation shows dealer-locator inline
5. Selecting Installation also shows dealer-scheduling after dealer selected
6. Dispatches 'fulfillment:changed' event
7. Integrates with Add to Cart button state
```

**DOM Structure:**
```html
<div class="fulfillment-options__wrapper">
  <h3 class="fulfillment-options__title">Choose Fulfillment</h3>
  <div class="fulfillment-options__cards">
    <div class="fulfillment-options__card selected" data-option="ship">
      <div class="fulfillment-options__radio"></div>
      <div class="fulfillment-options__icon">🚚</div>
      <div class="fulfillment-options__label">Ship to Address</div>
      <div class="fulfillment-options__eta">Ships in 5-7 business days</div>
    </div>
    <div class="fulfillment-options__card" data-option="pickup">
      <div class="fulfillment-options__radio"></div>
      <div class="fulfillment-options__icon">🏪</div>
      <div class="fulfillment-options__label">Pick Up at Dealer</div>
      <div class="fulfillment-options__eta">Ready in 3-5 business days</div>
    </div>
    <div class="fulfillment-options__card" data-option="installation">
      <div class="fulfillment-options__radio"></div>
      <div class="fulfillment-options__icon">🔧</div>
      <div class="fulfillment-options__label">Dealer Installation</div>
      <div class="fulfillment-options__eta">Schedule within 7-14 days</div>
    </div>
  </div>
  <div class="fulfillment-options__dealer-section" hidden>
    <!-- dealer-locator renders here -->
  </div>
  <div class="fulfillment-options__scheduling-section" hidden>
    <!-- dealer-scheduling renders here -->
  </div>
</div>
```

**Events:**
- `fulfillment:changed` — payload: `{ option: 'ship'|'pickup'|'installation' }`
- Listens to: `dealer:selected`, `schedule:selected`

**sessionStorage key:** `selected-fulfillment`

### `blocks/dealer-scheduling/dealer-scheduling.js` (NEW)
```
Structure:
1. Feature flag check (dealer-scheduling)
2. Calendar grid showing next 14 days
3. Available time slots per day (from mock data)
4. Designed as abstraction layer — the UI renders a date/slot picker,
   but the data source is pluggable (supports 3 different scheduling tool APIs)
5. Mock data simulates availability windows
6. On selection: dispatches 'schedule:selected' event
7. Shows selected date/time as confirmation bar
```

### `mock-data/schedule.json` (NEW)
```json
{
  "availableSlots": {
    "2026-03-23": ["9:00 AM", "10:00 AM", "1:00 PM", "3:00 PM"],
    "2026-03-24": ["9:00 AM", "11:00 AM", "2:00 PM"],
    "2026-03-25": [],
    "2026-03-26": ["10:00 AM", "1:00 PM", "4:00 PM"],
    // ... next 14 days
  },
  "schedulerType": "default",
  "schedulerEndpoint": "https://api.example.com/schedule"
}
```

**DOM Structure:**
```html
<div class="dealer-scheduling__wrapper">
  <h4 class="dealer-scheduling__title">Schedule Your Appointment</h4>
  <p class="dealer-scheduling__subtitle">Select a date and time at <strong>Metro Mazda</strong></p>
  <div class="dealer-scheduling__calendar">
    <div class="dealer-scheduling__nav">
      <button class="dealer-scheduling__prev">←</button>
      <span class="dealer-scheduling__month">March 2026</span>
      <button class="dealer-scheduling__next">→</button>
    </div>
    <div class="dealer-scheduling__days">
      <!-- day cells with availability indicators -->
    </div>
  </div>
  <div class="dealer-scheduling__slots" hidden>
    <h5>Available times for March 23:</h5>
    <div class="dealer-scheduling__slot-grid">
      <button class="dealer-scheduling__slot">9:00 AM</button>
      <button class="dealer-scheduling__slot">10:00 AM</button>
      <button class="dealer-scheduling__slot">1:00 PM</button>
      <button class="dealer-scheduling__slot">3:00 PM</button>
    </div>
  </div>
  <div class="dealer-scheduling__confirmed" hidden>
    <p>✓ Scheduled for March 23, 2026 at 10:00 AM</p>
    <button class="dealer-scheduling__change">Change</button>
  </div>
</div>
```

**Events:**
- `schedule:selected` — payload: `{ date, time, dealerId, schedulerType }`
- Listens to: `dealer:selected`

### CSS for both: Standard card/grid patterns, black/white/grey palette

---

## Feature 6: Stock Availability & ETA

### `mock-data/stock.json` (NEW)
```json
{
  "default": {
    "status": "in_stock",
    "qty": 25,
    "ship_eta": "5-7 business days",
    "pickup_eta": "3-5 business days",
    "install_eta": "7-14 days"
  },
  "sku-low-stock": {
    "status": "low_stock",
    "qty": 3,
    "ship_eta": "5-7 business days",
    "pickup_eta": "5-7 business days",
    "install_eta": "10-14 days"
  },
  "sku-backorder": {
    "status": "backorder",
    "qty": 0,
    "ship_eta": "3-4 weeks",
    "pickup_eta": "3-4 weeks",
    "install_eta": "4-5 weeks"
  },
  "sku-out-of-stock": {
    "status": "out_of_stock",
    "qty": 0
  }
}
```

### `blocks/stock-availability/stock-availability.js` (NEW)
```
Structure:
1. Feature flag check
2. Listens to 'pdp/data' event to get current SKU
3. Looks up stock data from mock
4. Renders status badge (In Stock = green, Low Stock = orange, Backorder = yellow, Out of Stock = red)
5. Shows ETA based on selected fulfillment option
6. Listens to 'fulfillment:changed' to update ETA display
7. Dispatches 'stock:status' event for notify-me block to consume
```

**DOM Structure:**
```html
<div class="stock-availability__wrapper">
  <div class="stock-availability__badge stock-availability__badge--in-stock">
    <span class="stock-availability__dot"></span>
    In Stock
  </div>
  <div class="stock-availability__eta">
    Ships in 5-7 business days
  </div>
</div>
```

---

## Feature 7: Installation Info

### `mock-data/installation.json` (NEW)
```json
{
  "default": {
    "difficulty": "medium",
    "diy_time": "45-60 minutes",
    "dealer_price": "$89.00",
    "isheets": [
      { "title": "Installation Guide", "url": "https://example.com/isheet/install-guide.pdf" },
      { "title": "Parts Diagram", "url": "https://example.com/isheet/parts-diagram.pdf" }
    ],
    "qmerit_eligible": false,
    "notes": "Professional installation recommended for best results"
  },
  "wall-charger": {
    "difficulty": "hard",
    "diy_time": "N/A - Professional installation required",
    "dealer_price": "$299.00",
    "isheets": [
      { "title": "Charger Specifications", "url": "https://example.com/isheet/charger-specs.pdf" }
    ],
    "qmerit_eligible": true,
    "qmerit_url": "https://www.qmerit.com/mazda",
    "notes": "Licensed electrician required. Schedule through Qmerit."
  }
}
```

### `blocks/installation-info/installation-info.js` (NEW)
```
Structure:
1. Feature flag check
2. Listens to 'pdp/data' for current product
3. Renders installation card with:
   - Difficulty meter (visual bar: Easy/Medium/Hard)
   - Estimated DIY time
   - Dealer installation price
   - iSheet links (external, open in new tab, icon for PDF)
   - Qmerit link if eligible (opens in new tab)
   - Notes/recommendations
4. "Add Installation" button that triggers fulfillment option to 'installation'
```

**iSheet links also appear on PDP directly** — The `product-details` block will be modified to render an "Installation Documents" section in the right column (below description/attributes), pulling iSheet URLs from the mock installation data keyed by SKU. This gives customers quick access to iSheets without scrolling to the installation-info block. The installation-info block shows the same links plus additional context (difficulty, pricing).

**DOM Structure:**
```html
<div class="installation-info__wrapper">
  <h3 class="installation-info__title">Installation Information</h3>
  <div class="installation-info__card">
    <div class="installation-info__difficulty">
      <span class="installation-info__label">Difficulty</span>
      <div class="installation-info__meter" data-level="medium">
        <span class="installation-info__bar"></span>
        <span class="installation-info__bar active"></span>
        <span class="installation-info__bar"></span>
      </div>
      <span class="installation-info__level">Medium</span>
    </div>
    <div class="installation-info__time">
      <span class="installation-info__label">DIY Time</span>
      <span>45-60 minutes</span>
    </div>
    <div class="installation-info__price">
      <span class="installation-info__label">Dealer Installation</span>
      <span class="installation-info__amount">$89.00</span>
    </div>
    <div class="installation-info__documents">
      <span class="installation-info__label">Installation Documents</span>
      <ul class="installation-info__isheets">
        <li><a href="..." target="_blank" rel="noopener">📄 Installation Guide</a></li>
        <li><a href="..." target="_blank" rel="noopener">📄 Parts Diagram</a></li>
      </ul>
    </div>
    <div class="installation-info__qmerit" hidden>
      <a href="https://www.qmerit.com/mazda" target="_blank" rel="noopener">
        Schedule with Qmerit →
      </a>
    </div>
    <p class="installation-info__notes">Professional installation recommended</p>
  </div>
</div>
```

---

## Feature 8: Cookie Consent Banner

### `blocks/cookie-consent/cookie-consent.js` (NEW)
```
Structure:
1. Feature flag check
2. Check localStorage for existing consent
3. If no consent, render fixed bottom banner
4. Three buttons: Accept All | Reject Non-Essential | Manage Preferences
5. Preferences opens modal with toggle switches per category
6. On choice: save to localStorage, dispatch 'cookie:consent' event
7. Loaded via scripts/delayed.js (non-blocking)
```

### `blocks/cookie-consent/cookie-consent.css` (NEW)
- Fixed bottom bar, full width, dark background (black), white text
- Z-index above all content
- Responsive: buttons stack on mobile

---

## Feature 9: Notify Me (Back-in-Stock)

### `blocks/notify-me/notify-me.js` (NEW)
```
Structure:
1. Feature flag check
2. Listens to 'stock:status' event
3. Only renders when status is 'out_of_stock' or 'backorder'
4. Shows email input + "Notify Me" button
5. On submit: mock success, show confirmation message
6. For authenticated users, pre-fill email
```

**DOM:** Simple form with email input and submit button.

---

## Feature 10: Contact/Support

### `blocks/contact-support/contact-support.js` (NEW)
```
Structure:
1. Feature flag check
2. Reads links from block table (author-configurable)
3. Renders grid of support cards: FAQ, Live Chat, Call Us, Email Us
4. Each card: icon, title, description, link/action
5. All links open in new tab (external to clientusa.com)
```

---

## Feature 11: Custom Return Flow

### `blocks/return-flow/return-flow.js` (NEW)
```
Structure:
1. Feature flag check
2. Multi-step return form:
   Step 1: Select items to return (from order)
   Step 2: Select return reason per item (dropdown)
   Step 3: Select return method (Ship back | Drop off at dealer)
   Step 4: Review & submit
3. After submit: show RMA number, shipping label (mock), status timeline
4. Wraps/extends existing commerce-create-return dropin
5. Dispatches 'return:created' event
```

**Status timeline DOM:**
```html
<div class="return-flow__timeline">
  <div class="return-flow__step completed">
    <div class="return-flow__step-dot"></div>
    <div class="return-flow__step-label">Request Submitted</div>
    <div class="return-flow__step-date">Mar 19, 2026</div>
  </div>
  <div class="return-flow__step active">
    <div class="return-flow__step-dot"></div>
    <div class="return-flow__step-label">Awaiting Return Shipment</div>
  </div>
  <div class="return-flow__step">
    <div class="return-flow__step-dot"></div>
    <div class="return-flow__step-label">Return Received</div>
  </div>
  <div class="return-flow__step">
    <div class="return-flow__step-dot"></div>
    <div class="return-flow__step-label">Refund Processed</div>
  </div>
</div>
```

---

## Feature 12: Order Cancellation

### `blocks/order-cancellation/order-cancellation.js` (NEW)
```
Structure:
1. Feature flag check
2. Renders "Cancel Order" button on order details page
3. Button only visible if order is within cancellation window (mock: 1 hour)
4. On click: confirmation modal with cancellation policy text
5. On confirm: mock API call, update order status display
6. Shows countdown timer for cancellation window
```

---

## Feature 14: Enhanced Checkout Flow

### `blocks/commerce-checkout/fragments.js` (MODIFY)
Add containers to checkout fragment:
```html
<div class="checkout__fulfillment-summary ${CHECKOUT_BLOCK}"></div>
<!-- after shipping form, before payment -->
<div class="checkout__installation-scheduling ${CHECKOUT_BLOCK}"></div>
```

### `blocks/commerce-checkout/commerce-checkout.js` (MODIFY)
1. Import `isFeatureEnabled` from features.js
2. At checkout init: enforce authentication — if guest, show login/register prompt instead of checkout form
3. If `checkout-fulfillment-summary` enabled: render fulfillment summary showing per-item Ship/Pickup/Install selection from sessionStorage
4. If `checkout-installation-scheduling` enabled and any item has installation: render dealer-scheduling inline
5. Show selected dealer info for pickup/installation items

### `blocks/checkout-fulfillment/checkout-fulfillment.js` (NEW)
```
Structure:
1. Reads fulfillment selections from sessionStorage
2. Renders per-item summary: product name, fulfillment type, dealer (if applicable), scheduled time (if applicable)
3. Allows editing (links back to fulfillment-options)
4. Read-only summary in order review step
```

---

## Feature 15: Enhanced Order Confirmation

### `blocks/order-confirmation-enhanced/order-confirmation-enhanced.js` (NEW)
```
Structure:
1. Feature flag check
2. Listens to 'order/placed' event
3. Renders additional sections below OOTB confirmation:
   - Per-item fulfillment details (ship tracking placeholder, pickup info, install appointment)
   - Next steps section per fulfillment type
   - Email confirmation notice
4. Reads fulfillment/dealer/schedule data from sessionStorage
```

**DOM Structure:**
```html
<div class="order-confirmation-enhanced__wrapper">
  <div class="order-confirmation-enhanced__fulfillment">
    <h3>Fulfillment Details</h3>
    <div class="order-confirmation-enhanced__item" data-fulfillment="ship">
      <p class="order-confirmation-enhanced__product">All-Weather Floor Mats</p>
      <p class="order-confirmation-enhanced__method">📦 Shipping to your address</p>
      <p class="order-confirmation-enhanced__eta">Estimated delivery: 5-7 business days</p>
    </div>
    <div class="order-confirmation-enhanced__item" data-fulfillment="installation">
      <p class="order-confirmation-enhanced__product">Roof Rack Cross Bars</p>
      <p class="order-confirmation-enhanced__method">🔧 Dealer Installation</p>
      <p class="order-confirmation-enhanced__dealer">Metro Mazda — 1234 Main St, Dallas, TX</p>
      <p class="order-confirmation-enhanced__appointment">Appointment: March 23, 2026 at 10:00 AM</p>
    </div>
  </div>
  <div class="order-confirmation-enhanced__next-steps">
    <h3>Next Steps</h3>
    <ul>
      <li>A confirmation email has been sent to your email address</li>
      <li>You will receive a shipping notification when your items ship</li>
      <li>Please arrive 10 minutes early for your installation appointment</li>
    </ul>
  </div>
</div>
```

---

## Event Communication Map

```
vehicle:selected ──→ product-details (filter compatibility)
                 ──→ stock-availability (update availability)
                 ──→ fulfillment-options (update ETAs)

fulfillment:changed ──→ dealer-locator (show/hide)
                    ──→ stock-availability (update ETA display)
                    ──→ dealer-scheduling (show/hide)

dealer:selected ──→ dealer-scheduling (load calendar)
                ──→ fulfillment-options (update selected dealer)
                ──→ checkout-fulfillment (display in checkout)

schedule:selected ──→ fulfillment-options (update scheduled time)
                  ──→ checkout-fulfillment (display in checkout)

stock:status ──→ notify-me (show/hide)

order/placed ──→ order-confirmation-enhanced (render details)

cookie:consent ──→ analytics scripts (enable/disable)
```

---

## Implementation Order

### Batch 1: Foundation
1. `styles/styles.css` — brand tokens
2. `scripts/features.js` — feature flag utility
3. `config.json` — features object
4. All `mock-data/*.json` files

### Batch 2: Home Page
5. `blocks/category-cards/` — category grid
6. `blocks/promo-banner/` — promotional content
7. `blocks/hero/hero.css` — enhanced hero styling
8. `blocks/header/header.css` — brand header
9. `blocks/footer/footer.css` — brand footer

### Batch 3: Automotive Core (PDP)
10. `blocks/vehicle-fitment/` — vehicle selector
11. `blocks/dealer-locator/` — dealer finder
12. `blocks/fulfillment-options/` — ship/pickup/install
13. `blocks/dealer-scheduling/` — calendar picker
14. `blocks/stock-availability/` — stock status + ETA
15. `blocks/installation-info/` — difficulty/pricing/iSheets

### Batch 4: Utility Blocks
16. `blocks/cookie-consent/` — consent banner
17. `blocks/notify-me/` — back-in-stock
18. `blocks/contact-support/` — support links

### Batch 5: Checkout & Post-Purchase
19. `blocks/commerce-checkout/` modifications — auth enforcement, fulfillment summary
20. `blocks/checkout-fulfillment/` — checkout fulfillment display
21. `blocks/order-confirmation-enhanced/` — enhanced confirmation
22. `blocks/order-cancellation/` — cancel within window
23. `blocks/return-flow/` — enhanced returns

### Batch 6: Existing Block Styling
24. `blocks/product-details/product-details.css` — brand styling
25. `blocks/product-list-page/product-list-page.css` — brand styling
26. `blocks/commerce-cart/commerce-cart.css` — brand styling
27. `blocks/commerce-checkout/commerce-checkout.css` — brand styling
