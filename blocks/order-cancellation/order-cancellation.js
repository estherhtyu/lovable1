import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('order-cancellation')) {
    block.remove();
    return;
  }

  // Mock: order placed 30 minutes ago, 1 hour cancellation window
  const cancellationWindowMs = 60 * 60 * 1000; // 1 hour
  const orderPlacedTime = Date.now() - (30 * 60 * 1000); // 30 min ago
  const expiresAt = orderPlacedTime + cancellationWindowMs;
  let cancelled = false;

  function getTimeRemaining() {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="order-cancellation__wrapper">
      <div class="order-cancellation__timer">
        <span class="order-cancellation__timer-label">Cancellation window:</span>
        <span class="order-cancellation__timer-value"></span>
      </div>
      <button class="order-cancellation__btn">Cancel Order</button>
      <div class="order-cancellation__modal" hidden>
        <div class="order-cancellation__modal-backdrop"></div>
        <div class="order-cancellation__modal-content">
          <h3 class="order-cancellation__modal-title">Cancel Order?</h3>
          <p class="order-cancellation__modal-text">Are you sure you want to cancel this order? This action cannot be undone. A full refund will be processed to your original payment method within 5-10 business days.</p>
          <div class="order-cancellation__modal-policy">
            <strong>Cancellation Policy:</strong>
            <ul>
              <li>Orders can only be cancelled within 1 hour of placement</li>
              <li>Refunds are processed within 5-10 business days</li>
              <li>Scheduled installation appointments will be automatically cancelled</li>
            </ul>
          </div>
          <div class="order-cancellation__modal-actions">
            <button class="order-cancellation__modal-cancel">Yes, Cancel Order</button>
            <button class="order-cancellation__modal-keep">Keep My Order</button>
          </div>
        </div>
      </div>
      <div class="order-cancellation__cancelled" hidden>
        <span class="order-cancellation__cancelled-icon">&#10003;</span>
        <p>Your order has been cancelled. A refund will be processed within 5-10 business days.</p>
      </div>
    </div>
  `);

  const $timer = fragment.querySelector('.order-cancellation__timer-value');
  const $btn = fragment.querySelector('.order-cancellation__btn');
  const $modal = fragment.querySelector('.order-cancellation__modal');
  const $cancelConfirm = fragment.querySelector('.order-cancellation__modal-cancel');
  const $keep = fragment.querySelector('.order-cancellation__modal-keep');
  const $cancelledMsg = fragment.querySelector('.order-cancellation__cancelled');
  const $timerWrap = fragment.querySelector('.order-cancellation__timer');

  // Update timer
  function updateTimer() {
    const time = getTimeRemaining();
    if (!time || cancelled) {
      $timer.textContent = 'Expired';
      $btn.disabled = true;
      $btn.textContent = 'Cancellation window closed';
      return;
    }
    $timer.textContent = time;
    requestAnimationFrame(() => setTimeout(updateTimer, 1000));
  }
  updateTimer();

  $btn.addEventListener('click', () => { $modal.hidden = false; });

  $keep.addEventListener('click', () => { $modal.hidden = true; });

  fragment.querySelector('.order-cancellation__modal-backdrop').addEventListener('click', () => { $modal.hidden = true; });

  $cancelConfirm.addEventListener('click', () => {
    cancelled = true;
    $modal.hidden = true;
    $btn.hidden = true;
    $timerWrap.hidden = true;
    $cancelledMsg.hidden = false;
  });

  block.textContent = '';
  block.append(fragment);
}
