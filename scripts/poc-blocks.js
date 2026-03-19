/**
 * POC Block Injector
 * Dynamically injects automotive-specific blocks into existing pages
 * based on page type detection. All blocks are feature-flagged.
 *
 * Correct flow per requirements:
 *   PDP: Vehicle Fitment → Fulfillment Options → Dealer Locator (if pickup/install) → Add to Cart
 *   Cart: Modify fulfillment per line item, modify dealer per line item
 *   Checkout: Schedule installation (dealer-scheduling modal) → Payment → Confirmation
 */
import { isFeatureEnabled } from './features.js';
import { buildBlock, decorateBlock, loadBlock } from './aem.js';

/**
 * Creates a section wrapper with a block inside and appends to main
 */
function injectBlock(main, blockName, content = [['']], position = 'append', reference = null) {
  const block = buildBlock(blockName, content);
  const section = document.createElement('div');
  section.classList.add('section');
  section.dataset.sectionStatus = 'initialized';
  const wrapper = document.createElement('div');
  wrapper.append(block);
  section.append(wrapper);

  if (position === 'before' && reference) {
    reference.before(section);
  } else if (position === 'after' && reference) {
    reference.after(section);
  } else {
    main.append(section);
  }

  decorateBlock(block);
  return { section, block };
}

/**
 * Inject blocks into the Home page
 */
async function injectHomePageBlocks(main) {
  const hero = main.querySelector('.hero');
  const lastSection = main.querySelector('.section:last-of-type');

  if (await isFeatureEnabled('landing-page-categories')) {
    const categories = buildBlock('category-cards', [
      ['Exterior Accessories', '<a href="/apparel">Exterior Accessories</a>'],
      ['Interior Accessories', '<a href="/apparel">Interior Accessories</a>'],
      ['Performance Parts', '<a href="/apparel">Performance Parts</a>'],
      ['EV Charging', '<a href="/apparel">EV Charging</a>'],
    ]);
    const section = document.createElement('div');
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    const wrapper = document.createElement('div');
    wrapper.append(categories);
    section.append(wrapper);
    const heroSection = hero?.closest('.section');
    if (heroSection) heroSection.after(section);
    else main.prepend(section);
    decorateBlock(categories);
    await loadBlock(categories);
  }

  if (await isFeatureEnabled('landing-page-promotions')) {
    const { block } = injectBlock(main, 'promo-banner', [
      ['Spring Sale', '<h2>Spring Sale</h2><p>Save up to 20% on select accessories. Limited time.</p><p><a href="/apparel">Shop the Sale</a></p>'],
    ], 'before', lastSection);
    await loadBlock(block);
  }

  if (await isFeatureEnabled('contact-support')) {
    const { block } = injectBlock(main, 'contact-support', [['']]);
    await loadBlock(block);
  }

  if (await isFeatureEnabled('cookie-consent')) {
    const { block } = injectBlock(main, 'cookie-consent', [['']]);
    await loadBlock(block);
  }
}

/**
 * Inject blocks into the PLP (Category) page
 */
async function injectCategoryPageBlocks(main) {
  const plp = main.querySelector('.product-list-page');
  const plpSection = plp?.closest('.section');

  if (await isFeatureEnabled('vehicle-fitment') && plpSection) {
    const { block } = injectBlock(main, 'vehicle-fitment', [['']], 'before', plpSection);
    await loadBlock(block);
  }
}

/**
 * Inject blocks into the PDP (Product) page
 * Flow: Vehicle Fitment → Stock → Fulfillment Options → Dealer Locator → Installation Info → Notify Me
 */
async function injectProductPageBlocks(main) {
  const pdp = main.querySelector('.product-details');
  const pdpSection = pdp?.closest('.section');
  if (!pdpSection) return;

  // 1. Vehicle fitment before PDP
  if (await isFeatureEnabled('vehicle-fitment')) {
    const { block } = injectBlock(main, 'vehicle-fitment', [['']], 'before', pdpSection);
    await loadBlock(block);
  }

  // 2. Stock availability after PDP
  if (await isFeatureEnabled('stock-availability')) {
    const { block } = injectBlock(main, 'stock-availability', [['']], 'after', pdpSection);
    await loadBlock(block);
  }

  // 3. Fulfillment options (Ship / Pickup / Installation) — select before add to cart
  if (await isFeatureEnabled('fulfillment-options')) {
    const { block } = injectBlock(main, 'fulfillment-options', [['']]);
    await loadBlock(block);
  }

  // 4. Dealer locator — shown when Pickup or Installation selected (Req 5.4, 6.9)
  if (await isFeatureEnabled('dealer-locator')) {
    const { block } = injectBlock(main, 'dealer-locator', [['']]);
    await loadBlock(block);
  }

  // 5. Installation info (difficulty, price, iSheets)
  if (await isFeatureEnabled('installation-info')) {
    const { block } = injectBlock(main, 'installation-info', [['']]);
    await loadBlock(block);
  }

  // 6. Notify me (only visible when out of stock)
  if (await isFeatureEnabled('notify-me')) {
    const { block } = injectBlock(main, 'notify-me', [['']]);
    await loadBlock(block);
  }

  // NOTE: dealer-scheduling is NOT on PDP — it's on checkout only (Req 11.11)
}

/**
 * Cart page — fulfillment options are injected inline per line item
 * via the commerce-cart Footer slot (see commerce-cart.js).
 * No separate block injection needed.
 */
async function injectCartPageBlocks() {
  // Fulfillment is handled inline in commerce-cart Footer slot (Req 9.3, 9.6)
}

/**
 * Inject blocks into the Checkout page
 * Flow: Fulfillment summary → Dealer scheduling modal (if installation) → Payment
 */
async function injectCheckoutPageBlocks(main) {
  const checkout = main.querySelector('.commerce-checkout');
  const checkoutSection = checkout?.closest('.section');
  if (!checkoutSection) return;

  // Fulfillment summary before checkout form
  if (await isFeatureEnabled('checkout-fulfillment-summary')) {
    const { block } = injectBlock(main, 'checkout-fulfillment', [['']], 'before', checkoutSection);
    await loadBlock(block);
  }

  // Dealer scheduling — only for installation items, renders as modal trigger (Req 11.11)
  if (await isFeatureEnabled('dealer-scheduling')) {
    const { block } = injectBlock(main, 'dealer-scheduling', [['']], 'before', checkoutSection);
    await loadBlock(block);
  }
}

/**
 * Inject blocks into order/account pages.
 * Order-details uses a columns template: main > div (sidebar) + div (content).
 * Blocks inside content column are direct children: div.commerce-order-header, etc.
 * We inject new block wrappers as siblings inside the content column div.
 */
async function injectAccountPageBlocks(main) {
  const path = window.location.pathname;
  const isOrderDetails = path.includes('order-details');

  if (isOrderDetails) {
    // After decorateSections + loadSections, the structure is:
    //   main > div.section > div (wrapper) > div.commerce-order-header
    // Find the section containing order blocks (not the sidebar section)
    const orderHeader = main.querySelector('.commerce-order-header');
    // Go up: orderHeader -> wrapper div -> section div
    const contentSection = orderHeader?.closest('.section');

    if (contentSection) {
      if (await isFeatureEnabled('order-confirmation-enhanced')) {
        // Find the wrapper containing order-product-list or order-returns
        const target = contentSection.querySelector('.commerce-order-returns')
          || contentSection.querySelector('.commerce-order-product-list');
        const targetWrapper = target?.parentElement;

        const oceBlock = buildBlock('order-confirmation-enhanced', [['']]);
        const newWrapper = document.createElement('div');
        newWrapper.append(oceBlock);

        if (targetWrapper && targetWrapper !== contentSection) {
          targetWrapper.after(newWrapper);
        } else {
          contentSection.append(newWrapper);
        }
        decorateBlock(oceBlock);
        await loadBlock(oceBlock);
      }

      if (await isFeatureEnabled('order-cancellation')) {
        const headerWrapper = orderHeader.parentElement;
        const cancelBlock = buildBlock('order-cancellation', [['']]);
        const newWrapper = document.createElement('div');
        newWrapper.append(cancelBlock);

        if (headerWrapper && headerWrapper !== contentSection) {
          headerWrapper.after(newWrapper);
        } else {
          contentSection.prepend(newWrapper);
        }
        decorateBlock(cancelBlock);
        await loadBlock(cancelBlock);
      }
    } else {
      // Fallback: sections may not have .section class yet in some edge cases
      // Just append to main
      console.warn('[POC] Could not find content section for order-details, appending to main');
      if (await isFeatureEnabled('order-confirmation-enhanced')) {
        const { block } = injectBlock(main, 'order-confirmation-enhanced', [['']]);
        await loadBlock(block);
      }
      if (await isFeatureEnabled('order-cancellation')) {
        const { block } = injectBlock(main, 'order-cancellation', [['']]);
        await loadBlock(block);
      }
    }
  }

  if (window.location.pathname.includes('create-return') && await isFeatureEnabled('custom-returns')) {
    const { block } = injectBlock(main, 'return-flow', [['']]);
    await loadBlock(block);
  }
}

/**
 * Main entry point — called after page loads
 */
export async function injectPocBlocks(main) {
  if (!main) return;

  const pageType = detectCurrentPageType(main);
  console.log('[POC] pageType:', pageType, '| path:', window.location.pathname);
  console.log('[POC] sections found:', main.querySelectorAll('.section').length);
  console.log('[POC] order-header found:', !!main.querySelector('.commerce-order-header'));

  switch (pageType) {
    case 'Home':
      await injectHomePageBlocks(main);
      break;
    case 'Category':
      await injectCategoryPageBlocks(main);
      break;
    case 'Product':
      await injectProductPageBlocks(main);
      break;
    case 'Cart':
      await injectCartPageBlocks(main);
      break;
    case 'Checkout':
      await injectCheckoutPageBlocks(main);
      break;
    case 'Account':
      await injectAccountPageBlocks(main);
      break;
    default:
      break;
  }
}

function detectCurrentPageType(main) {
  if (main.querySelector('.product-details')) return 'Product';
  if (main.querySelector('.product-list-page')) return 'Category';
  if (main.querySelector('.commerce-cart')) return 'Cart';
  if (main.querySelector('.commerce-checkout')) return 'Checkout';
  if (main.querySelector('.commerce-order-header') || main.querySelector('.commerce-order-status')) return 'Account';
  if (main.querySelector('.commerce-account-sidebar') || window.location.pathname.includes('/customer/')) return 'Account';
  if (window.location.pathname.includes('order-details') || window.location.pathname.includes('create-return')) return 'Account';
  if (main.querySelector('.hero') && window.location.pathname === '/') return 'Home';
  return 'CMS';
}
