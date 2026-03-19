import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('installation-info')) {
    block.remove();
    return;
  }

  let installData = null;

  async function loadInstallation() {
    if (installData) return installData;
    const resp = await fetch('/mock-data/installation.json');
    installData = await resp.json();
    return installData;
  }

  const data = await loadInstallation();

  // Get product type from block config or default
  const configKey = block.textContent.trim() || 'default';
  const info = data[configKey] || data.default;

  const difficultyLevels = { easy: 1, medium: 2, hard: 3 };
  const level = difficultyLevels[info.difficulty] || 2;

  const bars = [1, 2, 3].map((i) => `<span class="installation-info__bar${i <= level ? ' installation-info__bar--active' : ''}"></span>`).join('');

  const isheetsHtml = info.isheets.map((sheet) => `<li><a href="${sheet.url}" target="_blank" rel="noopener noreferrer" class="installation-info__isheet-link">${sheet.title}</a></li>`).join('');

  const fragment = document.createRange().createContextualFragment(`
    <div class="installation-info__wrapper">
      <h3 class="installation-info__title">Installation Information</h3>
      <div class="installation-info__card">
        <div class="installation-info__row">
          <span class="installation-info__label">Difficulty</span>
          <div class="installation-info__difficulty">
            <div class="installation-info__meter">${bars}</div>
            <span class="installation-info__level">${info.difficulty.charAt(0).toUpperCase() + info.difficulty.slice(1)}</span>
          </div>
        </div>
        <div class="installation-info__row">
          <span class="installation-info__label">DIY Time</span>
          <span class="installation-info__value">${info.diy_time}</span>
        </div>
        <div class="installation-info__row">
          <span class="installation-info__label">Dealer Installation</span>
          <span class="installation-info__price">${info.dealer_price}</span>
        </div>
        <div class="installation-info__documents">
          <span class="installation-info__label">Installation Documents (iSheets)</span>
          <ul class="installation-info__isheets">${isheetsHtml}</ul>
        </div>
        ${info.qmerit_eligible ? `
          <div class="installation-info__qmerit">
            <a href="${info.qmerit_url}" target="_blank" rel="noopener noreferrer" class="installation-info__qmerit-link">
              Schedule with Qmerit &rarr;
            </a>
            <span class="installation-info__qmerit-note">Certified professional installation</span>
          </div>
        ` : ''}
        ${info.notes ? `<p class="installation-info__notes">${info.notes}</p>` : ''}
      </div>
    </div>
  `);

  block.textContent = '';
  block.append(fragment);
}
