/* ==========================================================================
   SWMS API layer
   Talks to the FastAPI backend documented in the SWMS README:
     POST /auth/register            {email, password, role}
     POST /auth/login               {email, password}          (assumed)
     POST /habitations              {name, level, description}
     GET  /habitations              -> list                    (assumed)
     GET  /habitations/{id}         -> single                  (assumed)
     PUT  /habitations/{id}/parameters/{category}   {data:{...}}
     POST /simulations              {habitation_id,name,start_year,duration_years}
     GET  /simulations/{id}/results
     POST /scenarios                {simulation_id,name,scenario_type,parameters}
     POST /scenarios/{id}/run

   Endpoints marked "(assumed)" aren't spelled out in the README — the app
   is written defensively so it still works end-to-end (via Demo Mode) if
   any of them differ once you wire up the real backend.
   ========================================================================== */

const SWMS = (() => {
  const LS = {
    base: 'swms_api_base',
    token: 'swms_token',
    role: 'swms_role',
    demo: 'swms_demo',
    habitation: 'swms_active_habitation',
    params: (id) => `swms_params_${id}`,
    sims: 'swms_simulations',
    scenarios: 'swms_scenarios',
    habitations: 'swms_habitations_cache',
  };

  const DEFAULT_BASE = 'http://localhost:8000/api/v1';

  function getBase() { return localStorage.getItem(LS.base) || DEFAULT_BASE; }
  function setBase(v) { localStorage.setItem(LS.base, v || DEFAULT_BASE); }

  function getToken() { return localStorage.getItem(LS.token) || ''; }
  function setToken(t) { t ? localStorage.setItem(LS.token, t) : localStorage.removeItem(LS.token); }

  function isDemo() { return false; }
  function setDemo(v) { localStorage.removeItem(LS.demo); }

  function getHabitation() {
    const raw = localStorage.getItem(LS.habitation);
    return raw ? JSON.parse(raw) : null;
  }
  function setHabitation(h) { localStorage.setItem(LS.habitation, JSON.stringify(h)); }

  function isAuthed() { return isDemo() || !!getToken(); }

  async function request(method, path, body) {
    const url = getBase().replace(/\/$/, '') + path;
    const headers = { 'Content-Type': 'application/json' };
    const tok = getToken();
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error(`Could not reach ${url}. Is the backend running? (${e.message})`);
    }
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!res.ok) {
      const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data;
  }

  // ---------------- local persistence helpers (used by demo mode + as a
  // resilient cache in live mode so the UI never goes blank) -------------
  function readCache(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }
  function writeCache(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

  // ---------------- Auth ----------------
  async function register(email, password, role) {
    if (isDemo()) {
      setToken('demo-token');
      localStorage.setItem(LS.role, role);
      return { access_token: 'demo-token', role };
    }
    const data = await request('POST', '/auth/register', { email, password, role });
    const token = data && (data.access_token || data.token);
    if (token) setToken(token);
    localStorage.setItem(LS.role, role);
    return data;
  }

  async function login(email, password) {
    if (isDemo()) {
      setToken('demo-token');
      return { access_token: 'demo-token' };
    }
    const data = await request('POST', '/auth/login', { email, password });
    const token = data && (data.access_token || data.token);
    if (token) setToken(token);
    return data;
  }

  // ---------------- Habitations ----------------
  async function createHabitation({ name, level, description }) {
    if (isDemo()) {
      const h = { id: uid('hab'), name, level, description };
      const list = readCache(LS.habitations, []);
      list.unshift(h);
      writeCache(LS.habitations, list);
      setHabitation(h);
      return h;
    }
    const h = await request('POST', '/habitations', { name, level, description });
    const list = readCache(LS.habitations, []);
    list.unshift(h);
    writeCache(LS.habitations, list);
    setHabitation(h);
    return h;
  }

  async function listHabitations() {
    if (isDemo()) return readCache(LS.habitations, []);
    try {
      const list = await request('GET', '/habitations');
      if (Array.isArray(list)) { writeCache(LS.habitations, list); return list; }
      return readCache(LS.habitations, []);
    } catch {
      return readCache(LS.habitations, []); // backend may not expose list — fall back to what we've created locally
    }
  }

  // ---------------- Parameters (7 categories) ----------------
  const CATEGORIES = [
    { key: 'demography', label: 'Demography' },
    { key: 'community_infrastructure', label: 'Community infrastructure' },
    { key: 'industrial_activities', label: 'Industrial activities' },
    { key: 'natural_resources', label: 'Natural resources' },
    { key: 'terrain', label: 'Terrain' },
    { key: 'economic_conditions', label: 'Economic conditions' },
    { key: 'cultural_significance', label: 'Cultural significance' },
  ];

  async function setParameters(habitationId, category, data) {
    if (isDemo()) {
      const all = readCache(LS.params(habitationId), {});
      all[category] = data;
      writeCache(LS.params(habitationId), all);
      return { ok: true };
    }
    const result = await request('PUT', `/habitations/${habitationId}/parameters/${category}`, { data });
    const all = readCache(LS.params(habitationId), {});
    all[category] = data;
    writeCache(LS.params(habitationId), all);
    return result;
  }

  function getStoredParameters(habitationId) {
    return readCache(LS.params(habitationId), {});
  }

  // ---------------- Simulations ----------------
  async function createSimulation({ habitation_id, name, start_year, duration_years }) {
    const payload = { habitation_id, name, start_year, duration_years };
    if (isDemo()) {
      const params = getStoredParameters(habitation_id);
      const sim = {
        id: uid('sim'), ...payload,
        results: DemoData.generateSimulationResults(params, start_year, duration_years),
      };
      const list = readCache(LS.sims, []);
      list.unshift(sim);
      writeCache(LS.sims, list);
      return sim;
    }
    const sim = await request('POST', '/simulations', payload);
    const list = readCache(LS.sims, []);
    list.unshift({ ...sim, results: null });
    writeCache(LS.sims, list);
    return sim;
  }

  async function getSimulationResults(simulationId) {
    const list = readCache(LS.sims, []);
    const cached = list.find((s) => s.id === simulationId);
    if (isDemo()) return cached ? cached.results : null;
    const results = await request('GET', `/simulations/${simulationId}/results`);
    if (cached) { cached.results = results; writeCache(LS.sims, list); }
    return results;
  }

  function getStoredSimulations() { return readCache(LS.sims, []); }

  // ---------------- Scenarios ----------------
  async function createScenario({ simulation_id, name, scenario_type, parameters }) {
    const payload = { simulation_id, name, scenario_type, parameters };
    if (isDemo()) {
      const sc = { id: uid('sce'), ...payload, results: null };
      const list = readCache(LS.scenarios, []);
      list.unshift(sc);
      writeCache(LS.scenarios, list);
      return sc;
    }
    const sc = await request('POST', '/scenarios', payload);
    const list = readCache(LS.scenarios, []);
    list.unshift({ ...sc, results: null });
    writeCache(LS.scenarios, list);
    return sc;
  }

  async function runScenario(scenarioId) {
    const list = readCache(LS.scenarios, []);
    const sc = list.find((s) => s.id === scenarioId);
    if (isDemo()) {
      const sims = readCache(LS.sims, []);
      const baseline = sims.find((s) => s.id === sc.simulation_id);
      const results = DemoData.applyScenario(baseline ? baseline.results : null, sc);
      sc.results = results;
      writeCache(LS.scenarios, list);
      return results;
    }
    const results = await request('POST', `/scenarios/${scenarioId}/run`);
    if (sc) { sc.results = results; writeCache(LS.scenarios, list); }
    return results;
  }

  function getStoredScenarios() { return readCache(LS.scenarios, []); }

  return {
    LS, getBase, setBase, getToken, setToken, isDemo, setDemo,
    getHabitation, setHabitation, isAuthed,
    register, login, createHabitation, listHabitations,
    CATEGORIES, setParameters, getStoredParameters,
    createSimulation, getSimulationResults, getStoredSimulations,
    createScenario, runScenario, getStoredScenarios,
  };
})();
