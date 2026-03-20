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

// ─── API Helpers ──────────────────────────────────────────────────────────────

/**
 * Fetches YMMT years from the data-platform API.
 * @returns {Promise<string[]>}
 */
async function fetchYears() {
  const base = await getConfigValue('data-platform-url');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/vehicles/years`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches makes for a given year.
 * @param {string} year
 * @returns {Promise<string[]>}
 */
async function fetchMakes(year) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/vehicles/makes?year=${encodeURIComponent(year)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetches models for a given year + make.
 * @param {string} year
 * @param {string} make
 * @returns {Promise<string[]>}
 */
async function fetchModels(year, make) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/vehicles/models?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetches trims for a given year + make + model.
 * @param {string} year
 * @param {string} make
 * @param {string} model
 * @returns {Promise<string[]>}
 */
async function fetchTrims(year, make, model) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/vehicles/trims?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Looks up a vehicle by VIN using the data-platform API.
 * @param {string} vin
 * @returns {Promise<{ year: string, make: string, model: string, trim: string } | null>}
 */
async function fetchVehicleByVin(vin) {
  const base = await getConfigValue('data-platform-url');
  if (!base) return null;
  try {
    const res = await fetch(`${base}/vehicles/vin/${encodeURIComponent(vin)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

/**
 * Creates a labelled <select> element and populates it with options.
 * @param {string} id
 * @param {string} labelText
 * @param {string[]} options
 * @param {string} placeholder
 * @returns {{ wrapper: HTMLElement, select: HTMLSelectElement }}
 */
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

/**
 * Resets a <select> to the placeholder and disables it.
 * @param {HTMLSelectElement} select
 * @param {string} placeholder
 */
function resetSelect(select, placeholder) {
  while (select.options.length > 1) select.remove(1);
  select.options[0].textContent = placeholder;
  select.options[0].selected = true;
  select.disabled = true;
}

/**
 * Populates a <select> with new options after clearing previous ones.
 * @param {HTMLSelectElement} select
 * @param {string[]} options
 */
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

// ─── Bar ─────────────────────────────────────────────────────────────────────

/**
 * Builds the persistent vehicle bar that appears above PDP/PLP content.
 * @param {() => void} onOpenDialog
 * @returns {{ bar: HTMLElement, updateBar: (vehicle: object|null) => void }}
 */
function buildBar(onOpenDialog) {
  const bar = document.createElement('div');
  bar.className = 'vehicle-selector__bar';
  bar.setAttribute('role', 'complementary');
  bar.setAttribute('aria-label', 'Selected vehicle');

  const label = document.createElement('span');
  label.className = 'vehicle-selector__bar-label';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'vehicle-selector__bar-change button button--link';
  changeBtn.textContent = 'Change Vehicle';
  changeBtn.setAttribute('aria-haspopup', 'dialog');
  changeBtn.addEventListener('click', onOpenDialog);

  bar.append(label, changeBtn);

  function updateBar(vehicle) {
    if (vehicle) {
      const text = vehicle.label
        || [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
      label.textContent = text;
      bar.setAttribute('data-vehicle-set', 'true');
      changeBtn.textContent = 'Change Vehicle';
    } else {
      label.textContent = 'No vehicle selected';
      bar.setAttribute('data-vehicle-set', 'false');
      changeBtn.textContent = 'Select Your Vehicle';
    }
  }

  updateBar(getVehicle());

  return { bar, updateBar };
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

/**
 * Builds the vehicle selection dialog.
 * @param {{ onSave: (vehicle: object) => void, onClose: () => void }} callbacks
 * @returns {{ dialog: HTMLElement, openDialog: () => void, closeDialog: () => void }}
 */
function buildDialog({ onSave, onClose }) {
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'vehicle-selector__overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // Dialog
  const dialog = document.createElement('div');
  dialog.className = 'vehicle-selector__dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'vehicle-selector-title');

  // Header
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'vehicle-selector__dialog-header';

  const title = document.createElement('h2');
  title.id = 'vehicle-selector-title';
  title.className = 'vehicle-selector__dialog-title';
  title.textContent = 'Select Your Vehicle';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'vehicle-selector__close';
  closeBtn.setAttribute('aria-label', 'Close vehicle selector');

  const closeIcon = document.createElement('span');
  closeIcon.className = 'vehicle-selector__close-icon';
  closeIcon.setAttribute('aria-hidden', 'true');
  closeBtn.appendChild(closeIcon);

  dialogHeader.append(title, closeBtn);

  // Tab switcher
  const tabList = document.createElement('div');
  tabList.className = 'vehicle-selector__tabs';
  tabList.setAttribute('role', 'tablist');

  const tabVin = document.createElement('button');
  tabVin.type = 'button';
  tabVin.className = 'vehicle-selector__tab vehicle-selector__tab--active';
  tabVin.setAttribute('role', 'tab');
  tabVin.setAttribute('aria-selected', 'true');
  tabVin.setAttribute('aria-controls', 'vehicle-tab-vin');
  tabVin.id = 'vehicle-tab-btn-vin';
  tabVin.textContent = 'Enter VIN';

  const tabYmmt = document.createElement('button');
  tabYmmt.type = 'button';
  tabYmmt.className = 'vehicle-selector__tab';
  tabYmmt.setAttribute('role', 'tab');
  tabYmmt.setAttribute('aria-selected', 'false');
  tabYmmt.setAttribute('aria-controls', 'vehicle-tab-ymmt');
  tabYmmt.id = 'vehicle-tab-btn-ymmt';
  tabYmmt.textContent = 'Year / Make / Model';

  tabList.append(tabVin, tabYmmt);

  // ── VIN Panel ────────────────────────────────────────────────────────────
  const vinPanel = document.createElement('div');
  vinPanel.id = 'vehicle-tab-vin';
  vinPanel.className = 'vehicle-selector__panel vehicle-selector__panel--active';
  vinPanel.setAttribute('role', 'tabpanel');
  vinPanel.setAttribute('aria-labelledby', 'vehicle-tab-btn-vin');

  const vinDesc = document.createElement('p');
  vinDesc.className = 'vehicle-selector__panel-desc';
  vinDesc.textContent = 'Enter your 17-character Vehicle Identification Number to find compatible accessories.';

  const vinFieldWrapper = document.createElement('div');
  vinFieldWrapper.className = 'vehicle-selector__field';

  const vinLabel = document.createElement('label');
  vinLabel.htmlFor = 'vehicle-vin-input';
  vinLabel.className = 'vehicle-selector__label';
  vinLabel.textContent = 'VIN';

  const vinInput = document.createElement('input');
  vinInput.type = 'text';
  vinInput.id = 'vehicle-vin-input';
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

  const vinInfo = document.createElement('span');
  vinInfo.className = 'vehicle-selector__vin-result';
  vinInfo.setAttribute('aria-live', 'polite');
  vinInfo.hidden = true;

  vinFieldWrapper.append(vinLabel, vinInput, vinError);
  vinPanel.append(vinDesc, vinFieldWrapper, vinInfo);

  // ── YMMT Panel ───────────────────────────────────────────────────────────
  const ymmtPanel = document.createElement('div');
  ymmtPanel.id = 'vehicle-tab-ymmt';
  ymmtPanel.className = 'vehicle-selector__panel';
  ymmtPanel.setAttribute('role', 'tabpanel');
  ymmtPanel.setAttribute('aria-labelledby', 'vehicle-tab-btn-ymmt');

  const ymmtLoading = document.createElement('span');
  ymmtLoading.className = 'vehicle-selector__loading';
  ymmtLoading.textContent = 'Loading years…';
  ymmtLoading.setAttribute('aria-live', 'polite');

  const yearField = createSelect('vehicle-year', 'Year', [], 'Select Year');
  const makeField = createSelect('vehicle-make', 'Make', [], 'Select Make');
  const modelField = createSelect('vehicle-model', 'Model', [], 'Select Model');
  const trimField = createSelect('vehicle-trim', 'Trim', [], 'Select Trim (optional)');

  makeField.select.disabled = true;
  modelField.select.disabled = true;
  trimField.select.disabled = true;

  ymmtPanel.append(
    ymmtLoading,
    yearField.wrapper,
    makeField.wrapper,
    modelField.wrapper,
    trimField.wrapper,
  );

  // ── Dialog Footer ────────────────────────────────────────────────────────
  const dialogFooter = document.createElement('div');
  dialogFooter.className = 'vehicle-selector__dialog-footer';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'vehicle-selector__clear button button--secondary';
  clearBtn.textContent = 'Clear Selection';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'vehicle-selector__save button';
  saveBtn.textContent = 'Confirm Vehicle';
  saveBtn.disabled = true;

  dialogFooter.append(clearBtn, saveBtn);

  // ── Assemble Dialog ──────────────────────────────────────────────────────
  dialog.append(dialogHeader, tabList, vinPanel, ymmtPanel, dialogFooter);

  // ── State ────────────────────────────────────────────────────────────────
  let pendingVehicle = null;
  let ymmtLoaded = false;

  function setSaveEnabled(vehicle) {
    pendingVehicle = vehicle;
    saveBtn.disabled = !vehicle;
  }

  // ── Tab switching ────────────────────────────────────────────────────────
  function activateTab(tabName) {
    const isVin = tabName === 'vin';

    tabVin.classList.toggle('vehicle-selector__tab--active', isVin);
    tabVin.setAttribute('aria-selected', isVin ? 'true' : 'false');
    tabYmmt.classList.toggle('vehicle-selector__tab--active', !isVin);
    tabYmmt.setAttribute('aria-selected', !isVin ? 'true' : 'false');

    vinPanel.classList.toggle('vehicle-selector__panel--active', isVin);
    ymmtPanel.classList.toggle('vehicle-selector__panel--active', !isVin);

    setSaveEnabled(null);

    if (!isVin && !ymmtLoaded) {
      loadYmmtYears();
    }
  }

  tabVin.addEventListener('click', () => activateTab('vin'));
  tabYmmt.addEventListener('click', () => activateTab('ymmt'));

  // ── VIN Logic ────────────────────────────────────────────────────────────
  let vinLookupTimer = null;

  function validateVin(val) {
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(val);
  }

  vinInput.addEventListener('input', () => {
    const val = vinInput.value.trim().toUpperCase();
    vinInput.value = val;
    vinError.hidden = true;
    vinInfo.hidden = true;
    setSaveEnabled(null);

    clearTimeout(vinLookupTimer);

    if (validateVin(val)) {
      vinLookupTimer = setTimeout(async () => {
        vinInfo.textContent = 'Looking up vehicle…';
        vinInfo.hidden = false;

        const vehicle = await fetchVehicleByVin(val);
        if (vehicle) {
          const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
          vinInfo.textContent = `Found: ${label}`;
          setSaveEnabled({ vin: val, ...vehicle, label });
        } else {
          vinInfo.textContent = '';
          vinInfo.hidden = true;
          vinError.textContent = 'VIN not found. Please check and try again.';
          vinError.hidden = false;
        }
      }, 500);
    }
  });

  // ── YMMT Logic ───────────────────────────────────────────────────────────
  async function loadYmmtYears() {
    ymmtLoading.textContent = 'Loading years…';
    ymmtLoading.hidden = false;
    const years = await fetchYears();
    ymmtLoading.hidden = true;
    ymmtLoaded = true;
    populateSelect(yearField.select, years);
    yearField.select.disabled = false;
  }

  yearField.select.addEventListener('change', async () => {
    const year = yearField.select.value;
    resetSelect(makeField.select, 'Select Make');
    resetSelect(modelField.select, 'Select Model');
    resetSelect(trimField.select, 'Select Trim (optional)');
    setSaveEnabled(null);

    if (!year) return;
    makeField.select.disabled = true;
    const makes = await fetchMakes(year);
    populateSelect(makeField.select, makes);
    makeField.select.disabled = false;
  });

  makeField.select.addEventListener('change', async () => {
    const year = yearField.select.value;
    const make = makeField.select.value;
    resetSelect(modelField.select, 'Select Model');
    resetSelect(trimField.select, 'Select Trim (optional)');
    setSaveEnabled(null);

    if (!make) return;
    modelField.select.disabled = true;
    const models = await fetchModels(year, make);
    populateSelect(modelField.select, models);
    modelField.select.disabled = false;
  });

  modelField.select.addEventListener('change', async () => {
    const year = yearField.select.value;
    const make = makeField.select.value;
    const model = modelField.select.value;
    resetSelect(trimField.select, 'Select Trim (optional)');

    if (!model) {
      setSaveEnabled(null);
      return;
    }

    // Model alone is sufficient to confirm; trim is optional
    const label = [year, make, model].filter(Boolean).join(' ');
    setSaveEnabled({
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
    const trim = trimField.select.value;

    if (model) {
      const label = [year, make, model, trim].filter(Boolean).join(' ');
      setSaveEnabled({
        year, make, model, trim: trim || undefined, label,
      });
    }
  });

  // ── Open / Close ─────────────────────────────────────────────────────────
  function openDialog() {
    overlay.removeAttribute('aria-hidden');
    dialog.removeAttribute('aria-hidden');
    document.body.classList.add('vehicle-selector--open');
    closeBtn.focus();

    // Pre-fill from existing vehicle
    const existing = getVehicle();
    if (existing?.vin) {
      activateTab('vin');
      vinInput.value = existing.vin;
      const label = [existing.year, existing.make, existing.model, existing.trim].filter(Boolean).join(' ');
      if (label) {
        vinInfo.textContent = `Current: ${label}`;
        vinInfo.hidden = false;
      }
      setSaveEnabled(existing);
    } else if (existing?.year) {
      activateTab('ymmt');
    }
  }

  function closeDialog() {
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vehicle-selector--open');
    onClose();
  }

  // ── Event Listeners ──────────────────────────────────────────────────────
  closeBtn.addEventListener('click', closeDialog);
  overlay.addEventListener('click', closeDialog);

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDialog();
  });

  clearBtn.addEventListener('click', () => {
    setVehicle(null);
    closeDialog();
  });

  saveBtn.addEventListener('click', () => {
    if (pendingVehicle) {
      onSave(pendingVehicle);
      closeDialog();
    }
  });

  return {
    overlay, dialog, openDialog, closeDialog,
  };
}

// ─── Block Decorator ──────────────────────────────────────────────────────────

/**
 * Decorates the vehicle-selector block.
 * Renders a persistent vehicle bar + modal dialog for vehicle selection.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  block.textContent = '';

  // Use a deferred ref so buildBar callback can call openDialog after it is defined
  let openDialogRef;
  const { bar, updateBar } = buildBar(() => openDialogRef());
  const {
    overlay, dialog, openDialog,
  } = buildDialog({
    onSave: (vehicle) => {
      setVehicle(vehicle);
      updateBar(vehicle);
    },
    onClose: () => {},
  });
  openDialogRef = openDialog;

  block.appendChild(bar);
  document.body.appendChild(overlay);
  document.body.appendChild(dialog);

  // Keep bar in sync when vehicle changes from elsewhere (e.g. header)
  document.addEventListener(EVENT_NAME, (e) => {
    updateBar(e.detail);
  });
}
