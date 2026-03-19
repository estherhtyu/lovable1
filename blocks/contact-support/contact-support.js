import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('contact-support')) {
    block.remove();
    return;
  }

  const defaultOptions = [
    { icon: '\u2753', title: 'FAQ', desc: 'Find answers to common questions', link: 'https://www.mazdausa.com/shopping-tools/faq', label: 'View FAQ' },
    { icon: '\uD83D\uDCAC', title: 'Live Chat', desc: 'Chat with a support agent', link: 'https://www.mazdausa.com/contact-us', label: 'Start Chat' },
    { icon: '\uD83D\uDCDE', title: 'Call Us', desc: '1-800-222-5500', link: 'tel:18002225500', label: 'Call Now' },
    { icon: '\u2709', title: 'Email Us', desc: 'Send us a message', link: 'https://www.mazdausa.com/contact-us', label: 'Contact Form' },
  ];

  // Check if block has authored content
  const rows = [...block.children];
  let options = defaultOptions;

  if (rows.length > 0 && rows[0].children.length >= 2) {
    options = rows.map((row) => {
      const cols = [...row.children];
      const title = cols[0]?.textContent?.trim() || '';
      const link = cols[1]?.querySelector('a')?.href || '#';
      const desc = cols[1]?.textContent?.trim() || '';
      return { icon: '', title, desc, link, label: 'Learn More' };
    });
  }

  const grid = document.createElement('div');
  grid.className = 'contact-support__grid';

  options.forEach((opt) => {
    const card = document.createElement('a');
    card.className = 'contact-support__card';
    card.href = opt.link;
    if (opt.link.startsWith('http')) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    card.innerHTML = `
      ${opt.icon ? `<span class="contact-support__icon">${opt.icon}</span>` : ''}
      <h4 class="contact-support__title">${opt.title}</h4>
      <p class="contact-support__desc">${opt.desc}</p>
      <span class="contact-support__label">${opt.label} &rarr;</span>
    `;
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}
