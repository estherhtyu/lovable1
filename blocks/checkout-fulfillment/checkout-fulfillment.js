import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('checkout-fulfillment-summary')) {
    block.remove();
    return;
  }

  const fulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';
  const dealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
  const schedule = JSON.parse(sessionStorage.getItem('selected-schedule') || 'null');
  const vehicle = JSON.parse(sessionStorage.getItem('selected-vehicle') || 'null');

  const fulfillmentLabels = {
    ship: { icon: '\u{1F4E6}', label: 'Ship to Address', desc: 'Estimated delivery in 5-7 business days' },
    pickup: { icon: '\u{1F3EA}', label: 'Pick Up at Dealer', desc: 'Ready for pickup in 3-5 business days' },
    installation: { icon: '\u{1F527}', label: 'Dealer Installation', desc: 'Professional installation at your dealer' },
  };

  const info = fulfillmentLabels[fulfillment] || fulfillmentLabels.ship;

  let vehicleHtml = '';
  if (vehicle) {
    const name = vehicle.vin
      ? `VIN: ${vehicle.vin}`
      : `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
    vehicleHtml = `
      <div class="checkout-fulfillment__vehicle">
        <span class="checkout-fulfillment__section-label">Vehicle</span>
        <span class="checkout-fulfillment__vehicle-name">${name}</span>
      </div>
    `;
  }

  let dealerHtml = '';
  if (dealer && (fulfillment === 'pickup' || fulfillment === 'installation')) {
    dealerHtml = `
      <div class="checkout-fulfillment__dealer">
        <span class="checkout-fulfillment__section-label">Dealer</span>
        <div class="checkout-fulfillment__dealer-info">
          <strong>${dealer.name}</strong>
          <span>${dealer.address}</span>
          <span>${dealer.phone}</span>
        </div>
      </div>
    `;
  }

  let scheduleHtml = '';
  if (schedule && fulfillment === 'installation') {
    scheduleHtml = `
      <div class="checkout-fulfillment__schedule">
        <span class="checkout-fulfillment__section-label">Appointment</span>
        <span class="checkout-fulfillment__schedule-time">${schedule.dateFormatted} at ${schedule.time}</span>
      </div>
    `;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="checkout-fulfillment__wrapper">
      <h3 class="checkout-fulfillment__title">Fulfillment Details</h3>
      <div class="checkout-fulfillment__card">
        <div class="checkout-fulfillment__method">
          <span class="checkout-fulfillment__icon">${info.icon}</span>
          <div>
            <div class="checkout-fulfillment__method-label">${info.label}</div>
            <div class="checkout-fulfillment__method-desc">${info.desc}</div>
          </div>
        </div>
        ${vehicleHtml}
        ${dealerHtml}
        ${scheduleHtml}
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(fragment);
}
