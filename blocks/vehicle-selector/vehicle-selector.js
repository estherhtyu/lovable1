import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { events } from '@dropins/tools/event-bus.js';

const STORAGE_KEY = 'xcom:vehicle';
const EVENT_NAME = 'vehicle:changed';

/**
 * Returns the currently selected vehicle from sessionStorage.
 * @returns {{ vin?: string, year?: string, make?: string, model?: string,
 *   trim?: string, label?: string } | null}
 */
export function getVehicle() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists a vehicle to sessionStorage and dispatches `vehicle:changed`.
 * @param {{ vin?: string, year?: string, make?: string, model?: string,
 *   trim?: string, label?: string } | null} vehicle
 */
export function setVehicle(vehicle) {
  try {
    if (vehicle) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable in private mode
  }
  document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: vehicle, bubbles: true }));
  events.emit(EVENT_NAME, vehicle);
}

// ─── Dummy Data (fallback when data-platform-url is not configured) ───────────

const DUMMY = {
  years: ['2024', '2023', '2022', '2021', '2020', '2019', '2018'],
  makes: {
    2024: ['Ford', 'Toyota', 'Honda', 'Chevrolet', 'BMW'],
    2023: ['Ford', 'Toyota', 'Honda', 'Chevrolet', 'BMW'],
    2022: ['Ford', 'Toyota', 'Honda', 'Chevrolet', 'Nissan'],
    2021: ['Ford', 'Toyota', 'Honda', 'Nissan', 'Hyundai'],
    2020: ['Ford', 'Toyota', 'Honda', 'Dodge', 'Hyundai'],
    2019: ['Ford', 'Toyota', 'Honda', 'Dodge', 'Jeep'],
    2018: ['Ford', 'Toyota', 'Honda', 'Jeep', 'Ram'],
  },
  models: {
    Ford: ['F-150', 'Explorer', 'Mustang', 'Escape', 'Edge'],
    Toyota: ['Camry', 'RAV4', 'Tacoma', 'Highlander', '4Runner'],
    Honda: ['Civic', 'CR-V', 'Accord', 'Pilot', 'Ridgeline'],
    Chevrolet: ['Silverado', 'Equinox', 'Traverse', 'Blazer', 'Tahoe'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', 'M4'],
    Nissan: ['Altima', 'Rogue', 'Frontier', 'Pathfinder', 'Murano'],
    Hyundai: ['Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'Palisade'],
    Dodge: ['Charger', 'Challenger', 'Durango', 'Ram 1500'],
    Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Gladiator'],
    Ram: ['1500', '2500', '3500'],
  },
  trims: {
    'F-150': ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Limited', 'Raptor'],
    Explorer: ['Base', 'XLT', 'Limited', 'Platinum', 'ST'],
    Mustang: ['EcoBoost', 'GT', 'Mach 1', 'Shelby GT500'],
    Camry: ['LE', 'SE', 'XSE', 'XLE', 'TRD', 'Hybrid LE'],
    RAV4: ['LE', 'XLE', 'XLE Premium', 'TRD Off-Road', 'Limited', 'Prime'],
    Tacoma: ['SR', 'SR5', 'TRD Sport', 'TRD Off-Road', 'Limited', 'TRD Pro'],
    'Civic': ['LX', 'Sport', 'EX', 'Touring', 'Si', 'Type R'],
    'CR-V': ['LX', 'EX', 'EX-L', 'Touring', 'Hybrid'],
    Silverado: ['WT', 'Custom', 'LT', 'RST', 'LTZ', 'High Country'],
    Wrangler: ['Sport', 'Sport S', 'Sahara', 'Rubicon', '4xe'],
  },
  vins: {
    '1FTFW1ET5DFC10312': { year: '2023', make: 'Ford', model: 'F-150', trim: 'Lariat' },
    '1HGBH41JXMN109186': { year: '2022', make: 'Honda', model: 'Civic', trim: 'Sport' },
    '4T1BF1FK5CU512345': { year: '2021', make: 'Toyota', model: 'Camry', trim: 'SE' },
  },
};

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function fetchYears() {
  const base = await getConfigValue('data-platform-url');
  if (!base) return DUMMY.years;
  try {
    const res = await fetch(`${base}/vehicles/years`);
    if (!res.ok) return DUMMY.years;
    const data = await res.json();
    return Array.isArray(data) ? data.map(String) : DUMMY.years;
  } catch {
    return DUMMY.years;
  }
}

async function fetchMakes(year) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return DUMMY.makes[year] || Object.values(DUMMY.makes)[0];
  try {
    const res = await fetch(`${base}/vehicles/makes?year=${encodeURIComponent(year)}`);
    if (!res.ok) return DUMMY.makes[year] || [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return DUMMY.makes[year] || [];
  }
}

async function fetchModels(year, make) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return DUMMY.models[make] || [];
  try {
    const res = await fetch(`${base}/vehicles/models?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`);
    if (!res.ok) return DUMMY.models[make] || [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return DUMMY.models[make] || [];
  }
}

async function fetchTrims(year, make, model) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return DUMMY.trims[model] || [];
  try {
    const res = await fetch(`${base}/vehicles/trims?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
    if (!res.ok) return DUMMY.trims[model] || [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return DUMMY.trims[model] || [];
  }
}

async function fetchVehicleByVin(vin) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return DUMMY.vins[vin.toUpperCase()] || null;
  try {
    const res = await fetch(`${base}/vehicles/vin/${encodeURIComponent(vin)}`);
    if (!res.ok) return DUMMY.vins[vin.toUpperCase()] || null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function createSelect(id, labelText, options, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'vehicle-selector__field';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'vehicle-selector__label';

  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  select.className = 'vehicle-selector__select';
  select.setAttribute('aria-label', labelText);

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = placeholder;
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  select.appendChild(defaultOpt);

  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });

  wrapper.append(label, select);
  return { wrapper, select };
}

function resetSelect(select, placeholder) {
  while (select.options.length > 1) select.remove(1);
  select.options[0].textContent = placeholder;
  select.options[0].selected = true;
  select.disabled = true;
}

function populateSelect(select, options) {
  while (select.options.length > 1) select.remove(1);
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
  select.disabled = options.length === 0;
}

// ─── Summary Bar (collapsed state) ───────────────────────────────────────────

function buildSummary({ onEdit, onClear }) {
  const summary = document.createElement('div');
  summary.className = 'vehicle-selector__summary';
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-label', 'Selected vehicle');

  const icon = document.createElement('span');
  icon.className = 'vehicle-selector__summary-icon';
  icon.setAttribute('aria-hidden', 'true');

  const labelEl = document.createElement('span');
  labelEl.className = 'vehicle-selector__summary-label';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'vehicle-selector__summary-change';
  editBtn.textContent = 'Change Vehicle';
  editBtn.addEventListener('click', onEdit);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'vehicle-selector__summary-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.setAttribute('aria-label', 'Clear selected vehicle');
  clearBtn.addEventListener('click', onClear);

  summary.append(icon, labelEl, editBtn, clearBtn);

  function update(vehicle) {
    if (!vehicle) return;
    const text = vehicle.label
      || [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
    labelEl.textContent = `Shopping for: ${text}`;
  }

  return { summary, update };
}

// ─── Inline Form (expanded state) ────────────────────────────────────────────

function buildForm({ onConfirm, onSkip }) {
  const form = document.createElement('div');
  form.className = 'vehicle-selector__form';

  // Heading
  const heading = document.createElement('h2');
  heading.className = 'vehicle-selector__form-heading';
  heading.textContent = 'Select Your Vehicle';

  const subtext = document.createElement('p');
  subtext.className = 'vehicle-selector__form-subtext';
  subtext.textContent = 'Filter the catalog to show only compatible accessories for your vehicle.';

  // Tab bar
  const tabList = document.createElement('div');
  tabList.className = 'vehicle-selector__tabs';
  tabList.setAttribute('role', 'tablist');

  const tabVin = document.createElement('button');
  tabVin.type = 'button';
  tabVin.className = 'vehicle-selector__tab vehicle-selector__tab--active';
  tabVin.setAttribute('role', 'tab');
  tabVin.setAttribute('aria-selected', 'true');
  tabVin.setAttribute('aria-controls', 'vs-panel-vin');
  tabVin.id = 'vs-tab-vin';
  tabVin.textContent = 'Enter VIN';

  const tabYmmt = document.createElement('button');
  tabYmmt.type = 'button';
  tabYmmt.className = 'vehicle-selector__tab';
  tabYmmt.setAttribute('role', 'tab');
  tabYmmt.setAttribute('aria-selected', 'false');
  tabYmmt.setAttribute('aria-controls', 'vs-panel-ymmt');
  tabYmmt.id = 'vs-tab-ymmt';
  tabYmmt.textContent = 'Year / Make / Model';

  tabList.append(tabVin, tabYmmt);

  // ── VIN panel ────────────────────────────────────────────────────────────
  const vinPanel = document.createElement('div');
  vinPanel.id = 'vs-panel-vin';
  vinPanel.className = 'vehicle-selector__panel vehicle-selector__panel--active';
  vinPanel.setAttribute('role', 'tabpanel');
  vinPanel.setAttribute('aria-labelledby', 'vs-tab-vin');

  const vinDesc = document.createElement('p');
  vinDesc.className = 'vehicle-selector__panel-desc';
  vinDesc.textContent = 'Enter your 17-character Vehicle Identification Number to find compatible accessories.';

  const vinFieldWrapper = document.createElement('div');
  vinFieldWrapper.className = 'vehicle-selector__field';

  const vinLabel = document.createElement('label');
  vinLabel.htmlFor = 'vs-vin-input';
  vinLabel.className = 'vehicle-selector__label';
  vinLabel.textContent = 'VIN';

  const vinInput = document.createElement('input');
  vinInput.type = 'text';
  vinInput.id = 'vs-vin-input';
  vinInput.name = 'vin';
  vinInput.className = 'vehicle-selector__input';
  vinInput.placeholder = 'e.g. 1HGCM82633A004352';
  vinInput.maxLength = 17;
  vinInput.setAttribute('aria-required', 'true');
  vinInput.setAttribute('pattern', '[A-HJ-NPR-Z0-9]{17}');
  vinInput.setAttribute('autocomplete', 'off');
  vinInput.setAttribute('spellcheck', 'false');

  const vinError = document.createElement('span');
  vinError.className = 'vehicle-selector__error';
  vinError.setAttribute('role', 'alert');
  vinError.setAttribute('aria-live', 'polite');
  vinError.hidden = true;

  const vinResult = document.createElement('span');
  vinResult.className = 'vehicle-selector__vin-result';
  vinResult.setAttribute('aria-live', 'polite');
  vinResult.hidden = true;

  vinFieldWrapper.append(vinLabel, vinInput, vinError);
  vinPanel.append(vinDesc, vinFieldWrapper, vinResult);

  // ── YMMT panel ────────────────────────────────────────────────────────────
  const ymmtPanel = document.createElement('div');
  ymmtPanel.id = 'vs-panel-ymmt';
  ymmtPanel.className = 'vehicle-selector__panel';
  ymmtPanel.setAttribute('role', 'tabpanel');
  ymmtPanel.setAttribute('aria-labelledby', 'vs-tab-ymmt');

  const ymmtLoading = document.createElement('span');
  ymmtLoading.className = 'vehicle-selector__loading';
  ymmtLoading.textContent = 'Loading years…';
  ymmtLoading.setAttribute('aria-live', 'polite');

  const yearField = createSelect('vs-year', 'Year', [], 'Select Year');
  const makeField = createSelect('vs-make', 'Make', [], 'Select Make');
  const modelField = createSelect('vs-model', 'Model', [], 'Select Model');
  const trimField = createSelect('vs-trim', 'Trim', [], 'Select Trim (optional)');

  makeField.select.disabled = true;
  modelField.select.disabled = true;
  trimField.select.disabled = true;

  const ymmtFields = document.createElement('div');
  ymmtFields.className = 'vehicle-selector__ymmt-fields';
  ymmtFields.append(yearField.wrapper, makeField.wrapper, modelField.wrapper, trimField.wrapper);

  ymmtPanel.append(ymmtLoading, ymmtFields);

  // ── Actions ───────────────────────────────────────────────────────────────
  const actions = document.createElement('div');
  actions.className = 'vehicle-selector__actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'vehicle-selector__confirm';
  confirmBtn.textContent = 'Find Compatible Parts';
  confirmBtn.disabled = true;

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'vehicle-selector__skip';
  skipBtn.textContent = 'Skip — browse all products';
  skipBtn.addEventListener('click', onSkip);

  actions.append(confirmBtn, skipBtn);

  // ── Assemble ──────────────────────────────────────────────────────────────
  form.append(heading, subtext, tabList, vinPanel, ymmtPanel, actions);

  // ── State ─────────────────────────────────────────────────────────────────
  let pendingVehicle = null;
  let ymmtLoaded = false;

  function setPending(vehicle) {
    pendingVehicle = vehicle;
    confirmBtn.disabled = !vehicle;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function activateTab(name) {
    const isVin = name === 'vin';
    tabVin.classList.toggle('vehicle-selector__tab--active', isVin);
    tabVin.setAttribute('aria-selected', String(isVin));
    tabYmmt.classList.toggle('vehicle-selector__tab--active', !isVin);
    tabYmmt.setAttribute('aria-selected', String(!isVin));
    vinPanel.classList.toggle('vehicle-selector__panel--active', isVin);
    ymmtPanel.classList.toggle('vehicle-selector__panel--active', !isVin);
    setPending(null);
    if (!isVin && !ymmtLoaded) loadYears();
  }

  tabVin.addEventListener('click', () => activateTab('vin'));
  tabYmmt.addEventListener('click', () => activateTab('ymmt'));

  // ── VIN logic ─────────────────────────────────────────────────────────────
  let vinTimer = null;

  function validateVin(val) {
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(val);
  }

  vinInput.addEventListener('input', () => {
    const val = vinInput.value.trim().toUpperCase();
    vinInput.value = val;
    vinError.hidden = true;
    vinResult.hidden = true;
    setPending(null);
    clearTimeout(vinTimer);
    if (!validateVin(val)) return;
    vinTimer = setTimeout(async () => {
      vinResult.textContent = 'Looking up vehicle…';
      vinResult.hidden = false;
      const vehicle = await fetchVehicleByVin(val);
      if (vehicle) {
        const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
          .filter(Boolean).join(' ');
        vinResult.textContent = `Found: ${label}`;
        setPending({
          vin: val, ...vehicle, label,
        });
      } else {
        vinResult.hidden = true;
        vinError.textContent = 'VIN not found. Please check and try again.';
        vinError.hidden = false;
      }
    }, 500);
  });

  // ── YMMT logic ────────────────────────────────────────────────────────────
  async function loadYears() {
    ymmtLoading.textContent = 'Loading years…';
    ymmtLoading.hidden = false;
    const years = await fetchYears();
    ymmtLoading.hidden = true;
    ymmtLoaded = true;
    populateSelect(yearField.select, years);
    yearField.select.disabled = false;
  }

  yearField.select.addEventListener('change', async () => {
    const { value: year } = yearField.select;
    resetSelect(makeField.select, 'Select Make');
    resetSelect(modelField.select, 'Select Model');
    resetSelect(trimField.select, 'Select Trim (optional)');
    setPending(null);
    if (!year) return;
    makeField.select.disabled = true;
    const makes = await fetchMakes(year);
    populateSelect(makeField.select, makes);
    makeField.select.disabled = false;
  });

  makeField.select.addEventListener('change', async () => {
    const year = yearField.select.value;
    const { value: make } = makeField.select;
    resetSelect(modelField.select, 'Select Model');
    resetSelect(trimField.select, 'Select Trim (optional)');
    setPending(null);
    if (!make) return;
    modelField.select.disabled = true;
    const models = await fetchModels(year, make);
    populateSelect(modelField.select, models);
    modelField.select.disabled = false;
  });

  modelField.select.addEventListener('change', async () => {
    const year = yearField.select.value;
    const make = makeField.select.value;
    const { value: model } = modelField.select;
    resetSelect(trimField.select, 'Select Trim (optional)');
    if (!model) { setPending(null); return; }
    const label = [year, make, model].filter(Boolean).join(' ');
    setPending({
      year, make, model, label,
    });
    const trims = await fetchTrims(year, make, model);
    if (trims.length > 0) {
      populateSelect(trimField.select, trims);
      trimField.select.disabled = false;
    }
  });

  trimField.select.addEventListener('change', () => {
    const year = yearField.select.value;
    const make = makeField.select.value;
    const model = modelField.select.value;
    const { value: trim } = trimField.select;
    if (model) {
      const label = [year, make, model, trim].filter(Boolean).join(' ');
      setPending({
        year, make, model, trim: trim || undefined, label,
      });
    }
  });

  // ── Confirm ───────────────────────────────────────────────────────────────
  confirmBtn.addEventListener('click', () => {
    if (pendingVehicle) onConfirm(pendingVehicle);
  });

  // ── Pre-fill from existing vehicle ────────────────────────────────────────
  function prefill(vehicle) {
    if (!vehicle) return;
    if (vehicle.vin) {
      activateTab('vin');
      vinInput.value = vehicle.vin;
      const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
        .filter(Boolean).join(' ');
      if (label) {
        vinResult.textContent = `Current: ${label}`;
        vinResult.hidden = false;
      }
      setPending(vehicle);
    } else if (vehicle.year) {
      activateTab('ymmt');
    }
  }

  return { form, prefill };
}

// ─── Block Decorator ──────────────────────────────────────────────────────────

/**
 * Decorates the vehicle-selector block.
 * Renders an inline panel with VIN/YMMT form (expanded) or a compact summary
 * bar (collapsed) once a vehicle is confirmed. Dispatches `vehicle:changed`.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  block.textContent = '';

  const { summary, update: updateSummary } = buildSummary({
    onEdit: () => expand(),
    onClear: () => {
      setVehicle(null);
      expand();
    },
  });

  const { form, prefill } = buildForm({
    onConfirm: (vehicle) => {
      setVehicle(vehicle);
      updateSummary(vehicle);
      collapse();
    },
    onSkip: () => collapse(),
  });

  function expand() {
    const existing = getVehicle();
    prefill(existing);
    form.hidden = false;
    summary.hidden = true;
    block.setAttribute('data-state', 'expanded');
  }

  function collapse() {
    form.hidden = true;
    summary.hidden = false;
    block.setAttribute('data-state', 'collapsed');
  }

  block.append(form, summary);

  // Show summary if vehicle already in session; otherwise show form
  const existing = getVehicle();
  if (existing) {
    updateSummary(existing);
    collapse();
  } else {
    summary.hidden = true;
    block.setAttribute('data-state', 'expanded');
  }

  // Stay in sync when vehicle is changed elsewhere
  document.addEventListener(EVENT_NAME, (e) => {
    if (e.detail) {
      updateSummary(e.detail);
      collapse();
    } else {
      expand();
    }
  });
}
