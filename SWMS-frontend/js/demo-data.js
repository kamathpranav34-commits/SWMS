/* ==========================================================================
   DemoData — client-side stand-in for the backend's simulation engine.

   The SWMS backend README notes its own formulas are an illustrative MVP
   baseline ("replace with your team's approved SWMS equations"). This file
   mirrors that same spirit on the frontend: transparent, swappable formulas
   that turn the seven parameter categories into a 20-year forecast, so the
   UI is fully demonstrable even with no backend running.
   ========================================================================== */

const DemoData = (() => {
  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function generateSimulationResults(params = {}, startYear = 1, durationYears = 20) {
    const demography = params.demography || {};
    const industrial = params.industrial_activities || {};
    const infra = params.community_infrastructure || {};
    const economic = params.economic_conditions || {};

    const population0 = num(demography.population, 12000);
    const growth = num(demography.growth_rate, 0.02);
    const perPersonKgDay = num(demography.waste_per_person_kg_day, 0.45);

    const industrialTonnes0 = num(industrial.industrial_waste_tonnes_year, 400);
    const industrialGrowth = num(industrial.growth_rate, 0.015);

    const recyclingPct0 = num(infra.recycling_capacity_pct, 15);
    const recyclingGrowthPerYear = num(infra.capacity_growth_pct_year, 1.1);

    const costPerTonne = num(economic.collection_cost_per_tonne, 45);
    const costInflation = num(economic.cost_inflation_rate, 0.03);

    const years = [];
    for (let i = 0; i < durationYears; i++) {
      const year = startYear + i;
      const population = population0 * Math.pow(1 + growth, i);
      const domesticWaste = (population * perPersonKgDay * 365) / 1000; // tonnes/yr
      const industrialWaste = industrialTonnes0 * Math.pow(1 + industrialGrowth, i);
      const totalWaste = domesticWaste + industrialWaste;
      const recyclingRate = Math.min(85, recyclingPct0 + recyclingGrowthPerYear * i);
      const treated = totalWaste * (recyclingRate / 100);
      const landfilled = totalWaste - treated;
      const cost = totalWaste * costPerTonne * Math.pow(1 + costInflation, i);
      const co2 = landfilled * 0.58 + treated * 0.12; // illustrative emission factors (t CO2e / t waste)

      years.push({
        year,
        population: Math.round(population),
        domestic_waste_tonnes: round1(domesticWaste),
        industrial_waste_tonnes: round1(industrialWaste),
        waste_generated_tonnes: round1(totalWaste),
        recycling_rate_pct: round1(recyclingRate),
        waste_treated_tonnes: round1(treated),
        waste_landfilled_tonnes: round1(landfilled),
        operational_cost: Math.round(cost),
        co2_emissions_tonnes: round1(co2),
      });
    }

    const summary = summarize(years);
    return { config: { start_year: startYear, duration_years: durationYears }, years, summary };
  }

  function summarize(years) {
    if (!years.length) return null;
    const totalWaste = years.reduce((a, y) => a + y.waste_generated_tonnes, 0);
    const totalCost = years.reduce((a, y) => a + y.operational_cost, 0);
    const peak = years.reduce((a, y) => (y.waste_generated_tonnes > a.waste_generated_tonnes ? y : a));
    const avgRecycling = years.reduce((a, y) => a + y.recycling_rate_pct, 0) / years.length;
    return {
      total_waste_tonnes: round1(totalWaste),
      total_cost: Math.round(totalCost),
      peak_year: peak.year,
      peak_waste_tonnes: peak.waste_generated_tonnes,
      avg_recycling_rate_pct: round1(avgRecycling),
      final_population: years[years.length - 1].population,
    };
  }

  function applyScenario(baseline, scenario) {
    if (!baseline || !baseline.years) return null;
    const type = (scenario.scenario_type || '').toUpperCase();
    const p = scenario.parameters || {};
    const years = baseline.years.map((y, i) => {
      const ramp = Math.min(1, (i + 1) / 3); // phase the shock in over ~3 years
      let domestic = y.domestic_waste_tonnes;
      let industrial = y.industrial_waste_tonnes;
      let recyclingRate = y.recycling_rate_pct;

      if (type.includes('POPULATION')) {
        const pct = num(p.increase_percent, 20) / 100;
        domestic *= 1 + pct * ramp;
      } else if (type.includes('INDUSTRIAL')) {
        const pct = num(p.increase_percent ?? p.growth_percent, 30) / 100;
        industrial *= 1 + pct * ramp;
      } else if (type.includes('INFRA') || type.includes('CAPACITY') || type.includes('UPGRADE')) {
        const add = num(p.capacity_increase_pct, 15);
        recyclingRate = Math.min(92, recyclingRate + add * ramp);
      } else {
        const factor = num(p.factor, 1.1);
        domestic *= 1 + (factor - 1) * ramp;
        industrial *= 1 + (factor - 1) * ramp;
      }

      const totalWaste = domestic + industrial;
      const treated = totalWaste * (recyclingRate / 100);
      const landfilled = totalWaste - treated;
      const cost = totalWaste * (y.operational_cost / Math.max(y.waste_generated_tonnes, 0.001));
      const co2 = landfilled * 0.58 + treated * 0.12;

      return {
        ...y,
        domestic_waste_tonnes: round1(domestic),
        industrial_waste_tonnes: round1(industrial),
        waste_generated_tonnes: round1(totalWaste),
        recycling_rate_pct: round1(recyclingRate),
        waste_treated_tonnes: round1(treated),
        waste_landfilled_tonnes: round1(landfilled),
        operational_cost: Math.round(cost),
        co2_emissions_tonnes: round1(co2),
      };
    });
    return { config: baseline.config, years, summary: summarize(years) };
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  return { generateSimulationResults, applyScenario };
})();
