# Storefront POC Requirements — Automotive Accessories eCommerce

## Project Context
- **Purpose:** POC for UI/UX design discussion with customer
- **Platform:** AEM Edge Delivery Services (EDS) + Adobe Commerce
- **Branch:** `poc`
- **Approach:** Feature-flagged blocks with mock data for backend integrations
- **Visual Style:** Match mazdausa.com — black, grey, white color palette
- **Scope:** All features from frontend perspective for design discussion

---

## User Feedback (Phase 1 Answers)
1. **Vehicle data:** Generic placeholder data (mock Year/Make/Model/Trim)
2. **Dealer data:** Generic US locations; real data will come from data platform via integration
3. **Visual styling:** Match mazdausa.com — black, grey, white palette
4. **Landing page:** Yes — custom home page with hero, categories, promotions
5. **Feature scope:** Cover ALL features from frontend perspective for design discussions
6. **Custom return flow:** Return flow in requirements may need custom implementation beyond OOTB

---

## Gap Analysis: Requirements vs. Current Codebase

### Already Covered by Existing Blocks
| Requirement | Existing Block | Status |
|---|---|---|
| 1.1 Log In/Out | `commerce-login` | ✅ Covered |
| 2.1 Account Registration | `commerce-create-account` | ✅ Covered |
| 2.2 Address Management | `commerce-addresses` | ✅ Covered |
| 3.2 View/Modify Profile | `commerce-customer-information` | ✅ Covered |
| 4.2 eComm Navigation | `header` block | ✅ Covered |
| 5.1 Browse Catalog | `product-list-page` | ✅ Covered |
| 5.2 View Product Categories | `product-list-page` | ✅ Covered |
| 5.5 Search and Results | `product-list-page` (search mode) | ✅ Covered |
| 6.1 View PDP | `product-details` | ✅ Covered |
| 6.7 View Product Pricing | `product-details` | ✅ Covered |
| 8.1 Recommended Products | `product-recommendations` | ✅ Covered |
| 9.1 View/Manage Cart | `commerce-cart` | ✅ Covered |
| 9.5 Mini Cart | `commerce-mini-cart` | ✅ Covered |
| 11.2-11.9 Checkout Flow | `commerce-checkout` | ✅ Covered |
| 13.1-13.2 View Orders | `commerce-orders-list` | ✅ Covered |
| 14.1-14.3 Returns | `commerce-returns-list`, `commerce-create-return` | ✅ Covered |

### Gaps to Implement

#### Feature 0: Brand Theming (Mazda-Style)
- **Priority:** Foundation
- **Description:** Override CSS design tokens to match mazdausa.com: black (#000), dark grey (#333), medium grey (#666), light grey (#f5f5f5), white (#fff). Clean, minimal typography. Update header/footer styling.

#### Feature 1: Feature Flags System
- **Priority:** Foundation (required by all other features)
- **Req:** N/A (infrastructure)
- **Description:** Centralized feature flag configuration in `config.json` with a utility function to check flags at runtime. All new POC blocks will check their flag before rendering.

#### Feature 2: Custom Home Page / Landing Page
- **Priority:** High
- **Req:** 4.1, 4.3, 5.7
- **Description:** Home page with hero banner, category grid/cards, promotional content area, and marketing content sections. Navigation to product categories. Branded header/footer.

#### Feature 3: Vehicle Fitment Selector Block
- **Priority:** High
- **Req:** 5.3, 6.5
- **Description:** Allow customers to verify vehicle compatibility for accessories. Supports VIN entry OR Year/Make/Model/Trim dropdown selection. For registered customers, defaults to their registered vehicle. Generic mock data.

#### Feature 4: Dealer Locator Block
- **Priority:** High
- **Req:** 5.4, 6.9, 9.6
- **Description:** Display nearby dealers based on zip code. Allow selection for pickup or installation services. Show dealer name, address, distance, hours. Generic US locations as mock data. Real data from data platform via integration later.

#### Feature 5: Fulfillment Options Selector Block
- **Priority:** High
- **Req:** 6.10, 9.3, 11.11
- **Description:** Radio/card selector for Ship / Pick-up at Dealer / Dealer Installation. Selecting Pick-up or Installation triggers Dealer Locator. Shows estimated fulfillment time for each option. Integrates with Add-to-Cart flow.
- **Scheduling Integration:** When Pick-up or Installation is selected, the flow must include a scheduling step that looks up the dealer's external calendar system (e.g., service scheduler tools — Req 30.11). For POC, this renders as a mock calendar/date-picker UI with available time slots, designed to be swapped for real external calendar API integration. The design must accommodate 3 different service scheduling tools in the ecosystem.

#### Feature 6: Stock Availability & ETA Display
- **Priority:** Medium
- **Req:** 6.2, 7.1, 7.2, 7.3
- **Description:** Show stock status (In Stock, Out of Stock, Backorder) and estimated fulfillment time range on PDP and PLP. Mock data for POC.

#### Feature 7: Installation Info Block
- **Priority:** Medium
- **Req:** 6.3, 6.6, 6.8, 30.17
- **Description:** Display installation information: difficulty level (Easy/Medium/Hard), DIY instructions link (iSheet — external URL from PIM/iSheet system), dealer installation pricing, Qmerit link for wall charger installs. Shown on PDP.
- **iSheets:** Installation documents/menus are called "iSheets" — external links provided per product from the iSheet integration (Req 30.17). These are external URLs that open in a new tab. For POC, mock iSheet URLs will be used. The block must be designed to accept and display one or more iSheet links per product.

#### Feature 8: Cookie Consent Banner
- **Priority:** Medium
- **Req:** 4.5
- **Description:** Cookie consent banner with Accept/Reject/Preferences options. Persists in localStorage. Styled to match brand.

#### Feature 9: Back-in-Stock Notification (Notify Me)
- **Priority:** Medium
- **Req:** 6.14
- **Description:** "Notify Me" button shown when product is out of stock or on backorder. Collects customer email. Mock submission for POC.

#### Feature 10: Contact/Support Block
- **Priority:** Medium
- **Req:** 18.1, 18.2, 18.3, 18.4
- **Description:** Support section with FAQ link, Live Chat link, Phone number, Email/Contact form link. All link out to clientusa.com equivalents.

#### Feature 11: Custom Return Flow
- **Priority:** Medium
- **Req:** 14.1, 16.1, 16.2, 16.3
- **Description:** Enhanced return flow beyond OOTB: return request form with reason selection, shipping label generation display, RMA tracking, return status timeline. Extends existing `commerce-create-return` and `commerce-returns-list` blocks or creates wrapper blocks.

#### Feature 12: Order Cancellation
- **Priority:** Medium
- **Req:** 13.8
- **Description:** Allow customers to initiate order cancellation from order details page within cancellation window. Shows cancellation policy and confirmation dialog.

#### Feature 13: Promo/Discount Code in Cart
- **Priority:** Low
- **Req:** 11.4
- **Description:** Apply promotion/discount code field in cart. Existing `commerce-cart` dropin may support this — verify and enable/customize.

#### Feature 14: Enhanced Checkout Flow
- **Priority:** High
- **Req:** 11.1-11.11
- **Description:** Extend OOTB checkout to include automotive-specific steps. The existing checkout dropin already handles: login, shipping address, billing address, shipping methods, payment methods (Stripe/credit card), order summary, cart summary, terms & conditions, gift options, and order confirmation with status/shipping/cost/product list.
- **Enhancements needed:**
  - **Fulfillment summary in checkout:** Display selected fulfillment option (Ship/Pick-up/Installation) per line item in order summary
  - **Dealer info in checkout:** Show selected dealer name and address for pickup/installation items
  - **Installation scheduling in checkout:** For items with dealer installation, embed scheduling step (Req 11.11) — date/time picker linked to dealer's external calendar. POC uses mock calendar.
  - **Order confirmation enhancements:** Show fulfillment-specific confirmation details (shipping tracking for shipped items, dealer pickup info with date/time, installation appointment details)
  - **No guest checkout for this phase.** Customer must login or register at checkout. Show login/register options at checkout entry point. Guest checkout is deferred to Release 1 (Req 11.1).

#### Feature 15: Order Confirmation Page Enhancements
- **Priority:** High
- **Req:** 11.9, 13.4
- **Description:** Extend OOTB order confirmation to show automotive-specific details. The existing confirmation already shows: order header, order status, shipping status, customer details, cost summary, product list, and continue shopping/contact support footer.
- **Enhancements needed:**
  - **Per-item fulfillment status:** Show Ship/Pick-up/Installation status per line item
  - **Dealer appointment details:** For installation items, show scheduled appointment date/time and dealer info
  - **Pickup details:** For pickup items, show dealer address, estimated ready date, and pickup window
  - **Next steps guidance:** Clear instructions per fulfillment type (track shipment, prepare for pickup, installation appointment reminder)
  - **Email confirmation note:** Indicate confirmation email has been sent (Req 13.4)

---

## Feature Flag Schema (Proposed)

Added to `config.json` under `public.default`:

```json
"features": {
  "vehicle-fitment": true,
  "dealer-locator": true,
  "fulfillment-options": true,
  "stock-availability": true,
  "installation-info": true,
  "cookie-consent": true,
  "notify-me": true,
  "contact-support": true,
  "custom-returns": true,
  "order-cancellation": true,
  "promo-code": true,
  "dealer-scheduling": true,
  "checkout-fulfillment-summary": true,
  "checkout-installation-scheduling": true,
  "order-confirmation-enhanced": true,
  "landing-page-hero": true,
  "landing-page-categories": true,
  "landing-page-promotions": true
}
```

Utility function in `scripts/features.js`:
```javascript
export async function isFeatureEnabled(featureName) { ... }
```

Each block checks its flag in its `decorate()` function and renders empty if disabled.

---

## Assumptions
1. All backend integrations use **mock data** (JSON files or inline data) since this is a POC
2. Vehicle data (Year/Make/Model/Trim) uses a generic placeholder dataset
3. Dealer data uses generic US locations (~5 dealers); real data from data platform later
4. Stock availability is mock data attached to products
5. Installation pricing and info is mock data
6. Cookie consent is functional but OneTrust integration (Req 30.19) deferred
7. SSO/MUSA redirection (Req 1.2) shown as placeholder links
8. No guest checkout in this phase — customer must login or register at checkout (Req 11.1 deferred to Release 1)
9. Subscription features (Req 15.x) out of scope — separate workstream
9. Backend integrations (Req 30.x), data provisioning (Req 31.x), backoffice (Req 19-27) out of scope
10. Custom return flow extends/wraps existing OOTB return blocks
11. Brand styling matches mazdausa.com black/grey/white palette
12. Dealer scheduling uses mock calendar data; real integration will connect to 3 different service scheduler tools
13. iSheets (installation documents) are external URLs from the iSheet system — mock URLs for POC

---

## Phase 1: Complete ✅
Date: 2026-03-19

## Phase 2: Complete ✅
User Approved: Yes
Approval Date: 2026-03-19

## Phase 3: Implementation Approach Selected
Approach: Option A (Detailed implementation plan before code)
Selection Date: 2026-03-19
Implementation Plan: scratch/IMPLEMENTATION-PLAN.md

## Phase 4: Implementation Started
Date: 2026-03-19
Status: Awaiting user approval of implementation plan ⏸️
