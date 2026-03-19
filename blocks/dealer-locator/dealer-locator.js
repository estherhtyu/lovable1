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
      <h3 class="dealer-locator__title">Find a Dealer</h3>
      <div class="dealer-locator__search">
        <input type="text" class="dealer-locator__input" placeholder="Enter ZIP code" maxlength="5" />
        <button class="dealer-locator__search-btn">Search</button>
      </div>
      <div class="dealer-locator__results"></div>
    </div>
  `);

  const $input = fragment.querySelector('.dealer-locator__input');
  const $searchBtn = fragment.querySelector('.dealer-locator__search-btn');
  const $results = fragment.querySelector('.dealer-locator__results');

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
        sessionStorage.setItem('selected-dealer', JSON.stringify(dealer));
        document.dispatchEvent(new CustomEvent('dealer:selected', { detail: dealer }));
        renderDealers(dealers, dealer.id);
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

  $searchBtn.addEventListener('click', handleSearch);
  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Restore existing selection
  const existing = sessionStorage.getItem('selected-dealer');
  if (existing) {
    try {
      const selected = JSON.parse(existing);
      const dealers = await loadDealers();
      renderDealers(dealers, selected.id);
    } catch { /* ignore */ }
  }

  block.textContent = '';
  block.append(fragment);
}
