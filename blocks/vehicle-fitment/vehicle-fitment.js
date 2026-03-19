import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('vehicle-fitment')) {
    block.remove();
    return;
  }

  let vehicleData = null;

  async function loadVehicleData() {
    if (vehicleData) return vehicleData;
    const resp = await fetch('/mock-data/vehicles.json');
    vehicleData = await resp.json();
    return vehicleData;
  }

  const existing = sessionStorage.getItem('selected-vehicle');

  const fragment = document.createRange().createContextualFragment(`
    <div class="vehicle-fitment__wrapper">
      <h3 class="vehicle-fitment__title">Verify Your Vehicle</h3>
      <div class="vehicle-fitment__tabs">
        <button class="vehicle-fitment__tab vehicle-fitment__tab--active" data-tab="ymm">Select Vehicle</button>
        <button class="vehicle-fitment__tab" data-tab="vin">Enter VIN</button>
      </div>
      <div class="vehicle-fitment__panel vehicle-fitment__panel--ymm">
        <div class="vehicle-fitment__selects">
          <select class="vehicle-fitment__select" data-level="year">
            <option value="">Year</option>
          </select>
          <select class="vehicle-fitment__select" data-level="make" disabled>
            <option value="">Make</option>
          </select>
          <select class="vehicle-fitment__select" data-level="model" disabled>
            <option value="">Model</option>
          </select>
          <select class="vehicle-fitment__select" data-level="trim" disabled>
            <option value="">Trim</option>
          </select>
        </div>
        <button class="vehicle-fitment__confirm" disabled>Confirm Vehicle</button>
      </div>
      <div class="vehicle-fitment__panel vehicle-fitment__panel--vin" hidden>
        <div class="vehicle-fitment__vin-input">
          <input type="text" placeholder="Enter your 17-digit VIN" maxlength="17" class="vehicle-fitment__input" />
        </div>
        <button class="vehicle-fitment__confirm" disabled>Look Up VIN</button>
      </div>
      <div class="vehicle-fitment__selected" hidden>
        <span class="vehicle-fitment__check">&#10003;</span>
        <span class="vehicle-fitment__vehicle-name"></span>
        <button class="vehicle-fitment__change">Change Vehicle</button>
      </div>
    </div>
  `);

  const $wrapper = fragment.querySelector('.vehicle-fitment__wrapper');
  const $tabs = fragment.querySelectorAll('.vehicle-fitment__tab');
  const $ymmPanel = fragment.querySelector('.vehicle-fitment__panel--ymm');
  const $vinPanel = fragment.querySelector('.vehicle-fitment__panel--vin');
  const $yearSelect = fragment.querySelector('[data-level="year"]');
  const $makeSelect = fragment.querySelector('[data-level="make"]');
  const $modelSelect = fragment.querySelector('[data-level="model"]');
  const $trimSelect = fragment.querySelector('[data-level="trim"]');
  const $ymmConfirm = $ymmPanel.querySelector('.vehicle-fitment__confirm');
  const $vinInput = fragment.querySelector('.vehicle-fitment__input');
  const $vinConfirm = $vinPanel.querySelector('.vehicle-fitment__confirm');
  const $selected = fragment.querySelector('.vehicle-fitment__selected');
  const $vehicleName = fragment.querySelector('.vehicle-fitment__vehicle-name');
  const $changeBtn = fragment.querySelector('.vehicle-fitment__change');

  // Tab switching
  $tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      $tabs.forEach((t) => t.classList.remove('vehicle-fitment__tab--active'));
      tab.classList.add('vehicle-fitment__tab--active');
      const isVin = tab.dataset.tab === 'vin';
      $ymmPanel.hidden = isVin;
      $vinPanel.hidden = !isVin;
    });
  });

  // Load years
  const data = await loadVehicleData();
  data.years.forEach((y) => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    $yearSelect.append(opt);
  });

  function populateSelect(selectEl, items) {
    const label = selectEl.options[0].textContent;
    selectEl.innerHTML = `<option value="">${label}</option>`;
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      selectEl.append(opt);
    });
    selectEl.disabled = false;
  }

  function resetFrom(level) {
    const levels = ['make', 'model', 'trim'];
    const selects = { make: $makeSelect, model: $modelSelect, trim: $trimSelect };
    const startIdx = levels.indexOf(level);
    for (let i = startIdx; i < levels.length; i += 1) {
      const sel = selects[levels[i]];
      sel.innerHTML = `<option value="">${levels[i].charAt(0).toUpperCase() + levels[i].slice(1)}</option>`;
      sel.disabled = true;
    }
    $ymmConfirm.disabled = true;
  }

  $yearSelect.addEventListener('change', () => {
    resetFrom('make');
    const year = $yearSelect.value;
    if (year && data.makes[year]) {
      populateSelect($makeSelect, data.makes[year]);
    }
  });

  $makeSelect.addEventListener('change', () => {
    resetFrom('model');
    const make = $makeSelect.value;
    if (make && data.models[make]) {
      populateSelect($modelSelect, data.models[make]);
    }
  });

  $modelSelect.addEventListener('change', () => {
    resetFrom('trim');
    const model = $modelSelect.value;
    if (model && data.trims[model]) {
      populateSelect($trimSelect, data.trims[model]);
    }
  });

  $trimSelect.addEventListener('change', () => {
    $ymmConfirm.disabled = !$trimSelect.value;
  });

  // VIN input
  $vinInput.addEventListener('input', () => {
    $vinConfirm.disabled = $vinInput.value.length !== 17;
  });

  function showSelected(vehicleInfo) {
    const name = vehicleInfo.vin
      ? `VIN: ${vehicleInfo.vin}`
      : `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.trim}`;
    $vehicleName.textContent = name;
    $selected.hidden = false;
    $ymmPanel.hidden = true;
    $vinPanel.hidden = true;
    $wrapper.querySelector('.vehicle-fitment__tabs').hidden = true;
    $wrapper.querySelector('.vehicle-fitment__title').textContent = 'Your Vehicle';
    sessionStorage.setItem('selected-vehicle', JSON.stringify(vehicleInfo));
    document.dispatchEvent(new CustomEvent('vehicle:selected', { detail: vehicleInfo }));
  }

  // Confirm YMM
  $ymmConfirm.addEventListener('click', () => {
    showSelected({
      year: $yearSelect.value,
      make: $makeSelect.value,
      model: $modelSelect.value,
      trim: $trimSelect.value,
    });
  });

  // Confirm VIN
  $vinConfirm.addEventListener('click', () => {
    showSelected({ vin: $vinInput.value });
  });

  // Change vehicle
  $changeBtn.addEventListener('click', () => {
    $selected.hidden = true;
    $ymmPanel.hidden = false;
    $vinPanel.hidden = true;
    $wrapper.querySelector('.vehicle-fitment__tabs').hidden = false;
    $wrapper.querySelector('.vehicle-fitment__title').textContent = 'Verify Your Vehicle';
    $tabs[0].classList.add('vehicle-fitment__tab--active');
    $tabs[1].classList.remove('vehicle-fitment__tab--active');
    sessionStorage.removeItem('selected-vehicle');
    document.dispatchEvent(new CustomEvent('vehicle:cleared'));
  });

  // Restore existing selection
  if (existing) {
    try {
      showSelected(JSON.parse(existing));
    } catch { /* ignore */ }
  }

  block.textContent = '';
  block.append(fragment);
}
