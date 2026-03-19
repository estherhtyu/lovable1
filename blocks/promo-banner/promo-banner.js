import { moveInstrumentation } from '../../scripts/aem.js';
import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('landing-page-promotions')) {
    block.remove();
    return;
  }

  const rows = [...block.children];
  const isMulti = rows.length > 1;
  const wrapper = document.createElement('div');
  wrapper.className = `promo-banner__wrapper${isMulti ? ' promo-banner__wrapper--multi' : ''}`;

  rows.forEach((row) => {
    const promo = document.createElement('div');
    promo.className = 'promo-banner__item';

    const cols = [...row.children];
    const picture = cols[0]?.querySelector('picture');
    const content = cols[1];

    if (picture) {
      const bg = document.createElement('div');
      bg.className = 'promo-banner__bg';
      bg.append(picture);
      promo.append(bg);
    }

    if (content) {
      const overlay = document.createElement('div');
      overlay.className = 'promo-banner__content';
      overlay.innerHTML = content.innerHTML;
      promo.append(overlay);
    }

    moveInstrumentation(row, promo);
    wrapper.append(promo);
  });

  block.textContent = '';
  block.append(wrapper);
}
