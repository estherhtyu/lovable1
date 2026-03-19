import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('cookie-consent')) {
    block.remove();
    return;
  }

  const existing = localStorage.getItem('cookie-consent');
  if (existing) {
    block.remove();
    return;
  }

  const fragment = document.createRange().createContextualFragment(`
    <div class="cookie-consent__banner">
      <div class="cookie-consent__content">
        <div class="cookie-consent__text">
          <h4 class="cookie-consent__title">We value your privacy</h4>
          <p class="cookie-consent__desc">We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
        </div>
        <div class="cookie-consent__actions">
          <button class="cookie-consent__btn cookie-consent__btn--accept">Accept All</button>
          <button class="cookie-consent__btn cookie-consent__btn--reject">Reject Non-Essential</button>
          <button class="cookie-consent__btn cookie-consent__btn--manage">Manage Preferences</button>
        </div>
      </div>
      <div class="cookie-consent__preferences" hidden>
        <div class="cookie-consent__pref-group">
          <label class="cookie-consent__pref-label">
            <input type="checkbox" checked disabled /> Essential
            <span class="cookie-consent__pref-note">Always active</span>
          </label>
        </div>
        <div class="cookie-consent__pref-group">
          <label class="cookie-consent__pref-label">
            <input type="checkbox" data-category="analytics" /> Analytics
          </label>
        </div>
        <div class="cookie-consent__pref-group">
          <label class="cookie-consent__pref-label">
            <input type="checkbox" data-category="marketing" /> Marketing
          </label>
        </div>
        <button class="cookie-consent__btn cookie-consent__btn--save">Save Preferences</button>
      </div>
    </div>
  `);

  const $banner = fragment.querySelector('.cookie-consent__banner');
  const $prefs = fragment.querySelector('.cookie-consent__preferences');

  function saveConsent(consent) {
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    document.dispatchEvent(new CustomEvent('cookie:consent', { detail: consent }));
    $banner.remove();
    block.remove();
  }

  fragment.querySelector('.cookie-consent__btn--accept').addEventListener('click', () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  });

  fragment.querySelector('.cookie-consent__btn--reject').addEventListener('click', () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  });

  fragment.querySelector('.cookie-consent__btn--manage').addEventListener('click', () => {
    $prefs.hidden = !$prefs.hidden;
  });

  fragment.querySelector('.cookie-consent__btn--save').addEventListener('click', () => {
    const analytics = $prefs.querySelector('[data-category="analytics"]').checked;
    const marketing = $prefs.querySelector('[data-category="marketing"]').checked;
    saveConsent({ essential: true, analytics, marketing });
  });

  block.textContent = '';
  block.append(fragment);
}
