import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('order-confirmation-enhanced')) {
    block.remove();
    return;
  }

  const fulfillment = sessionStorage.getItem('selected-fulfillment') || 'ship';
  const dealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
  const schedule = JSON.parse(sessionStorage.getItem('selected-schedule') || 'null');
  const vehicle = JSON.parse(sessionStorage.getItem('selected-vehicle') || 'null');

  const fulfillmentIcons = { ship: '\u{1F4E6}', pickup: '\u{1F3EA}', installation: '\u{1F527}' };
  const fulfillmentLabels = { ship: 'Shipping to your address', pickup: 'Pick up at dealer', installation: 'Dealer Installation' };

  let itemsHtml = '';

  // Mock order items with fulfillment info
  if (fulfillment === 'ship') {
    itemsHtml = `
      <div class="oce__item" data-fulfillment="ship">
        <span class="oce__item-icon">${fulfillmentIcons.ship}</span>
        <div class="oce__item-details">
          <p class="oce__item-method">${fulfillmentLabels.ship}</p>
          <p class="oce__item-eta">Estimated delivery: 5-7 business days</p>
          <p class="oce__item-note">You will receive a shipping confirmation email with tracking details.</p>
        </div>
      </div>
    `;
  } else if (fulfillment === 'pickup' && dealer) {
    itemsHtml = `
      <div class="oce__item" data-fulfillment="pickup">
        <span class="oce__item-icon">${fulfillmentIcons.pickup}</span>
        <div class="oce__item-details">
          <p class="oce__item-method">${fulfillmentLabels.pickup}</p>
          <p class="oce__item-dealer"><strong>${dealer.name}</strong></p>
          <p class="oce__item-address">${dealer.address}</p>
          <p class="oce__item-eta">Estimated ready: 3-5 business days</p>
          <p class="oce__item-note">You will receive an email when your order is ready for pickup.</p>
        </div>
      </div>
    `;
  } else if (fulfillment === 'installation' && dealer) {
    itemsHtml = `
      <div class="oce__item" data-fulfillment="installation">
        <span class="oce__item-icon">${fulfillmentIcons.installation}</span>
        <div class="oce__item-details">
          <p class="oce__item-method">${fulfillmentLabels.installation}</p>
          <p class="oce__item-dealer"><strong>${dealer.name}</strong></p>
          <p class="oce__item-address">${dealer.address}</p>
          ${schedule ? `<p class="oce__item-appointment">Appointment: ${schedule.dateFormatted} at ${schedule.time}</p>` : ''}
          <p class="oce__item-note">Please arrive 10 minutes before your scheduled appointment.</p>
        </div>
      </div>
    `;
  }

  // Build next steps based on fulfillment
  const nextSteps = ['A confirmation email has been sent to your email address.'];
  if (fulfillment === 'ship') {
    nextSteps.push('You will receive a shipping notification with tracking when your items ship.');
  } else if (fulfillment === 'pickup') {
    nextSteps.push('You will receive an email when your order is ready for pickup.');
    nextSteps.push(`Please bring a valid photo ID when picking up at ${dealer?.name || 'the dealer'}.`);
  } else if (fulfillment === 'installation') {
    nextSteps.push(`Your installation is ${schedule ? `scheduled for ${schedule.dateFormatted} at ${schedule.time}` : 'pending scheduling'}.`);
    nextSteps.push('Please arrive 10 minutes before your scheduled appointment.');
    if (dealer) nextSteps.push(`Dealer contact: ${dealer.phone}`);
  }

  if (vehicle) {
    const vName = vehicle.vin ? `VIN: ${vehicle.vin}` : `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
    nextSteps.push(`Vehicle: ${vName}`);
  }

  const stepsHtml = nextSteps.map((s) => `<li>${s}</li>`).join('');

  const fragment = document.createRange().createContextualFragment(`
    <div class="oce__wrapper">
      <div class="oce__fulfillment">
        <h3 class="oce__section-title">Fulfillment Details</h3>
        ${itemsHtml}
      </div>
      <div class="oce__next-steps">
        <h3 class="oce__section-title">Next Steps</h3>
        <ul class="oce__steps-list">${stepsHtml}</ul>
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(fragment);
}
