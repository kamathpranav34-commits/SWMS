(function init() {
  if (!CONTENT) return;
  const hab = requireHabitation();
  if (!hab) return;
  CONTENT.innerHTML = document.getElementById('tpl').innerHTML;

  const HINTS = {
    demography: 'Population size, growth and per-capita waste generation drive the domestic-waste curve.',
    community_infrastructure: 'Collection, transfer and recycling capacity — how well the habitation can process what it generates.',
    industrial_activities: 'Waste and emissions contributed by local industry, separate from household waste.',
    natural_resources: 'Water bodies, forest cover and groundwater sensitivity — constraints on where waste can go.',
    terrain: 'Elevation, terrain type and accessibility — affects landfill siting and collection-route cost.',
    economic_conditions: 'Cost per tonne, inflation and budget — turns tonnage into a real operating cost.',
    cultural_significance: 'Heritage sites and community engagement — factors that shape public acceptance of siting decisions.',
  };

  const DEFAULT_FIELDS = {
    demography: [
      ['population', 12000], ['growth_rate', 0.02],
      ['waste_per_person_kg_day', 0.45], ['household_count', 2600],
    ],
    community_infrastructure: [
      ['collection_efficiency', 0.85], ['treatment_efficiency', 0.60],
    ],
    industrial_activities: [
      ['industrial_waste_tonnes_year', 400], ['growth_rate', 0.015],
      ['industry_count', 6], ['hazardous_waste_pct', 3],
    ],
    natural_resources: [
      ['water_bodies_nearby', 2], ['forest_cover_pct', 28], ['groundwater_sensitivity', 'medium'],
    ],
    terrain: [
      ['landfill_capacity_index', 0.7], ['avg_elevation_m', 45],
      ['terrain_type', 'coastal plain'], ['road_accessibility_index', 0.8],
    ],
    economic_conditions: [
      ['collection_cost_per_ton', 700], ['disposal_cost_per_ton', 1000],
    ],
    cultural_significance: [
      ['heritage_sites_count', 1], ['community_engagement_index', 0.6],
      ['religious_events_waste_multiplier', 1.3],
    ],
  };

  let active = new URLSearchParams(location.search).get('cat') || SWMS.CATEGORIES[0].key;
  const stored = SWMS.getStoredParameters(hab.id);

  function renderTabs() {
    document.getElementById('cat-tabs').innerHTML = SWMS.CATEGORIES.map((c, i) => `
      <button type="button" class="cat-tab ${c.key === active ? 'active' : ''} ${stored[c.key] ? 'done' : ''}" data-key="${c.key}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>${c.label}
      </button>`).join('');
    document.querySelectorAll('.cat-tab').forEach((btn) => {
      btn.addEventListener('click', () => { active = btn.dataset.key; renderTabs(); renderForm(); });
    });
  }

  function renderForm() {
    const cat = SWMS.CATEGORIES.find((c) => c.key === active);
    document.getElementById('cat-title').textContent = cat.label;
    document.getElementById('cat-hint').textContent = HINTS[cat.key] || '';
    document.getElementById('save-hint').textContent = '';

    const existing = stored[cat.key];
    const pairs = existing
      ? Object.entries(existing)
      : DEFAULT_FIELDS[cat.key].map(([k, v]) => [k, v]);

    const rows = document.getElementById('kv-rows');
    rows.innerHTML = '';
    pairs.forEach(([k, v]) => addRow(k, v));
    if (!pairs.length) addRow('', '');
  }

  function addRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input type="text" placeholder="field name" value="${escapeHtml(key)}" class="kv-key" style="flex:1.1;">
      <input type="text" placeholder="value" value="${escapeHtml(String(value))}" class="kv-val" style="flex:1;">
      <button type="button" class="rm" title="Remove">×</button>`;
    row.querySelector('.rm').addEventListener('click', () => row.remove());
    document.getElementById('kv-rows').appendChild(row);
  }

  document.getElementById('add-row').addEventListener('click', () => addRow());

  document.getElementById('save-cat').addEventListener('click', async () => {
    const data = {};
    document.querySelectorAll('.kv-row').forEach((row) => {
      const key = row.querySelector('.kv-key').value.trim();
      const rawVal = row.querySelector('.kv-val').value.trim();
      if (!key) return;
      const num = Number(rawVal);
      data[key] = rawVal !== '' && !Number.isNaN(num) ? num : rawVal;
    });
    try {
      await SWMS.setParameters(hab.id, active, data);
      stored[active] = data;
      toast(`${SWMS.CATEGORIES.find((c) => c.key === active).label} saved.`);
      document.getElementById('save-hint').textContent = 'Saved.';
      renderTabs();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  renderTabs();
  renderForm();
})();
