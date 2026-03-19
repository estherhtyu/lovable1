import { isFeatureEnabled } from '../../scripts/features.js';

export default async function decorate(block) {
  if (!await isFeatureEnabled('dealer-scheduling')) {
    block.remove();
    return;
  }

  let scheduleData = null;

  async function loadSchedule() {
    if (scheduleData) return scheduleData;
    const resp = await fetch('/mock-data/schedule.json');
    scheduleData = await resp.json();
    return scheduleData;
  }

  const selectedDealer = JSON.parse(sessionStorage.getItem('selected-dealer') || 'null');
  const dealerName = selectedDealer?.name || 'your dealer';

  const fragment = document.createRange().createContextualFragment(`
    <div class="dealer-scheduling__wrapper">
      <h4 class="dealer-scheduling__title">Schedule Your Appointment</h4>
      <p class="dealer-scheduling__subtitle">Select a date and time at <strong class="dealer-scheduling__dealer-name">${dealerName}</strong></p>
      <div class="dealer-scheduling__calendar">
        <div class="dealer-scheduling__days"></div>
      </div>
      <div class="dealer-scheduling__slots" hidden>
        <h5 class="dealer-scheduling__slots-title"></h5>
        <div class="dealer-scheduling__slot-grid"></div>
      </div>
      <div class="dealer-scheduling__confirmed" hidden>
        <span class="dealer-scheduling__confirmed-icon">&#10003;</span>
        <span class="dealer-scheduling__confirmed-text"></span>
        <button class="dealer-scheduling__change-btn">Change</button>
      </div>
    </div>
  `);

  const $days = fragment.querySelector('.dealer-scheduling__days');
  const $slots = fragment.querySelector('.dealer-scheduling__slots');
  const $slotsTitle = fragment.querySelector('.dealer-scheduling__slots-title');
  const $slotGrid = fragment.querySelector('.dealer-scheduling__slot-grid');
  const $confirmed = fragment.querySelector('.dealer-scheduling__confirmed');
  const $confirmedText = fragment.querySelector('.dealer-scheduling__confirmed-text');
  const $changeBtn = fragment.querySelector('.dealer-scheduling__change-btn');
  const $dealerNameEl = fragment.querySelector('.dealer-scheduling__dealer-name');

  const data = await loadSchedule();
  const today = new Date();

  // Generate next 14 days
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
          $confirmedText.textContent = `${formattedDate} at ${time}`;
          $confirmed.hidden = false;
          $slots.hidden = true;
          $days.parentElement.hidden = true;
          document.dispatchEvent(new CustomEvent('schedule:selected', { detail: scheduleInfo }));
        });
        $slotGrid.append(slotBtn);
      });
      $slots.hidden = false;
    });

    $days.append(dayEl);
  }

  // Change button
  $changeBtn.addEventListener('click', () => {
    $confirmed.hidden = true;
    $days.parentElement.hidden = false;
    $days.querySelectorAll('.dealer-scheduling__day').forEach((d) => d.classList.remove('dealer-scheduling__day--selected'));
    $slots.hidden = true;
    sessionStorage.removeItem('selected-schedule');
  });

  // Listen for dealer changes
  document.addEventListener('dealer:selected', (e) => {
    $dealerNameEl.textContent = e.detail.name;
  });

  // Restore existing
  const existingSchedule = sessionStorage.getItem('selected-schedule');
  if (existingSchedule) {
    try {
      const sched = JSON.parse(existingSchedule);
      $confirmedText.textContent = `${sched.dateFormatted} at ${sched.time}`;
      $confirmed.hidden = false;
      $days.parentElement.hidden = true;
      $slots.hidden = true;
    } catch { /* ignore */ }
  }

  block.textContent = '';
  block.append(fragment);
}
