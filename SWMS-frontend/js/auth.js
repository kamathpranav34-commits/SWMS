// ---- category chips ----
document.getElementById('cat-chips').innerHTML = SWMS.CATEGORIES
  .map((c) => `<span>${c.label}</span>`).join('');

// ---- year ticker hero animation ----
(function runTicker() {
  const el = document.getElementById('ticker');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { el.textContent = '20'; return; }
  let year = 1;
  const total = 20;
  const stepMs = 90;
  const grow = setInterval(() => {
    year++;
    el.textContent = String(year).padStart(2, '0');
    if (year >= total) {
      clearInterval(grow);
      setTimeout(loop, 1400);
    }
  }, stepMs);
  function loop() {
    let y = total;
    const shrink = setInterval(() => {
      y--;
      el.textContent = String(Math.max(y, 1)).padStart(2, '0');
      if (y <= 1) {
        clearInterval(shrink);
        setTimeout(() => {
          year = 1;
          el.textContent = '01';
          const grow2 = setInterval(() => {
            year++;
            el.textContent = String(year).padStart(2, '0');
            if (year >= total) { clearInterval(grow2); setTimeout(loop, 1400); }
          }, stepMs);
        }, 900);
      }
    }, stepMs / 2);
  }
})();

// ---- tabs ----
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const panelLogin = document.getElementById('panel-login');
const panelRegister = document.getElementById('panel-register');
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active'); tabRegister.classList.remove('active');
  panelLogin.classList.add('active'); panelRegister.classList.remove('active');
});
tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active'); tabLogin.classList.remove('active');
  panelRegister.classList.add('active'); panelLogin.classList.remove('active');
});

// ---- lightweight local toast (avoids depending on the app shell) ----
function localToast(msg, type = 'ok') {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

// ---- api base ----
const apiBaseInput = document.getElementById('api-base');
apiBaseInput.value = SWMS.getBase();
document.getElementById('save-base').addEventListener('click', () => {
  SWMS.setBase(apiBaseInput.value.trim());
  localToast('Backend URL saved.');
});

// ---- login ----
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-password').value;
  try {
    await SWMS.login(email, password);
    localToast('Signed in.');
    window.location.href = 'dashboard.html';
  } catch (err) {
    localToast(err.message, 'error');
  }
});

// ---- register ----
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('re-email').value.trim();
  const password = document.getElementById('re-password').value;
  const role = document.getElementById('re-role').value;
  try {
    await SWMS.register(email, password, role);
    localToast('Account created.');
    window.location.href = 'dashboard.html';
  } catch (err) {
    localToast(err.message, 'error');
  }
});

// Presentation build always uses the live backend.
SWMS.setDemo(false);

// already signed in? skip straight to dashboard
if (SWMS.isAuthed()) {
  // don't force-redirect automatically to avoid surprising a user who wants
  // to switch accounts — but make it a one-click option instead.
}
