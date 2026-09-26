(function init() {
  if (!CONTENT) return;
  const hab = requireHabitation();
  if (!hab) return;
  CONTENT.innerHTML = document.getElementById('tpl').innerHTML;

  let wasteChart, costChart;
  const durationInput = document.getElementById('sim-duration');
  const durVal = document.getElementById('dur-val');
  durationInput.addEventListener('input', () => (durVal.textContent = durationInput.value));

  function renderSimList() {
    const all = SWMS.getStoredSimulations().filter((s) => s.habitation_id === hab.id);
    const el = document.getElementById('sim-list');
    if (!all.length) { el.innerHTML = '<p class="muted" style="font-size:12px;">None yet.</p>'; return; }
    el.innerHTML = all.map((s) => `<button type="button" data-id="${s.id}">${escapeHtml(s.name)} <span class="muted">(${s.start_year}–${s.start_year + s.duration_years - 1})</span></button>`).join('');
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sim = all.find((x) => x.id === btn.dataset.id);
        try {
          const results = sim.results || await SWMS.getSimulationResults(sim.id);
          renderResults(sim, results);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  }

  function normalizeResults(raw) {
    if (Array.isArray(raw)) {
      return raw.map((r) => ({
        year: Number(r.year),
        population: Number(r.population || 0),
        waste_tpd: Number(r.waste_tpd || 0),
        collected_tpd: Number(r.collected_tpd || 0),
        treated_tpd: Number(r.treated_tpd || 0),
        disposed_tpd: Number(r.disposed_tpd || 0),
        estimated_cost: Number(r.estimated_cost || 0),
      }));
    }
    if (raw && Array.isArray(raw.results)) return normalizeResults(raw.results);
    if (raw && Array.isArray(raw.years)) return raw.years.map((r) => ({
      year: Number(r.year), population: Number(r.population || 0),
      waste_tpd: Number(r.waste_tpd ?? r.waste_generated_tonnes ?? 0),
      collected_tpd: Number(r.collected_tpd ?? 0),
      treated_tpd: Number(r.treated_tpd ?? r.waste_treated_tonnes ?? 0),
      disposed_tpd: Number(r.disposed_tpd ?? r.waste_landfilled_tonnes ?? 0),
      estimated_cost: Number(r.estimated_cost ?? r.operational_cost ?? 0),
    }));
    return [];
  }

  function renderResults(sim, results) {
    const y = normalizeResults(results);
    if (!y.length) {
      document.getElementById('results-panel').innerHTML = `
        <div class="empty-state"><h3>No data returned</h3>
        <p>The backend completed the request but returned no yearly result rows for “${escapeHtml(sim.name)}”.</p></div>`;
      return;
    }

    const totalCost = y.reduce((sum, r) => sum + r.estimated_cost, 0);
    const peak = y.reduce((a, b) => b.waste_tpd > a.waste_tpd ? b : a, y[0]);
    const avgTreatment = y.reduce((sum, r) => sum + (r.collected_tpd ? (r.treated_tpd / r.collected_tpd) * 100 : 0), 0) / y.length;

    document.getElementById('results-panel').innerHTML = `
      <h3>${escapeHtml(sim.name)}</h3>
      <p class="muted" style="margin-bottom:16px;">${y[0].year}–${y[y.length - 1].year} · ${y.length} years</p>
      <div class="stat-row">
        <div class="stat"><div class="label">Peak waste generation</div><div class="value amber">${fmt(peak.waste_tpd)} TPD</div></div>
        <div class="stat"><div class="label">Total estimated cost</div><div class="value">₹${fmt(totalCost)}</div></div>
        <div class="stat"><div class="label">Peak year</div><div class="value teal">${peak.year}</div></div>
        <div class="stat"><div class="label">Avg. treatment rate</div><div class="value">${fmt(avgTreatment)}%</div></div>
      </div>
      <div class="chart-wrap"><canvas id="chartWaste"></canvas></div>
      <div class="chart-wrap"><canvas id="chartCost"></canvas></div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Year</th><th>Population</th><th>Waste (TPD)</th><th>Collected (TPD)</th><th>Treated (TPD)</th><th>Disposed (TPD)</th><th>Cost</th></tr></thead>
          <tbody>${y.map((r) => `<tr>
            <td>${r.year}</td><td>${fmt(r.population)}</td><td>${fmt(r.waste_tpd)}</td>
            <td>${fmt(r.collected_tpd)}</td><td>${fmt(r.treated_tpd)}</td><td>${fmt(r.disposed_tpd)}</td>
            <td>₹${fmt(r.estimated_cost)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `;
    drawCharts(y);
  }
  function drawCharts(y) {
    const labels = y.map((r) => r.year);
    const gridColor = 'rgba(147,161,154,0.15)';
    const textColor = '#93A19A';

    if (wasteChart) wasteChart.destroy();
    if (costChart) costChart.destroy();

    wasteChart = new Chart(document.getElementById('chartWaste'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Waste generated (TPD)', data: y.map((r) => r.waste_tpd), borderColor: '#D69A2D', backgroundColor: 'transparent', tension: .25 },
          { label: 'Treated (TPD)', data: y.map((r) => r.treated_tpd), borderColor: '#4F8F76', backgroundColor: 'transparent', tension: .25 },
          { label: 'Disposed (TPD)', data: y.map((r) => r.disposed_tpd), borderColor: '#C15A3D', backgroundColor: 'transparent', tension: .25 },
        ],
      },
      options: chartOpts('Waste flow by year (tonnes)', gridColor, textColor),
    });

    costChart = new Chart(document.getElementById('chartCost'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Operating cost', data: y.map((r) => r.estimated_cost), borderColor: '#D69A2D', yAxisID: 'y', tension: .25 },
          
        ],
      },
      options: {
        ...chartOpts('Cost & emissions by year', gridColor, textColor),
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { position: 'left', ticks: { color: textColor }, grid: { color: gridColor } },
        },
      },
    });
  }

  function chartOpts(title, gridColor, textColor) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, boxWidth: 12, font: { size: 11 } } },
        title: { display: true, text: title, color: '#E7E1D2', font: { size: 13, weight: '600' }, align: 'start', padding: { bottom: 12 } },
      },
      scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } },
    };
  }

  document.getElementById('sim-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('sim-name').value.trim();
    const startYearInput = document.getElementById('sim-start');
    const start_year = Number(startYearInput.value);
    const duration_years = Number(durationInput.value);
    if (!Number.isInteger(start_year) || start_year < 1900 || start_year > 2100) {
      toast('Enter a valid calendar start year between 1900 and 2100.', 'error');
      startYearInput.focus();
      return;
    }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Running…';
    try {
      const sim = await SWMS.createSimulation({ habitation_id: hab.id, name, start_year, duration_years });
      const results = sim.results || await SWMS.getSimulationResults(sim.id);
      toast(`“${name}” complete.`);
      renderSimList();
      renderResults(sim, results);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Run simulation';
    }
  });

  renderSimList();
})();
