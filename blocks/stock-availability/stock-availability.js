import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('stock-availability')) {
    block.remove();
    return;
  }

  let stockData = null;

  async function loadStock() {
    if (stockData) return stockData;
    const resp = await fetch('/mock-data/stock.json');
    stockData = await resp.json();
    return stockData;
  }

  const data = await loadStock();

  // Try to get SKU from URL or page metadata
  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get('sku') || 'default';
  const stock = data[sku] || data.default;

  const statusLabels = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    backorder: 'Backorder',
    out_of_stock: 'Out of Stock',
  };

  const statusClass = stock.status.replace('_', '-');
  const fulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';

  function getEta(f) {
    if (f === 'pickup') return stock.pickup_eta;
    if (f === 'installation') return stock.install_eta;
    return stock.ship_eta;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="stock-availability__wrapper">
      <div class="stock-availability__badge stock-availability__badge--${statusClass}">
        <span class="stock-availability__dot"></span>
        <span class="stock-availability__status">${statusLabels[stock.status]}</span>
      </div>
      <div class="stock-availability__eta">${getEta(fulfillment) || ''}</div>
      ${stock.status === 'low_stock' ? `<div class="stock-availability__qty">Only ${stock.qty} left</div>` : ''}
    </div>
  `);

  const $eta = fragment.querySelector('.stock-availability__eta');

  // Listen for fulfillment changes
  document.addEventListener('fulfillment:changed', (e) => {
    const eta = getEta(e.detail.option);
    $eta.textContent = eta || '';
  });

  // Dispatch stock status for notify-me block
  document.dispatchEvent(new CustomEvent('stock:status', { detail: { status: stock.status, sku } }));

  block.textContent = '';
  block.append(fragment);
}
