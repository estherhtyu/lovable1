# UX Design Implementation Requirements
## AEM Boilerplate Commerce — Automotive eCommerce Storefront

---

## Scope Boundary (Confirmed)

**IN SCOPE (this workflow):** EDS storefront blocks, drop-in customization, frontend CSS/JS
**OUT OF SCOPE (Integration Starter Kit):** CRM sync, OMS/ERP sync, eMDCS inventory sync, MuleSoft, SFMC, Bynder, Entra ID/WebSeal
**OUT OF SCOPE (Checkout Starter Kit):** Dealer service scheduler webhooks, payment/shipping webhooks

---

## Source Requirements (from Requirements.csv)

### Journeys In Scope
| Req ID | Feature | Journey Stage |
|--------|---------|--------------|
| 4.2 | eComm Navigation / Breadcrumb | Browse |
| 4.3 | Header and Footer from Main site | Browse |
| 4.5 | Cookie Banner and preferences | Browse |
| 5.3 | Refine search by Vehicle | Browse |
| 5.4 | View and select Dealership (PLP) | Browse |
| 5.7 | View Marketing content (PLP) | Browse |
| 6.3 | Add Dealer Installation Services | Browse |
| 6.5 | Verify Vehicle for Accessories Compatibility | Browse |
| 6.6 | View Accessories Installation Information | Browse |
| 6.8 | View Installation/Labor Pricing | Browse |
| 6.9 | View and select Dealership (PDP) | Browse |
| 6.10 | Select Product Fulfillment Option and add to cart | Browse |
| 6.14 | Notify Me upon availability | Browse |
| 6.15 | View Marketing content (PDP) | Browse |
| 7.1 | View stock availability/fulfillment ETA — PDC ship | Browse |
| 7.2 | View stock availability/fulfillment ETA — Supplier ship | Browse |
| 7.3 | View stock availability/pick-up ETA — Dealer | Browse |
| 9.3 | Modify product fulfillment option in cart | Buy |
| 9.6 | Modify dealership in the cart | Buy |
| 11.11 | Schedule dealer installation (checkout) | Buy |
| 13.8 | Initiate order cancellation | Manage |
| 3.3 | View and modify Preferred Dealer (account) | Sign-In/Register |
| 30.19 | OneTrust Integration (cookie consent banner) | Technical |

---

## Existing Codebase State

### Design System
- Tokens defined in `styles/styles.css` (brand, neutral, status colors, spacing, typography, grid)
- Grid: 4-col mobile (16px gutters), 12-col desktop (24px gutters)
- Breakpoints: 768px (checkout), 900px (PDP/header/PLP)
- Fonts: Roboto (body), Roboto Condensed (headlines); Adobe Clean (display)

### Existing Blocks Available for Reuse/Extension
- `blocks/product-details/` — PDP block with storefront-pdp dropin
- `blocks/product-list-page/` — PLP + search block with storefront-product-discovery dropin
- `blocks/commerce-cart/` — Cart block with storefront-cart dropin
- `blocks/commerce-checkout/` — Full checkout block (fragments.js, containers.js, constants.js)
- `blocks/commerce-mini-cart/` — Mini-cart block
- `blocks/header/` — Header with auth, search, mini-cart, wishlist
- `blocks/commerce-orders-list/` — Orders list with storefront-account dropin
- `blocks/commerce-account-sidebar/` — Account sidebar navigation
- `blocks/modal/` — Reusable modal block

### Drop-ins Available
- `storefront-pdp` — ProductHeader, ProductPrice, ProductGallery, ProductOptions, ProductQuantity, ProductDescription, ProductAttributes, ProductShortDescription
- `storefront-product-discovery` — SearchResults, Facets, SortBy, Pagination
- `storefront-cart` — cart state, addProductsToCart, updateProductsFromCart
- `storefront-checkout` — full checkout flow containers
- `storefront-account` — OrdersList, customer details, addresses
- `storefront-auth` — login, register, password flows

---

## Clarifying Questions — ANSWERED ✅

### Q1 — Vehicle Selector Data Source ✅
**Answer:** Vehicle data comes from PIM, stored in Adobe Commerce as product metadata/attributes. Compatible vehicle information is part of each product's metadata. Available via Commerce GraphQL/Catalog Service.

### Q2 — Dealer Data Source ✅
**Answer:** REST/GraphQL API from the data platform will be used to fetch dealer information.

### Q3 — Fulfillment Option Persistence ✅
**Answer:** Commerce cart item custom attribute.

### Q4 — Checkout Scheduling Embed ✅
**Answer:** A new **custom drop-in built from scratch** (not an iframe, not a redirect).

### Q5 — OneTrust / Cookie Banner ✅
**Answer:** Cookie banner will be served as an **AEM fragment URL (pre-built HTML)** — same pattern as header/footer fragments.

### Q6 — Main Site Header/Footer ✅
**Answer:** Header/footer provided as AEM fragment URL from the same AEM instance.

### Q7 — Sprint Priority
**Answer:** Not explicitly provided — to be confirmed in Phase 3.

### Q8 — Commerce Offering ✅
**Answer:** **Adobe Commerce as a Cloud Service (ACCS / SaaS)**.

---

## Phase 1: Complete ✅
Date: 2026-03-19

## Phase 2: Architectural Plan Presented
Date: 2026-03-19
Status: Approved ✅

## Phase 3: Implementation Approach Selected
Approach: Option A — Detailed file-by-file implementation plan
Selection Date: 2026-03-19
