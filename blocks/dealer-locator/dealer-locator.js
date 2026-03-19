import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('dealer-locator')) {
    block.remove();
    return;
  }

  let dealerData = null;

  async function loadDealers() {
    if (dealerData) return dealerData;
    const resp = await fetch('/mock-data/dealers.json');
    dealerData = await resp.json();
    return dealerData;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="dealer-locator__wrapper">
      <div class="dealer-locator__header">
        <h3 class="dealer-locator__title">Your Dealer</h3>
        <button class="dealer-locator__toggle">Change Dealer</button>
      </div>
      <div class="dealer-locator__selected-summary" hidden>
        <span class="dealer-locator__selected-icon">&#10003;</span>
        <div class="dealer-locator__selected-info">
          <strong class="dealer-locator__selected-name"></strong>
          <span class="dealer-locator__selected-address"></span>
        </div>
      </div>
      <div class="dealer-locator__expandable" hidden>
        <div class="dealer-locator__search">
          <input type="text" class="dealer-locator__input" placeholder="Enter ZIP code" maxlength="5" />
          <button class="dealer-locator__search-btn">Search</button>
        </div>
        <div class="dealer-locator__results"></div>
      </div>
    </div>
  `);

  const $wrapper = fragment.querySelector('.dealer-locator__wrapper');
  const $toggle = fragment.querySelector('.dealer-locator__toggle');
  const $summary = fragment.querySelector('.dealer-locator__selected-summary');
  const $selectedName = fragment.querySelector('.dealer-locator__selected-name');
  const $selectedAddress = fragment.querySelector('.dealer-locator__selected-address');
  const $expandable = fragment.querySelector('.dealer-locator__expandable');
  const $input = fragment.querySelector('.dealer-locator__input');
  const $searchBtn = fragment.querySelector('.dealer-locator__search-btn');
  const $results = fragment.querySelector('.dealer-locator__results');

  function collapse(dealer) {
    $summary.hidden = false;
    $selectedName.textContent = dealer.name;
    $selectedAddress.textContent = dealer.address;
    $expandable.hidden = true;
    $toggle.textContent = 'Change Dealer';
  }

  function expand() {
    $expandable.hidden = false;
    $toggle.textContent = 'Cancel';
  }

  function selectDealer(dealer, dealers) {
    sessionStorage.setItem('selected-dealer', JSON.stringify(dealer));
    document.dispatchEvent(new CustomEvent('dealer:selected', { detail: dealer }));
    renderDealers(dealers, dealer.id);
    collapse(dealer);
  }

  function renderDealers(dealers, selectedId) {
    $results.innerHTML = '';
    dealers.forEach((dealer) => {
      const isSelected = dealer.id === selectedId;
      const card = document.createElement('div');
      card.className = `dealer-locator__card${isSelected ? ' dealer-locator__card--selected' : ''}`;
      card.dataset.dealerId = dealer.id;
      card.innerHTML = `
        <div class="dealer-locator__card-header">
          <h4 class="dealer-locator__name">${dealer.name}</h4>
          <span class="dealer-locator__distance">${dealer.distance}</span>
        </div>
        <p class="dealer-locator__address">${dealer.address}</p>
        <p class="dealer-locator__phone">${dealer.phone}</p>
        <p class="dealer-locator__hours">${dealer.hours}</p>
        <div class="dealer-locator__services">
          ${dealer.services.map((s) => `<span class="dealer-locator__badge">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`).join('')}
        </div>
        <button class="dealer-locator__select-btn">${isSelected ? '&#10003; Selected' : 'Select This Dealer'}</button>
      `;

      card.querySelector('.dealer-locator__select-btn').addEventListener('click', () => {
        selectDealer(dealer, dealers);
      });

      $results.append(card);
    });
  }

  async function handleSearch() {
    const zip = $input.value.trim();
    if (zip.length < 5) return;
    const dealers = await loadDealers();
    renderDealers(dealers);
  }

  // Toggle expand/collapse
  $toggle.addEventListener('click', () => {
    if ($expandable.hidden) {
      expand();
    } else {
      // Cancel — re-collapse with current selection
      const current = sessionStorage.getItem('selected-dealer');
      if (current) {
        collapse(JSON.parse(current));
      } else {
        $expandable.hidden = true;
        $toggle.textContent = 'Change Dealer';
      }
    }
  });

  $searchBtn.addEventListener('click', handleSearch);
  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Initialize: load dealers and set default (first dealer = user's preferred dealer)
  const dealers = await loadDealers();
  const existing = sessionStorage.getItem('selected-dealer');

  if (existing) {
    // Restore previously selected dealer
    try {
      collapse(JSON.parse(existing));
    } catch { /* ignore */ }
  } else if (dealers.length > 0) {
    // Default to user's preferred dealer (first in list for POC)
    const defaultDealer = dealers[0];
    sessionStorage.setItem('selected-dealer', JSON.stringify(defaultDealer));
    document.dispatchEvent(new CustomEvent('dealer:selected', { detail: defaultDealer }));
    collapse(defaultDealer);
  }

  block.textContent = '';
  block.append(fragment);

  // Show/hide based on fulfillment selection (Req 5.4, 6.9)
  const currentFulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';
  if (currentFulfillment === 'ship') {
    block.closest('.section').hidden = true;
  }

  document.addEventListener('fulfillment:changed', (e) => {
    const section = block.closest('.section');
    if (!section) return;
    section.hidden = e.detail.option === 'ship';
  });
}
