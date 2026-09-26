# SWMS Frontend — Planning Console

A presentation-ready frontend for the SWMS backend (FastAPI + PostgreSQL/PostGIS Smart Waste Management Simulator). Plain HTML/CSS/JS — no build step, no framework, no `npm install`. This build is configured for the live backend.

## Folder structure

```
SWMS-frontend/
├── index.html          Landing page — sign in or register
├── dashboard.html       Create/select a habitation, map, category completion tracker
├── parameters.html      Editor for the seven parameter categories
├── simulation.html       Configure and run a 20-year forecast, view charts + table
├── scenario.html         Build a scenario, run it, compare against its baseline
├── css/
│   └── style.css        Full design system (tokens, layout, components)
├── js/
│   ├── api.js            All backend calls in one place
│   ├── demo-data.js       Retained as an unused development fallback
│   ├── ui.js              Shared sidebar, toasts, auth/habitation guards
│   ├── auth.js            index.html logic
│   ├── dashboard.js       dashboard.html logic
│   ├── parameters.js      parameters.html logic
│   ├── simulation.js      simulation.html logic
│   └── scenario.js        scenario.html logic
├── assets/
│   └── favicon.svg
└── README.md
```

## Running it

**Against the live backend:**
1. Start the backend (`docker compose up --build` from the SWMS repo).
2. Open this frontend through HTTP (not `file://`), for example: `python3 -m http.server 5500`.
3. Open `http://localhost:5500`, register/sign in, create a habitation, save parameters, then run a simulation.
4. The default API base is `http://localhost:8000/api/v1`.

## Backend contract used by this presentation build

| Action | Endpoint | Frontend expectation |
|---|---|---|
| Register | `POST /auth/register` | `MUNICIPAL_ADMIN`, `PLANNER`, `ENV_AUTHORITY`, `RESEARCHER` |
| Sign in | `POST /auth/login` | access token stored in local storage |
| Create habitation | `POST /habitations` | `{name, level, description}` |
| List habitations | `GET /habitations` | array of habitations |
| Save parameters | `PUT /habitations/{id}/parameters/{category}` | `{data, expected_version?}` response accepted |
| Run simulation | `POST /simulations` | simulation record |
| Results | `GET /simulations/{id}/results` | array of `{year,population,waste_tpd,collected_tpd,treated_tpd,disposed_tpd,estimated_cost}` |
| Create scenario | `POST /scenarios` | `{simulation_id,name,scenario_type,parameters}` |
| Run scenario | `POST /scenarios/{id}/run` | `{scenario_id,scenario_type,results}` |

## Presentation notes

This build does not expose browser Demo Mode. Simulation and scenario results shown in the UI come from the live FastAPI API. Supported scenario types are `POPULATION_SURGE`, `ROAD_BLOCKAGE`, and `FLOOD`.

## Design notes

- **Palette & type** — an ink-dark control-room base with amber (waste-collection livery), teal (treatment/recycling) and rust (overflow/alerts) as functional data colors; Space Grotesk for display type, IBM Plex Sans for body copy, IBM Plex Mono reserved for actual numeric readouts (stat cards, tables, the year ticker) so digits align.
- **Corner-tick panels** — the survey/blueprint-style corner marks on panels are a nod to the GIS/terrain inputs the simulator actually takes.
- **The seven categories are numbered 01–07** because that's a real, fixed set the backend defines — not decoration.
- Fully responsive down to mobile, visible focus states, and `prefers-reduced-motion` is respected (the landing-page year-ticker animation is skipped).

## Extending it

- Swap in real habitation coordinates: the lat/lng fields on the dashboard are stored client-side only (`swms_hab_geo_<id>` in localStorage) so they never get sent to endpoints that don't expect them — wire them into your habitation schema if the backend supports geography.
- The parameter editor is a generic key/value form per category, so it will accept whatever fields your actual Pydantic schemas expect — it doesn't hardcode a rigid shape.
- Charts are Chart.js (loaded from cdnjs), maps are Leaflet + OpenStreetMap tiles (loaded from unpkg) — both need an internet connection in the browser even though the rest of the app works fully offline.
