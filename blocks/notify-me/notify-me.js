import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('notify-me')) {
    block.remove();
    return;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="notify-me__wrapper" hidden>
      <div class="notify-me__form">
        <h4 class="notify-me__title">Get Notified When Available</h4>
        <p class="notify-me__desc">Enter your email and we'll notify you when this item is back in stock.</p>
        <div class="notify-me__input-group">
          <input type="email" class="notify-me__email" placeholder="Enter your email address" required />
          <button class="notify-me__submit">Notify Me</button>
        </div>
      </div>
      <div class="notify-me__success" hidden>
        <span class="notify-me__check">&#10003;</span>
        <p class="notify-me__success-text">You're on the list! We'll email you when this item is available.</p>
      </div>
    </div>
  `);

  const $wrapper = fragment.querySelector('.notify-me__wrapper');
  const $form = fragment.querySelector('.notify-me__form');
  const $email = fragment.querySelector('.notify-me__email');
  const $submit = fragment.querySelector('.notify-me__submit');
  const $success = fragment.querySelector('.notify-me__success');

  // Pre-fill email for authenticated users
  try {
    const userInfo = JSON.parse(sessionStorage.getItem('user-info') || '{}');
    if (userInfo.email) {
      $email.value = userInfo.email;
    }
  } catch {
    // ignore parse errors
  }

  $submit.addEventListener('click', () => {
    if (!$email.value || !$email.validity.valid) {
      $email.reportValidity();
      return;
    }
    $form.hidden = true;
    $success.hidden = false;
  });

  $email.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $submit.click();
  });

  // Listen for stock status
  document.addEventListener('stock:status', (e) => {
    const { status } = e.detail;
    if (status === 'out_of_stock' || status === 'backorder') {
      $wrapper.hidden = false;
    } else {
      $wrapper.hidden = true;
    }
  });

  block.textContent = '';
  block.append(fragment);
}
