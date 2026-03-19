import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('order-confirmation-enhanced')) {
    block.remove();
    return;
  }

  // Fulfillment badges are now injected via the OrderProductList Footer slot
  // in commerce-order-product-list.js. This block shows the summary section only.

  const dealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
  const schedule = JSON.parse(sessionStorage.getItem('selected-schedule') || 'null');
  const vehicle = JSON.parse(sessionStorage.getItem('selected-vehicle') || 'null');
  const globalFulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';

  let itemFulfillments = {};
  try {
    itemFulfillments = JSON.parse(sessionStorage.getItem('cart-item-fulfillments') || '{}');
  } catch { /* ignore */ }

  const hasPickupOrInstall = Object.values(itemFulfillments).some((f) => f === 'pickup' || f === 'installation')
    || globalFulfillment === 'pickup' || globalFulfillment === 'installation';

  // Only show summary if there's dealer/schedule/vehicle info to display
  let vehicleHtml = '';
  if (vehicle) {
    const vName = vehicle.vin
      ? `VIN: ${vehicle.vin}`
      : `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
    vehicleHtml = `
      <div class="oce__summary-row">
        <span class="oce__summary-label">Vehicle</span>
        <span class="oce__summary-value">${vName}</span>
      </div>
    `;
  }

  let dealerHtml = '';
  if (hasPickupOrInstall && dealer) {
    dealerHtml = `
      <div class="oce__summary-row">
        <span class="oce__summary-label">Dealer</span>
        <div class="oce__summary-dealer">
          <strong>${dealer.name}</strong>
          <span>${dealer.address}</span>
          <span>${dealer.phone}</span>
        </div>
      </div>
    `;
  }

  let scheduleHtml = '';
  if (schedule) {
    scheduleHtml = `
      <div class="oce__summary-row">
        <span class="oce__summary-label">Appointment</span>
        <span class="oce__summary-appointment">${schedule.dateFormatted} at ${schedule.time}</span>
      </div>
    `;
  }

  if (!vehicleHtml && !dealerHtml && !scheduleHtml) {
    block.remove();
    return;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="oce__wrapper">
      <h3 class="oce__section-title">Order Details</h3>
      <div class="oce__summary">
        ${vehicleHtml}
        ${dealerHtml}
        ${scheduleHtml}
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(fragment);
}
