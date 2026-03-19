import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('dealer-scheduling')) {
    block.remove();
    return;
  }

  // Only show on checkout when installation fulfillment is selected
  const fulfillment = sessionStorage.getItem('selected-fulfillment');
  if (fulfillment !== 'installation') {
    // Show a note that scheduling is not needed
    block.textContent = '';
    const note = document.createElement('div');
    note.className = 'dealer-scheduling__not-needed';
    note.innerHTML = '<p>No installation scheduling needed for your current fulfillment selections.</p>';
    block.append(note);

    // Listen for fulfillment changes — if switched to installation, reload
    document.addEventListener('fulfillment:changed', (e) => {
      if (e.detail.option === 'installation') {
        window.location.reload();
      }
    });
    return;
  }

  const selectedDealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
  const dealerName = selectedDealer?.name || 'your dealer';
  const existingSchedule = sessionStorage.getItem('selected-schedule');

  // Build the trigger button + modal
  const fragment = document.createRange().createContextualFragment(`
    <div class="dealer-scheduling__wrapper">
      <div class="dealer-scheduling__trigger-section">
        <h4 class="dealer-scheduling__title">Installation Appointment</h4>
        <p class="dealer-scheduling__trigger-desc">Schedule your installation at <strong>${dealerName}</strong></p>
        <div class="dealer-scheduling__trigger-status"></div>
        <button class="dealer-scheduling__trigger-btn">Schedule Appointment</button>
      </div>

      <div class="dealer-scheduling__modal" hidden>
        <div class="dealer-scheduling__modal-backdrop"></div>
        <div class="dealer-scheduling__modal-content">
          <div class="dealer-scheduling__modal-header">
            <h4>Schedule Installation</h4>
            <button class="dealer-scheduling__modal-close">&times;</button>
          </div>
          <p class="dealer-scheduling__subtitle">Select a date and time at <strong class="dealer-scheduling__dealer-name">${dealerName}</strong></p>
          <div class="dealer-scheduling__calendar">
            <div class="dealer-scheduling__days"></div>
          </div>
          <div class="dealer-scheduling__slots" hidden>
            <h5 class="dealer-scheduling__slots-title"></h5>
            <div class="dealer-scheduling__slot-grid"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  const $wrapper = fragment.querySelector('.dealer-scheduling__wrapper');
  const $triggerBtn = fragment.querySelector('.dealer-scheduling__trigger-btn');
  const $triggerStatus = fragment.querySelector('.dealer-scheduling__trigger-status');
  const $modal = fragment.querySelector('.dealer-scheduling__modal');
  const $modalClose = fragment.querySelector('.dealer-scheduling__modal-close');
  const $backdrop = fragment.querySelector('.dealer-scheduling__modal-backdrop');
  const $days = fragment.querySelector('.dealer-scheduling__days');
  const $slots = fragment.querySelector('.dealer-scheduling__slots');
  const $slotsTitle = fragment.querySelector('.dealer-scheduling__slots-title');
  const $slotGrid = fragment.querySelector('.dealer-scheduling__slot-grid');
  const $dealerNameEl = fragment.querySelector('.dealer-scheduling__dealer-name');

  function openModal() { $modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { $modal.hidden = true; document.body.style.overflow = ''; }

  function showConfirmed(scheduleInfo) {
    $triggerStatus.innerHTML = `
      <div class="dealer-scheduling__confirmed">
        <span class="dealer-scheduling__confirmed-icon">&#10003;</span>
        <span class="dealer-scheduling__confirmed-text">${scheduleInfo.dateFormatted} at ${scheduleInfo.time}</span>
      </div>
    `;
    $triggerBtn.textContent = 'Change Appointment';
  }

  $triggerBtn.addEventListener('click', openModal);
  $modalClose.addEventListener('click', closeModal);
  $backdrop.addEventListener('click', closeModal);

  // Load schedule data and build calendar
  const resp = await fetch('/mock-data/schedule.json');
  const data = await resp.json();
  const today = new Date();

  for (let i = 1; i <= 14; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const slots = data.availableSlots[dateStr] || [];
    const hasSlots = slots.length > 0;

    const dayEl = document.createElement('button');
    dayEl.className = `dealer-scheduling__day${hasSlots ? '' : ' dealer-scheduling__day--unavailable'}`;
    dayEl.dataset.date = dateStr;
    dayEl.disabled = !hasSlots;
    dayEl.innerHTML = `
      <span class="dealer-scheduling__day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      <span class="dealer-scheduling__day-num">${date.getDate()}</span>
      <span class="dealer-scheduling__day-month">${date.toLocaleDateString('en-US', { month: 'short' })}</span>
      ${hasSlots ? `<span class="dealer-scheduling__day-avail">${slots.length} slots</span>` : '<span class="dealer-scheduling__day-avail">N/A</span>'}
    `;

    dayEl.addEventListener('click', () => {
      $days.querySelectorAll('.dealer-scheduling__day').forEach((d) => d.classList.remove('dealer-scheduling__day--selected'));
      dayEl.classList.add('dealer-scheduling__day--selected');

      const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      $slotsTitle.textContent = `Available times for ${formattedDate}:`;
      $slotGrid.innerHTML = '';
      slots.forEach((time) => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'dealer-scheduling__slot';
        slotBtn.textContent = time;
        slotBtn.addEventListener('click', () => {
          const scheduleInfo = {
            date: dateStr,
            dateFormatted: formattedDate,
            time,
            dealerId: selectedDealer?.id,
            schedulerType: data.schedulerType,
          };
          sessionStorage.setItem('selected-schedule', JSON.stringify(scheduleInfo));
          showConfirmed(scheduleInfo);
          closeModal();
          document.dispatchEvent(new CustomEvent('schedule:selected', { detail: scheduleInfo }));
        });
        $slotGrid.append(slotBtn);
      });
      $slots.hidden = false;
    });

    $days.append(dayEl);
  }

  // Listen for dealer changes
  document.addEventListener('dealer:selected', (e) => {
    $dealerNameEl.textContent = e.detail.name;
  });

  // Restore existing schedule
  if (existingSchedule) {
    try {
      showConfirmed(JSON.parse(existingSchedule));
    } catch { /* ignore */ }
  }

  block.textContent = '';
  block.append(fragment);
}
