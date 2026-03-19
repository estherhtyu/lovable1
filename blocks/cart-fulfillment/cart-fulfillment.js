import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('checkout-fulfillment-summary')) {
    block.remove();
    return;
  }

  // Mock cart items — in real implementation, read from cart dropin events
  const mockCartItems = [
    { id: 'item-1', name: 'All-Weather Floor Mats', sku: 'AWF-001', price: '$124.99', image: '' },
    { id: 'item-2', name: 'Roof Rack Cross Bars', sku: 'RRC-002', price: '$349.99', image: '' },
  ];

  const fulfillmentOptions = [
    { id: 'ship', icon: '\u{1F4E6}', label: 'Ship to Address', eta: '5-7 days' },
    { id: 'pickup', icon: '\u{1F3EA}', label: 'Pick Up at Dealer', eta: '3-5 days' },
    { id: 'installation', icon: '\u{1F527}', label: 'Dealer Installation', eta: '7-14 days' },
  ];

  // Load per-item fulfillment from sessionStorage or default
  const globalFulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';
  let itemFulfillments = {};
  try {
    itemFulfillments = JSON.parse(sessionStorage.getItem('cart-item-fulfillments') || '{}');
  } catch { /* ignore */ }

  // Default each item to global fulfillment if not set
  mockCartItems.forEach((item) => {
    if (!itemFulfillments[item.id]) {
      itemFulfillments[item.id] = globalFulfillment;
    }
  });

  const dealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');

  function saveFulfillments() {
    sessionStorage.setItem('cart-item-fulfillments', JSON.stringify(itemFulfillments));
  }

  function buildItemRow(item) {
    const currentOption = itemFulfillments[item.id] || 'ship';
    const row = document.createElement('div');
    row.className = 'cart-fulfillment__item';
    row.dataset.itemId = item.id;

    const optionsHtml = fulfillmentOptions.map((opt) => {
      const isActive = opt.id === currentOption;
      return `
        <button class="cart-fulfillment__option${isActive ? ' cart-fulfillment__option--active' : ''}" data-option="${opt.id}">
          <span class="cart-fulfillment__option-icon">${opt.icon}</span>
          <span class="cart-fulfillment__option-label">${opt.label}</span>
          <span class="cart-fulfillment__option-eta">${opt.eta}</span>
        </button>
      `;
    }).join('');

    const needsDealer = currentOption === 'pickup' || currentOption === 'installation';

    row.innerHTML = `
      <div class="cart-fulfillment__item-header">
        <strong class="cart-fulfillment__item-name">${item.name}</strong>
        <span class="cart-fulfillment__item-price">${item.price}</span>
      </div>
      <div class="cart-fulfillment__options">${optionsHtml}</div>
      <div class="cart-fulfillment__item-dealer" ${needsDealer && dealer ? '' : 'hidden'}>
        <span class="cart-fulfillment__item-dealer-label">Dealer:</span>
        <strong>${dealer?.name || ''}</strong>
        <span>${dealer?.address || ''}</span>
        <button class="cart-fulfillment__change-dealer">Change</button>
      </div>
    `;

    // Option click handlers
    row.querySelectorAll('.cart-fulfillment__option').forEach((btn) => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.cart-fulfillment__option').forEach((b) => b.classList.remove('cart-fulfillment__option--active'));
        btn.classList.add('cart-fulfillment__option--active');
        itemFulfillments[item.id] = btn.dataset.option;
        saveFulfillments();

        // Show/hide dealer info
        const dealerSection = row.querySelector('.cart-fulfillment__item-dealer');
        const needsDealerNow = btn.dataset.option === 'pickup' || btn.dataset.option === 'installation';
        dealerSection.hidden = !(needsDealerNow && dealer);

        document.dispatchEvent(new CustomEvent('fulfillment:changed', {
          detail: { option: btn.dataset.option, itemId: item.id },
        }));
      });
    });

    // Change dealer button — dispatch event to open dealer locator
    const changeDealerBtn = row.querySelector('.cart-fulfillment__change-dealer');
    if (changeDealerBtn) {
      changeDealerBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('dealer:change-requested', { detail: { itemId: item.id } }));
      });
    }

    return row;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="cart-fulfillment__wrapper">
      <h3 class="cart-fulfillment__title">Fulfillment Options</h3>
      <p class="cart-fulfillment__subtitle">Choose how you'd like to receive each item (Req 9.3)</p>
      <div class="cart-fulfillment__items"></div>
    </div>
  `);

  const $items = fragment.querySelector('.cart-fulfillment__items');

  mockCartItems.forEach((item) => {
    $items.append(buildItemRow(item));
  });

  saveFulfillments();

  // Listen for dealer changes and update display
  document.addEventListener('dealer:selected', (e) => {
    block.querySelectorAll('.cart-fulfillment__item-dealer strong').forEach((el) => {
      el.textContent = e.detail.name;
    });
    block.querySelectorAll('.cart-fulfillment__item-dealer span:not(.cart-fulfillment__item-dealer-label)').forEach((el) => {
      if (!el.classList.contains('cart-fulfillment__item-dealer-label')) {
        el.textContent = e.detail.address;
      }
    });
  });

  block.textContent = '';
  block.append(fragment);
}
