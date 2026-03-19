import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('fulfillment-options')) {
    block.remove();
    return;
  }

  const options = [
    { id: 'ship', icon: '\u{1F4E6}', label: 'Ship to Address', eta: 'Ships in 5-7 business days', desc: 'Free shipping on orders over $75' },
    { id: 'pickup', icon: '\u{1F3EA}', label: 'Pick Up at Dealer', eta: 'Ready in 3-5 business days', desc: 'Free pickup at your selected dealer' },
    { id: 'installation', icon: '\u{1F527}', label: 'Dealer Installation', eta: 'Schedule within 7-14 days', desc: 'Professional installation at your dealer' },
  ];

  const existing = sessionStorage.getItem('selected-fulfillment') || 'ship';

  const fragment = document.createRange().createContextualFragment(`
    <div class="fulfillment-options__wrapper">
      <h3 class="fulfillment-options__title">Choose Fulfillment</h3>
      <div class="fulfillment-options__cards"></div>
      <div class="fulfillment-options__message" hidden></div>
    </div>
  `);

  const $cards = fragment.querySelector('.fulfillment-options__cards');
  const $message = fragment.querySelector('.fulfillment-options__message');

  function updateMessage(optionId) {
    if (optionId === 'pickup') {
      $message.textContent = 'Please select a dealer below for pickup.';
      $message.hidden = false;
    } else if (optionId === 'installation') {
      $message.textContent = 'Please select a dealer below, then choose an appointment time.';
      $message.hidden = false;
    } else {
      $message.hidden = true;
    }
  }

  options.forEach((opt) => {
    const card = document.createElement('div');
    const isActive = opt.id === existing;
    card.className = `fulfillment-options__card${isActive ? ' fulfillment-options__card--selected' : ''}`;
    card.dataset.option = opt.id;
    card.innerHTML = `
      <div class="fulfillment-options__radio"><span class="fulfillment-options__radio-dot"></span></div>
      <div class="fulfillment-options__icon">${opt.icon}</div>
      <div class="fulfillment-options__details">
        <div class="fulfillment-options__label">${opt.label}</div>
        <div class="fulfillment-options__desc">${opt.desc}</div>
        <div class="fulfillment-options__eta">${opt.eta}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      $cards.querySelectorAll('.fulfillment-options__card').forEach((c) => c.classList.remove('fulfillment-options__card--selected'));
      card.classList.add('fulfillment-options__card--selected');
      sessionStorage.setItem('selected-fulfillment', opt.id);
      updateMessage(opt.id);
      document.dispatchEvent(new CustomEvent('fulfillment:changed', { detail: { option: opt.id } }));
    });

    $cards.append(card);
  });

  updateMessage(existing);

  block.textContent = '';
  block.append(fragment);
}
