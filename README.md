# SWMS Backend

FastAPI + PostgreSQL/PostGIS + Celery/Redis + MinIO backend for the Smart Waste Management Simulator.

## 1. Start

Copy `.env.example` to `.env`.

From `backend/`:

```bash
docker compose up --build
```

API:
- http://localhost:8000
- Swagger: http://localhost:8000/docs
- MinIO console: http://localhost:9001

## 2. Authentication

Register:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "role": "MUNICIPAL_ADMIN"
}
```

Use the returned bearer token in Swagger's Authorize button.

## 3. Create habitation

```http
POST /api/v1/habitations
```

```json
{
  "name": "Demo Village",
  "level": "VILLAGE",
  "description": "SWMS prototype habitation"
}
```

## 4. Add the seven parameter categories

Example:

```http
PUT /api/v1/habitations/{id}/parameters/demography
```

```json
{
  "data": {
    "population": 10000,
    "growth_rate": 0.02,
    "waste_per_person_kg_day": 0.5
  }
}
```

Other supported categories:
- demography
- community_infrastructure
- industrial_activities
- natural_resources
- terrain
- economic_conditions
- cultural_significance

## 5. Run the 20-year simulation

```http
POST /api/v1/simulations
```

```json
{
  "habitation_id": "YOUR_HABITATION_ID",
  "name": "Baseline 20 Year",
  "start_year": 1,
  "duration_years": 20
}
```

Then:

```http
GET /api/v1/simulations/{simulation_id}/results
```

## 6. Scenario example

Create a population-surge scenario:

```http
POST /api/v1/scenarios
```

```json
{
  "simulation_id": "YOUR_SIMULATION_ID",
  "name": "Population +20%",
  "scenario_type": "POPULATION_SURGE",
  "parameters": {
    "increase_percent": 20
  }
}
```

Then:

```http
POST /api/v1/scenarios/{scenario_id}/run
```

## Important implementation note

The supplied SWMS brief defines the required categories, 20-year forecasting, GIS inputs, scenarios and outputs, but does not prescribe the exact waste-generation, cost, treatment, route-optimization or environmental-impact equations. The MVP therefore uses clearly isolated baseline formulas in `app/services/simulation_service.py`; replace these with your team's approved SWMS equations/model.
