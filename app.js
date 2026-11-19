const courses = [
  { id: 'ume', minutes: 30, frame: 40, name: '梅コース', desc: '時間がないけど不調を軽くしたい方向け', price: 3500 },
  { id: 'take', minutes: 60, frame: 70, name: '竹コース', desc: '慢性的な疲れや不調の根本ケアをしたい方向け', price: 6800, recommended: true },
  { id: 'matsu', minutes: 80, frame: 90, name: '松コース', desc: 'しっかり時間をかけて本格的に改善したい方向け', price: 9000 }
];

const state = { course: null, afterTea: false, date: null, time: null, calendarCursor: null };
const yen = new Intl.NumberFormat('ja-JP');
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const courseList = document.querySelector('#courseList');
const dateStrip = document.querySelector('#dateStrip');
const timeGrid = document.querySelector('#timeGrid');
const nextButton = document.querySelector('#nextButton');
const modal = document.querySelector('#formModal');

courses.forEach(course => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'course-card';
  button.dataset.id = course.id;
  button.innerHTML = `<span class="course-time">約${course.minutes}分${course.recommended ? '・おすすめ' : ''}</span><h3>${course.name}</h3><p>${course.desc}</p><span class="price">${yen.format(course.price)}円</span>`;
  button.addEventListener('click', () => selectCourse(course));
  courseList.appendChild(button);
});

document.querySelector('#afterTeaOption').addEventListener('change', event => {
  state.afterTea = event.target.checked;
  state.time = null;
  document.querySelector('#afterTeaCard').classList.toggle('selected', state.afterTea);
  if (state.date) renderTimes();
  updateSummary();
});

const bookableDates = [];
for (let i = 1; i <= 60; i++) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + i);
  bookableDates.push({ date, key: dateKey(date), closed: date.getDay() === 0 });
}
state.calendarCursor = new Date(bookableDates[0].date.getFullYear(), bookableDates[0].date.getMonth(), 1);
document.querySelector('#prevMonth').addEventListener('click', () => changeMonth(-1));
document.querySelector('#nextMonth').addEventListener('click', () => changeMonth(1));
renderCalendar();

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function changeMonth(offset) {
  state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() + offset, 1);
  renderCalendar();
}

function renderCalendar() {
  const year = state.calendarCursor.getFullYear();
  const month = state.calendarCursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const availableMap = new Map(bookableDates.map(item => [item.key, item]));
  dateStrip.innerHTML = '';
  document.querySelector('#calendarMonth').textContent = `${year}年${month + 1}月`;
  for (let i = 0; i < first.getDay(); i++) dateStrip.appendChild(document.createElement('span'));
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const item = availableMap.get(dateKey(date));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-button';
    if (date.getDay() === 0) button.classList.add('sunday');
    if (date.getDay() === 6) button.classList.add('saturday');
    button.disabled = !item || item.closed;
    button.classList.toggle('selected', state.date && dateKey(state.date) === dateKey(date));
    button.innerHTML = `<b>${day}</b>${item?.closed ? '<small>休</small>' : ''}`;
    if (item && !item.closed) button.addEventListener('click', () => selectDate(item.date, button));
    dateStrip.appendChild(button);
  }
  const firstMonth = bookableDates[0].date.getFullYear() * 12 + bookableDates[0].date.getMonth();
  const last = bookableDates[bookableDates.length - 1].date;
  const lastMonth = last.getFullYear() * 12 + last.getMonth();
  const currentMonth = year * 12 + month;
  document.querySelector('#prevMonth').disabled = currentMonth <= firstMonth;
  document.querySelector('#nextMonth').disabled = currentMonth >= lastMonth;
}

function selectCourse(course) {
  state.course = course;
  state.time = null;
  document.querySelectorAll('.course-card').forEach(el => el.classList.toggle('selected', el.dataset.id === course.id));
  if (state.date) renderTimes();
  updateSummary();
}

function selectDate(date, button) {
  state.date = date;
  state.time = null;
  document.querySelectorAll('.date-button').forEach(el => el.classList.toggle('selected', el === button));
  document.querySelector('#selectedDateLabel').textContent = `${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  renderTimes();
  updateSummary();
}

function renderTimes() {
  timeGrid.innerHTML = '';
  if (!state.course) {
    timeGrid.innerHTML = '<p class="empty">先にコースを選択してください。</p>';
    return;
  }
  const openingMinutes = 8 * 60 + 30;
  const closingMinutes = 21 * 60;
  const blocked = state.date?.getDay() === 6
    ? [{ start: 10 * 60 + 40, end: 12 * 60 }, { start: 16 * 60 + 30, end: 17 * 60 + 40 }]
    : [];
  const times = [];
  const frameMinutes = state.course.frame + (state.afterTea ? 10 : 0);
  for (let start = openingMinutes; start < closingMinutes; start += 10) {
    const end = start + frameMinutes;
    if (!blocked.some(item => start < item.end && end > item.start)) {
      times.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
    }
  }
  const hours = [...new Set(times.map(time => Number(time.slice(0, 2))))];
  hours.forEach(hour => {
    const hourTimes = times.filter(time => Number(time.slice(0, 2)) === hour);
    const section = document.createElement('section');
    section.className = 'time-period';
    section.innerHTML = '<div class="time-period-grid"></div>';
    const grid = section.querySelector('.time-period-grid');
    hourTimes.forEach(time => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-button';
      button.textContent = time;
      button.addEventListener('click', () => {
        state.time = time;
        document.querySelectorAll('.time-button').forEach(el => el.classList.toggle('selected', el === button));
        updateSummary();
      });
      grid.appendChild(button);
    });
    timeGrid.appendChild(section);
  });
}

function updateSummary() {
  const totalMinutes = state.course ? state.course.minutes + (state.afterTea ? 10 : 0) : 0;
  const totalPrice = state.course ? state.course.price + (state.afterTea ? 500 : 0) : 0;
  document.querySelector('#summaryCourse').textContent = state.course ? `${state.course.name}（${yen.format(totalPrice)}円）` : '未選択';
  document.querySelector('#summaryOption').textContent = state.afterTea ? 'アフターティー（＋10分・＋500円）' : 'なし';
  document.querySelector('#summaryDuration').textContent = state.course ? `約${totalMinutes}分` : '—';
  document.querySelector('#summaryDate').textContent = state.date && state.time ? formatBooking() : '未選択';
  nextButton.disabled = !(state.course && state.date && state.time);
}

function formatBooking() {
  return `${state.date.getFullYear()}年${state.date.getMonth() + 1}月${state.date.getDate()}日（${weekdays[state.date.getDay()]}） ${state.time}`;
}

nextButton.addEventListener('click', () => {
  const option = state.afterTea ? '・アフターティー付き' : '';
  document.querySelector('#modalBooking').textContent = `${state.course.name}${option}・${formatBooking()}（約${state.course.minutes + (state.afterTea ? 10 : 0)}分）`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('#bookingForm input').focus();
});

function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); nextButton.focus(); }
document.querySelector('#closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

document.querySelector('#bookingForm').addEventListener('submit', event => {
  event.preventDefault();
  closeModal();
  showToast('予約内容を確認しました。これはサンプルのため予約は送信されません。');
});

document.querySelector('#historyButton').addEventListener('click', () => showToast('予約確認・変更機能は次の画面で実装予定です。'));
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3400); }
