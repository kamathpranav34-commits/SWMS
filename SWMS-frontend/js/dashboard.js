(function init() {
  if (!CONTENT) return;
  CONTENT.innerHTML = document.getElementById('tpl').innerHTML;

  const geoKey = (id) => `swms_hab_geo_${id}`;
  let map, marker;

  function saveGeo(id, lat, lng) {
    if (lat && lng) localStorage.setItem(geoKey(id), JSON.stringify({ lat: Number(lat), lng: Number(lng) }));
  }
  function loadGeo(id) {
    const raw = localStorage.getItem(geoKey(id));
    return raw ? JSON.parse(raw) : null;
  }

  function initMap() {
    map = L.map('leaflet-map', { zoomControl: false, attributionControl: false }).setView([13.3409, 74.7421], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17 }).addTo(map);
  }

  function setMarker(lat, lng, label) {
    if (!map) return;
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map).bindPopup(label || 'Habitation');
    map.setView([lat, lng], 12);
  }

  async function renderStats() {
    const hab = SWMS.getHabitation();
    const el = document.getElementById('stat-row');
    if (!hab) { el.innerHTML = ''; return; }
    const params = SWMS.getStoredParameters(hab.id);
    const filled = SWMS.CATEGORIES.filter((c) => params[c.key]).length;
    const sims = SWMS.getStoredSimulations().filter((s) => s.habitation_id === hab.id);
    const scenarios = SWMS.getStoredScenarios();
    const pop = params.demography ? params.demography.population : null;

    el.innerHTML = `
      <div class="stat"><div class="label">Population on record</div><div class="value">${pop ? fmt(pop) : '—'}</div></div>
      <div class="stat"><div class="label">Categories filled</div><div class="value teal">${filled}/7</div></div>
      <div class="stat"><div class="label">Simulations run</div><div class="value amber">${sims.length}</div></div>
      <div class="stat"><div class="label">Scenarios explored</div><div class="value">${scenarios.length}</div></div>
    `;
  }

  function renderChecklist() {
    const hab = SWMS.getHabitation();
    const el = document.getElementById('cat-checklist');
    const params = hab ? SWMS.getStoredParameters(hab.id) : {};
    el.innerHTML = SWMS.CATEGORIES.map((c, i) => `
      <a class="check-item ${params[c.key] ? 'filled' : ''}" href="parameters.html?cat=${c.key}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="dot"></span>
        <span class="name">${c.label}</span>
        <span class="go">${params[c.key] ? 'edit' : 'set up'}</span>
      </a>`).join('');
  }

  async function renderHabList() {
    const list = await SWMS.listHabitations();
    const hab = SWMS.getHabitation();
    const el = document.getElementById('hab-list');
    if (!list.length) { el.innerHTML = ''; return; }
    el.innerHTML = list.map((h) => `
      <button type="button" data-id="${h.id}" class="${hab && hab.id === h.id ? 'current' : ''}">
        ${escapeHtml(h.name)}<span class="lv">${escapeHtml(h.level || '')}</span>
      </button>`).join('');
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const h = list.find((x) => x.id === btn.dataset.id);
        SWMS.setHabitation(h);
        toast(`Switched to ${h.name}.`);
        afterHabitationChange();
      });
    });
  }

  function afterHabitationChange() {
    const hab = SWMS.getHabitation();
    document.getElementById('hab-title').textContent = hab ? hab.name : 'No habitation yet';
    document.getElementById('hab-desc').textContent = hab
      ? (hab.description || `${hab.level || 'Habitation'} · id ${hab.id}`)
      : 'Create one to begin — a village, ward or municipality you want to model.';
    renderStats();
    renderChecklist();
    renderHabList();
    if (hab) {
      const geo = loadGeo(hab.id);
      if (geo) setMarker(geo.lat, geo.lng, hab.name);
    }
    // refresh the sidebar chip without a full reload
    const chip = document.querySelector('.habitation-chip .name');
    if (chip) chip.textContent = hab ? hab.name : 'None selected';
    const badge = document.querySelector('.demo-badge');
    if (badge) badge.classList.toggle('show', SWMS.isDemo());
  }

  document.getElementById('hab-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('hab-name').value.trim();
    const level = document.getElementById('hab-level').value;
    const description = document.getElementById('hab-desc-input').value.trim();
    const lat = document.getElementById('hab-lat').value.trim();
    const lng = document.getElementById('hab-lng').value.trim();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const hab = await SWMS.createHabitation({ name, level, description });
      saveGeo(hab.id, lat, lng);
      toast(`${hab.name} created.`);
      e.target.reset();
      afterHabitationChange();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Create habitation';
    }
  });

  initMap();
  afterHabitationChange();
})();
