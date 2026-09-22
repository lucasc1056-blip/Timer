const display = document.querySelector('#timeDisplay');
const ring = document.querySelector('#timerRing');
const start = document.querySelector('#startButton');
const reset = document.querySelector('#resetButton');
const status = document.querySelector('#statusText');
const phase = document.querySelector('#phaseDisplay');
const footer = document.querySelector('#footerText');
const soundToggle = document.querySelector('#soundToggle');
let total = 25 * 60, remaining = total, interval = null, soundOn = true;
const authModal = document.querySelector('#authModal');
let accountMode = localStorage.getItem('focusAccount') === 'true';
const todayKey = () => new Date().toISOString().slice(0, 10);
const completedToday = () => localStorage.getItem('focusCompleted') === todayKey();
const accountTools = document.querySelector('#accountTools');
function applyAccountMode() { accountTools.hidden = !accountMode; document.querySelector('#accountButton').textContent = accountMode ? 'Account mode' : 'Unlock account'; if (accountMode) renderDaily(); }

function render() {
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  display.textContent = `${mins}:${secs}`;
  const progress = total ? remaining / total : 0;
  const edge = Math.max(0, progress * 100);
  ring.style.background = `conic-gradient(#d6a45f 0 ${edge}%, #75451f ${edge}% 100%)`;
  document.title = `${mins}:${secs} · Focus Timer`;
}
function finish() {
  clearInterval(interval); interval = null; remaining = 0; render();
  start.textContent = 'Start again'; status.textContent = 'Session complete. Nice work.'; phase.textContent = 'COMPLETE'; footer.textContent = 'Take a breath before the next thing.';
  localStorage.setItem('focusCompleted', todayKey());
  if (accountMode && document.querySelector('#alarmToggle').checked) { try { const audio = new AudioContext(); const oscillator = audio.createOscillator(); oscillator.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .35); } catch (_) {} }
  if (soundOn && 'Notification' in window && Notification.permission === 'granted') new Notification('Focus Timer', { body: 'Your session is complete.' });
}
start.addEventListener('click', () => {
  if (!interval && !accountMode && completedToday()) { status.textContent = 'Your free session is used for today.'; footer.textContent = 'Unlock account mode for daily timers.'; return; }
  if (interval) { clearInterval(interval); interval = null; start.textContent = 'Resume'; status.textContent = 'Paused. Pick up when you’re ready.'; return; }
  if (remaining === 0) remaining = total;
  start.textContent = 'Pause'; status.textContent = 'You’re in the zone.'; phase.textContent = 'FOCUS SESSION';
  if (soundOn && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  interval = setInterval(() => { remaining--; render(); if (remaining <= 0) finish(); }, 1000);
});
reset.addEventListener('click', () => { clearInterval(interval); interval = null; remaining = total; start.textContent = 'Start timer'; status.textContent = 'Ready when you are.'; phase.textContent = 'FOCUS SESSION'; footer.textContent = 'One thing at a time.'; render(); });
document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => { total = Number(button.dataset.minutes) * 60; remaining = total; clearInterval(interval); interval = null; start.textContent = 'Start timer'; status.textContent = 'Ready when you are.'; document.querySelectorAll('.preset').forEach(p => p.classList.remove('active')); button.classList.add('active'); render(); }));
soundToggle.addEventListener('click', () => { soundOn = !soundOn; soundToggle.textContent = soundOn ? '🔔' : '🔕'; soundToggle.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound'); });
document.querySelector('#setCustomButton').addEventListener('click', () => { const minutes = Math.max(0, Number(document.querySelector('#customMinutes').value || 0)); const seconds = Math.min(59, Math.max(0, Number(document.querySelector('#customSeconds').value || 0))); if (minutes === 0 && seconds === 0) { document.querySelector('#inputNote').textContent = 'Please enter at least one minute or second.'; return; } total = minutes * 60 + seconds; remaining = total; clearInterval(interval); interval = null; start.textContent = 'Start timer'; status.textContent = 'Ready when you are.'; document.querySelector('#inputNote').textContent = 'Custom duration set.'; document.querySelectorAll('.preset').forEach(p => p.classList.remove('active')); render(); });
document.querySelector('#accountButton').addEventListener('click', () => { authModal.hidden = false; document.querySelector('#codeInput').focus(); });
document.querySelector('#closeAuth').addEventListener('click', () => { authModal.hidden = true; });
document.querySelector('#codeForm').addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#accountButton').textContent = 'Unlocked'; authModal.hidden = true; });
document.querySelector('#codeForm').addEventListener('submit', () => { accountMode = true; localStorage.setItem('focusAccount', 'true'); applyAccountMode(); });
document.querySelector('#colorPicker').addEventListener('input', (event) => { document.documentElement.style.setProperty('--green', event.target.value); localStorage.setItem('focusColor', event.target.value); });
function renderDaily() { const list = document.querySelector('#dailyList'); const items = JSON.parse(localStorage.getItem('focusDaily') || '[]'); document.querySelector('#dailyCount').textContent = `${items.length} saved`; list.innerHTML = items.map((item, i) => `<div class="daily-item"><span><strong>${item.name}</strong> · ${item.minutes} min</span><button data-index="${i}">Start</button></div>`).join(''); list.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { const item = items[button.dataset.index]; total = item.minutes * 60; remaining = total; clearInterval(interval); interval = null; start.textContent = 'Start timer'; status.textContent = `${item.name} is ready.`; render(); })); }
document.querySelector('#addDaily').addEventListener('click', () => { const name = document.querySelector('#dailyName').value.trim() || 'Daily focus'; const minutes = Number(document.querySelector('#dailyMinutes').value); if (!minutes || minutes < 1) return; const items = JSON.parse(localStorage.getItem('focusDaily') || '[]'); items.push({ name, minutes }); localStorage.setItem('focusDaily', JSON.stringify(items)); document.querySelector('#dailyName').value = ''; document.querySelector('#dailyMinutes').value = ''; renderDaily(); });
const savedColor = localStorage.getItem('focusColor'); if (savedColor) { document.documentElement.style.setProperty('--green', savedColor); document.querySelector('#colorPicker').value = savedColor; } applyAccountMode();
render();
