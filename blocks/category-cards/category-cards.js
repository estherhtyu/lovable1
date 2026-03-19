import { moveInstrumentation } from '../../scripts/aem.js';
import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('landing-page-categories')) {
    block.remove();
    return;
  }

  const cards = [...block.children];
  const grid = document.createElement('div');
  grid.className = 'category-cards__grid';

  cards.forEach((row) => {
    const card = document.createElement('a');
    card.className = 'category-cards__card';

    const cols = [...row.children];
    const picture = cols[0]?.querySelector('picture');
    const link = cols[1]?.querySelector('a');
    const name = cols[1]?.textContent?.trim() || '';

    if (link) card.href = link.href;

    if (picture) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'category-cards__image';
      imgWrap.append(picture);
      card.append(imgWrap);
    }

    const label = document.createElement('div');
    label.className = 'category-cards__label';
    label.innerHTML = `<span class="category-cards__name">${name}</span><span class="category-cards__cta">Shop Now</span>`;
    card.append(label);

    moveInstrumentation(row, card);
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}
