(function init() {
  if (!CONTENT) return;
  const hab = requireHabitation();
  if (!hab) return;
  CONTENT.innerHTML = document.getElementById('tpl').innerHTML;

  let compareChart;
  const sims = SWMS.getStoredSimulations().filter((s) => s.habitation_id === hab.id);
  const baseSelect = document.getElementById('sc-base');

  if (!sims.length) {
    document.getElementById('no-sim-warning').style.display = 'block';
    document.getElementById('sc-form').style.display = 'none';
  } else {
    baseSelect.innerHTML = sims.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  }

  const PARAM_FIELDS = {
    POPULATION_SURGE: { key: 'increase_percent', label: 'Population increase (%)', def: 20 },
    ROAD_BLOCKAGE: { key: 'collection_reduction_percent', label: 'Collection reduction (%)', def: 25 },
    FLOOD: { key: 'waste_collection_disruption_percent', label: 'Collection disruption (%)', def: 30 },
  };

  function renderParamField() {
    const type = document.getElementById('sc-type').value;
    const cfg = PARAM_FIELDS[type];
    document.getElementById('sc-param-field').innerHTML = `
      <label for="sc-param-val">${cfg.label}</label>
      <input type="number" step="0.1" id="sc-param-val" value="${cfg.def}">`;
  }
  document.getElementById('sc-type').addEventListener('change', renderParamField);
  if (sims.length) renderParamField();

  function renderScList() {
    const all = SWMS.getStoredScenarios().filter((s) => sims.some((sim) => sim.id === s.simulation_id));
    const el = document.getElementById('sc-list');
    if (!all.length) { el.innerHTML = '<p class="muted" style="font-size:12px;">None yet.</p>'; return; }
    el.innerHTML = all.map((s) => `<button type="button" data-id="${s.id}">${escapeHtml(s.name)}</button>`).join('');
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sc = all.find((x) => x.id === btn.dataset.id);
        const baseline = sims.find((s) => s.id === sc.simulation_id);
        try {
          const results = sc.results || await SWMS.runScenario(sc.id);
          const baseResults = baseline.results || await SWMS.getSimulationResults(baseline.id);
          renderComparison(sc, baseline, baseResults, results);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  }

  function normalizeResults(raw) {
    const rows = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.results) ? raw.results : []);
    return rows.map((r) => ({
      year: Number(r.year), population: Number(r.population || 0),
      waste_tpd: Number(r.waste_tpd || 0), collected_tpd: Number(r.collected_tpd || 0),
      treated_tpd: Number(r.treated_tpd || 0), disposed_tpd: Number(r.disposed_tpd || 0),
      estimated_cost: Number(r.estimated_cost || 0),
    }));
  }

  function renderComparison(sc, baseline, baseResults, scResults) {
    const by = normalizeResults(baseResults), sy = normalizeResults(scResults);
    if (!by.length || !sy.length) {
      document.getElementById('sc-results').innerHTML = '<div class="empty-state"><h3>No scenario results</h3><p>The backend did not return yearly scenario rows.</p></div>';
      return;
    }
    const labels = by.map((r) => r.year);
    const bTotal = by.reduce((sum, r) => sum + r.waste_tpd, 0);
    const sTotal = sy.reduce((sum, r) => sum + r.waste_tpd, 0);
    const bCost = by.reduce((sum, r) => sum + r.estimated_cost, 0);
    const sCost = sy.reduce((sum, r) => sum + r.estimated_cost, 0);
    const wasteDelta = (((sTotal - bTotal) / bTotal) * 100).toFixed(1);
    const costDelta = (((sCost - bCost) / bCost) * 100).toFixed(1);

    document.getElementById('sc-results').innerHTML = `
      <h3>${escapeHtml(sc.name)}</h3>
      <p class="muted" style="margin-bottom:16px;">vs. baseline “${escapeHtml(baseline.name)}”</p>
      <div class="stat-row">
        <div class="stat"><div class="label">Waste vs baseline</div><div class="value ${wasteDelta >= 0 ? 'rust' : 'teal'}">${wasteDelta > 0 ? '+' : ''}${wasteDelta}%</div></div>
        <div class="stat"><div class="label">Cost vs baseline</div><div class="value ${costDelta >= 0 ? 'rust' : 'teal'}">${costDelta > 0 ? '+' : ''}${costDelta}%</div></div>
        <div class="stat"><div class="label">Baseline total waste</div><div class="value">${fmt(bTotal)} t</div></div>
        <div class="stat"><div class="label">Scenario total waste</div><div class="value amber">${fmt(sTotal)} t</div></div>
      </div>
      <div class="chart-wrap"><canvas id="chartCompare"></canvas></div>
    `;

    if (compareChart) compareChart.destroy();
    const textColor = '#93A19A';
    compareChart = new Chart(document.getElementById('chartCompare'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Baseline waste (t)', data: by.map((r) => r.waste_tpd), borderColor: '#93A19A', borderDash: [4, 3], tension: .25 },
          { label: `${sc.name} (t)`, data: sy.map((r) => r.waste_tpd), borderColor: '#D69A2D', tension: .25 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, boxWidth: 12, font: { size: 11 } } },
          title: { display: true, text: 'Waste generated: baseline vs. scenario', color: '#E7E1D2', font: { size: 13, weight: '600' }, align: 'start', padding: { bottom: 12 } },
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: 'rgba(147,161,154,0.15)' } },
          y: { ticks: { color: textColor }, grid: { color: 'rgba(147,161,154,0.15)' } },
        },
      },
    });
  }

  if (sims.length) {
    document.getElementById('sc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const simulation_id = baseSelect.value;
      const name = document.getElementById('sc-name').value.trim();
      const scenario_type = document.getElementById('sc-type').value;
      const cfg = PARAM_FIELDS[scenario_type];
      const parameters = { [cfg.key]: Number(document.getElementById('sc-param-val').value) };
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Running…';
      try {
        const sc = await SWMS.createScenario({ simulation_id, name, scenario_type, parameters });
        const results = await SWMS.runScenario(sc.id);
        const baseline = sims.find((s) => s.id === simulation_id);
        const baseResults = baseline.results || await SWMS.getSimulationResults(baseline.id);
        toast(`“${name}” run complete.`);
        renderScList();
        renderComparison(sc, baseline, baseResults, results);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Run scenario';
      }
    });
  }

  renderScList();
})();
