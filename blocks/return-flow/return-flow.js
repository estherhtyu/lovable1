import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('custom-returns')) {
    block.remove();
    return;
  }

  // Mock order items
  const orderItems = [
    { id: 'item-1', name: 'All-Weather Floor Mats', sku: 'AWF-001', price: '$124.99', qty: 1 },
    { id: 'item-2', name: 'Roof Rack Cross Bars', sku: 'RRC-002', price: '$349.99', qty: 1 },
    { id: 'item-3', name: 'Cargo Liner', sku: 'CGL-003', price: '$89.99', qty: 1 },
  ];

  const returnReasons = [
    'Defective or damaged',
    'Wrong item received',
    'No longer needed',
    'Better price found',
    'Does not fit my vehicle',
    'Quality not as expected',
    'Other',
  ];

  let currentStep = 1;
  let selectedItems = [];
  let selectedReasons = {};
  let returnMethod = 'ship';

  const fragment = document.createRange().createContextualFragment(`
    <div class="return-flow__wrapper">
      <div class="return-flow__progress">
        <div class="return-flow__step-indicator return-flow__step-indicator--active" data-step="1">1. Select Items</div>
        <div class="return-flow__step-indicator" data-step="2">2. Reason</div>
        <div class="return-flow__step-indicator" data-step="3">3. Return Method</div>
        <div class="return-flow__step-indicator" data-step="4">4. Review</div>
      </div>

      <div class="return-flow__step return-flow__step--1">
        <h3>Select items to return</h3>
        <div class="return-flow__items"></div>
        <button class="return-flow__next" disabled>Continue</button>
      </div>

      <div class="return-flow__step return-flow__step--2" hidden>
        <h3>Select return reason</h3>
        <div class="return-flow__reasons"></div>
        <div class="return-flow__nav">
          <button class="return-flow__back">Back</button>
          <button class="return-flow__next">Continue</button>
        </div>
      </div>

      <div class="return-flow__step return-flow__step--3" hidden>
        <h3>Select return method</h3>
        <div class="return-flow__methods">
          <div class="return-flow__method return-flow__method--selected" data-method="ship">
            <div class="return-flow__method-radio"><span></span></div>
            <div>
              <strong>Ship it back</strong>
              <p>A prepaid shipping label will be provided. Drop off at any carrier location.</p>
            </div>
          </div>
          <div class="return-flow__method" data-method="dealer">
            <div class="return-flow__method-radio"><span></span></div>
            <div>
              <strong>Drop off at dealer</strong>
              <p>Return the item at your selected dealer location.</p>
            </div>
          </div>
        </div>
        <div class="return-flow__nav">
          <button class="return-flow__back">Back</button>
          <button class="return-flow__next">Continue</button>
        </div>
      </div>

      <div class="return-flow__step return-flow__step--4" hidden>
        <h3>Review your return</h3>
        <div class="return-flow__review"></div>
        <div class="return-flow__nav">
          <button class="return-flow__back">Back</button>
          <button class="return-flow__submit">Submit Return Request</button>
        </div>
      </div>

      <div class="return-flow__confirmation" hidden>
        <div class="return-flow__confirmation-header">
          <span class="return-flow__confirmation-icon">&#10003;</span>
          <h3>Return Request Submitted</h3>
        </div>
        <div class="return-flow__rma">
          <span class="return-flow__rma-label">RMA Number:</span>
          <span class="return-flow__rma-number"></span>
        </div>
        <div class="return-flow__label-section">
          <h4>Shipping Label</h4>
          <div class="return-flow__label-placeholder">
            <p>Your prepaid shipping label is ready. A copy has also been sent to your email.</p>
            <button class="return-flow__download-label">Download Shipping Label</button>
          </div>
        </div>
        <div class="return-flow__timeline">
          <div class="return-flow__timeline-step return-flow__timeline-step--completed">
            <div class="return-flow__timeline-dot"></div>
            <div class="return-flow__timeline-content">
              <div class="return-flow__timeline-title">Request Submitted</div>
              <div class="return-flow__timeline-date">Today</div>
            </div>
          </div>
          <div class="return-flow__timeline-step return-flow__timeline-step--active">
            <div class="return-flow__timeline-dot"></div>
            <div class="return-flow__timeline-content">
              <div class="return-flow__timeline-title">Awaiting Return Shipment</div>
              <div class="return-flow__timeline-date">Ship within 7 days</div>
            </div>
          </div>
          <div class="return-flow__timeline-step">
            <div class="return-flow__timeline-dot"></div>
            <div class="return-flow__timeline-content">
              <div class="return-flow__timeline-title">Return Received</div>
            </div>
          </div>
          <div class="return-flow__timeline-step">
            <div class="return-flow__timeline-dot"></div>
            <div class="return-flow__timeline-content">
              <div class="return-flow__timeline-title">Refund Processed</div>
            </div>
          </div>
        </div>
        <p class="return-flow__policy-note">Return window: 35 days from delivery. Deadline to ship: 7 days after RMA issued.</p>
      </div>
    </div>
  `);

  const $steps = fragment.querySelectorAll('.return-flow__step');
  const $indicators = fragment.querySelectorAll('.return-flow__step-indicator');
  const $confirmation = fragment.querySelector('.return-flow__confirmation');
  const $progress = fragment.querySelector('.return-flow__progress');

  // Step 1: Item selection
  const $itemsContainer = fragment.querySelector('.return-flow__items');
  orderItems.forEach((item) => {
    const el = document.createElement('label');
    el.className = 'return-flow__item';
    el.innerHTML = `
      <input type="checkbox" value="${item.id}" />
      <div class="return-flow__item-info">
        <strong>${item.name}</strong>
        <span>SKU: ${item.sku} | Qty: ${item.qty} | ${item.price}</span>
      </div>
    `;
    $itemsContainer.append(el);
  });

  function showStep(step) {
    currentStep = step;
    $steps.forEach((s, i) => { s.hidden = (i + 1) !== step; });
    $indicators.forEach((ind, i) => {
      ind.classList.toggle('return-flow__step-indicator--active', (i + 1) === step);
      ind.classList.toggle('return-flow__step-indicator--completed', (i + 1) < step);
    });
  }

  // Item checkboxes
  $itemsContainer.addEventListener('change', () => {
    selectedItems = [...$itemsContainer.querySelectorAll('input:checked')].map((cb) => cb.value);
    fragment.querySelector('.return-flow__step--1 .return-flow__next').disabled = selectedItems.length === 0;
  });

  // Step 2: Reasons
  function buildReasons() {
    const $reasons = fragment.querySelector('.return-flow__reasons');
    $reasons.innerHTML = '';
    selectedItems.forEach((itemId) => {
      const item = orderItems.find((i) => i.id === itemId);
      const div = document.createElement('div');
      div.className = 'return-flow__reason-item';
      div.innerHTML = `
        <strong>${item.name}</strong>
        <select data-item-id="${itemId}">
          <option value="">Select a reason...</option>
          ${returnReasons.map((r) => `<option value="${r}">${r}</option>`).join('')}
        </select>
      `;
      $reasons.append(div);
    });
  }

  // Step 3: Return methods
  const $methods = fragment.querySelectorAll('.return-flow__method');
  $methods.forEach((m) => {
    m.addEventListener('click', () => {
      $methods.forEach((mm) => mm.classList.remove('return-flow__method--selected'));
      m.classList.add('return-flow__method--selected');
      returnMethod = m.dataset.method;
    });
  });

  // Step 4: Review
  function buildReview() {
    const $review = fragment.querySelector('.return-flow__review');
    const items = selectedItems.map((id) => {
      const item = orderItems.find((i) => i.id === id);
      return `<li><strong>${item.name}</strong> (${item.price}) — Reason: ${selectedReasons[id] || 'Not specified'}</li>`;
    }).join('');
    $review.innerHTML = `
      <div class="return-flow__review-section">
        <h4>Items</h4>
        <ul>${items}</ul>
      </div>
      <div class="return-flow__review-section">
        <h4>Return Method</h4>
        <p>${returnMethod === 'ship' ? 'Ship it back (prepaid label provided)' : 'Drop off at dealer'}</p>
      </div>
    `;
  }

  // Navigation
  fragment.querySelectorAll('.return-flow__next').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentStep === 1) {
        buildReasons();
        showStep(2);
      } else if (currentStep === 2) {
        const selects = fragment.querySelectorAll('.return-flow__reasons select');
        selectedReasons = {};
        selects.forEach((s) => { selectedReasons[s.dataset.itemId] = s.value; });
        showStep(3);
      } else if (currentStep === 3) {
        buildReview();
        showStep(4);
      }
    });
  });

  fragment.querySelectorAll('.return-flow__back').forEach((btn) => {
    btn.addEventListener('click', () => showStep(currentStep - 1));
  });

  // Submit
  fragment.querySelector('.return-flow__submit').addEventListener('click', () => {
    const rmaNumber = `RMA-${Date.now().toString().slice(-8)}`;
    fragment.querySelector('.return-flow__rma-number').textContent = rmaNumber;
    $steps.forEach((s) => { s.hidden = true; });
    $progress.hidden = true;
    $confirmation.hidden = false;
  });

  // Download label mock
  fragment.querySelector('.return-flow__download-label').addEventListener('click', () => {
    window.alert('Mock: Shipping label download would start here.');
  });

  block.textContent = '';
  block.append(fragment);
}
