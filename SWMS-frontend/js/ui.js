/* Shared chrome used by every page except index.html */

function toast(message, type = 'ok') {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}

const NAV_ITEMS = [
  { href: 'dashboard.html', label: 'Dashboard', num: '00' },
  { href: 'parameters.html', label: 'Parameters', num: '01–07' },
  { href: 'simulation.html', label: 'Simulation', num: '08' },
  { href: 'scenario.html', label: 'Scenarios', num: '09' },
];

function renderShell(activeHref) {
  if (!SWMS.isAuthed()) {
    window.location.href = 'index.html';
    return;
  }
  const hab = SWMS.getHabitation();
  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const navHtml = NAV_ITEMS.map((item) => `
    <a href="${item.href}" class="${item.href === activeHref ? 'active' : ''}">
      <span class="num">${item.num}</span>${item.label}
    </a>`).join('');

  shell.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark"></span>
        <span class="brand-name">SWMS</span>
      </div>
      <div class="brand-sub">Smart Waste Management<br>Simulator — planning console</div>
      <nav class="sidenav">${navHtml}</nav>
      <div class="sidebar-foot">
        <div class="habitation-chip">
          <div class="label">Active habitation</div>
          <div class="name">${hab ? escapeHtml(hab.name) : 'None selected'}</div>
        </div>
        
        <button class="btn btn-ghost btn-sm" id="logout-btn" type="button">Sign out</button>
      </div>
    </aside>
    <main class="main" id="main-content"></main>
  `;
  document.body.prepend(shell);
  document.getElementById('logout-btn').addEventListener('click', () => {
    SWMS.setToken('');
    window.location.href = 'index.html';
  });
  return document.getElementById('main-content');
}

function requireHabitation() {
  const hab = SWMS.getHabitation();
  if (!hab) {
    toast('Create or select a habitation on the Dashboard first.', 'error');
    setTimeout(() => (window.location.href = 'dashboard.html'), 900);
    return null;
  }
  return hab;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
}
