const courses = [
  { id: 'short', minutes: 30, frame: 45, name: '部分ケア', desc: '気になる箇所を中心に整えます', price: '4,500円' },
  { id: 'standard', minutes: 60, frame: 75, name: '全身整体', desc: '全身の状態を確認し、丁寧に整えます', price: '7,500円', recommended: true },
  { id: 'long', minutes: 80, frame: 95, name: 'じっくり整体', desc: 'お悩みを伺いながら時間をかけて整えます', price: '9,500円' }
];

const state = { course: null, date: null, time: null };
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
  button.innerHTML = `<span class="course-time">${course.minutes}分${course.recommended ? '・おすすめ' : ''}</span><h3>${course.name}</h3><p>${course.desc}</p><span class="price">${course.price}</span>`;
  button.addEventListener('click', () => selectCourse(course));
  courseList.appendChild(button);
});

for (let i = 1; i <= 7; i++) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + i);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'date-button';
  button.dataset.date = date.toISOString();
  button.innerHTML = `<span>${date.getMonth() + 1}月</span><b>${date.getDate()}</b><small>${weekdays[date.getDay()]}・○</small>`;
  button.addEventListener('click', () => selectDate(date, button));
  dateStrip.appendChild(button);
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
  const times = state.course?.minutes === 80 ? ['09:30', '11:30', '14:30', '16:30'] : ['09:30', '10:45', '12:00', '14:00', '15:15', '16:30', '18:00'];
  times.forEach((time, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-button';
    button.textContent = time;
    if (state.date && state.date.getDay() === 6 && index === times.length - 1) { button.disabled = true; button.textContent = '満席'; }
    button.addEventListener('click', () => {
      state.time = time;
      document.querySelectorAll('.time-button').forEach(el => el.classList.toggle('selected', el === button));
      updateSummary();
    });
    timeGrid.appendChild(button);
  });
}

function updateSummary() {
  document.querySelector('#summaryCourse').textContent = state.course ? `${state.course.name}（${state.course.price}）` : '未選択';
  document.querySelector('#summaryDuration').textContent = state.course ? `施術 ${state.course.minutes}分／予約枠 ${state.course.frame}分` : '—';
  document.querySelector('#summaryDate').textContent = state.date && state.time ? formatBooking() : '未選択';
  nextButton.disabled = !(state.course && state.date && state.time);
}

function formatBooking() {
  return `${state.date.getFullYear()}年${state.date.getMonth() + 1}月${state.date.getDate()}日（${weekdays[state.date.getDay()]}） ${state.time}`;
}

nextButton.addEventListener('click', () => {
  document.querySelector('#modalBooking').textContent = `${state.course.name}・${formatBooking()}（施術${state.course.minutes}分）`;
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
