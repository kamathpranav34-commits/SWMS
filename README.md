# SWMS Backend

FastAPI + PostgreSQL/PostGIS + Celery/Redis + MinIO backend for the Smart Waste Management Simulator.

This README documents the backend API currently implemented in the project. The API is available through FastAPI and can also be explored interactively through Swagger UI.

## 1. Start the Backend

Copy `.env.example` to `.env` and configure the required environment values.

From `backend/`:

'''bash
docker compose up --build
'''

Main services:

- FastAPI backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- MinIO console: `http://localhost:9001`
- PostgreSQL/PostGIS: port `5432`
- Redis: port `6379`

The API is versioned under:

```text
/api/v1
```

## 2. Authentication

The protected API endpoints use bearer-token authentication.

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json
```

Example:

```json
{
  "email": "admin@example.com",
  "password": "password123",
  "role": "MUNICIPAL_ADMIN"
}
```

A successful registration returns an access token.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Example:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Use the returned access token as:

```http
Authorization: Bearer <access_token>
```

In Swagger UI, click **Authorize** and provide the bearer token.

Registration and login do not require an existing access token. The protected endpoints described below do.

## 3. Habitations

Habitations represent the geographical/administrative units being modeled by SWMS.

### Create habitation

```http
POST /api/v1/habitations
```

Example:

```json
{
  "name": "Demo Village",
  "level": "VILLAGE",
  "description": "SWMS prototype habitation"
}
```

### List habitations

```http
GET /api/v1/habitations
```

### Get one habitation

```http
GET /api/v1/habitations/{habitation_id}
```

All habitation endpoints require authentication.

## 4. Parameters

SWMS supports seven parameter categories:

1. `demography`
2. `community_infrastructure`
3. `industrial_activities`
4. `natural_resources`
5. `terrain`
6. `economic_conditions`
7. `cultural_significance`

### Get habitation parameters

```http
GET /api/v1/habitations/{habitation_id}/parameters
```

### Update/add a parameter category

```http
PUT /api/v1/habitations/{habitation_id}/parameters/{category}
```

Request body:

```json
{
  "data": {
    "...": "category-specific values"
  }
}
```

The parameter data is stored as a versioned record for the habitation and category.

If `expected_version` is supplied by the request schema, it can be used for optimistic version checking:

```json
{
  "data": {
    "...": "category-specific values"
  },
  "expected_version": 1
}
```

A version conflict returns HTTP `409`.

### Example: Demography

```http
PUT /api/v1/habitations/{habitation_id}/parameters/demography
```

Example data:

```json
{
  "data": {
    "population": 10000,
    "households": 2500,
    "male_population": 5100,
    "female_population": 4900,
    "population_growth_rate": 2.0
  }
}
```

### Example: Community Infrastructure

```http
PUT /api/v1/habitations/{habitation_id}/parameters/community_infrastructure
```

Example data:

```json
{
  "data": {
    "schools": 5,
    "hospitals": 1,
    "health_centers": 2,
    "water_supply_coverage_percent": 85,
    "sanitation_coverage_percent": 80,
    "electricity_coverage_percent": 95
  }
}
```

### Example: Industrial Activities

```http
PUT /api/v1/habitations/{habitation_id}/parameters/industrial_activities
```

Example data:

```json
{
  "data": {
    "industrial_units": 10,
    "industrial_employment": 500,
    "industrial_waste_tonnes_per_day": 25
  }
}
```

### Example: Natural Resources

```http
PUT /api/v1/habitations/{habitation_id}/parameters/natural_resources
```

Example data:

```json
{
  "data": {
    "water_bodies": 4,
    "groundwater_depth_m": 30,
    "forest_area_km2": 12,
    "agricultural_area_km2": 40
  }
}
```

### Example: Terrain

```http
PUT /api/v1/habitations/{habitation_id}/parameters/terrain
```

Example data:

```json
{
  "data": {
    "elevation_m": 720,
    "slope_percent": 4.5,
    "area_km2": 25
  }
}
```

### Example: Economic Conditions

```http
PUT /api/v1/habitations/{habitation_id}/parameters/economic_conditions
```

Example data:

```json
{
  "data": {
    "unemployment_rate_percent": 8,
    "literacy_rate_percent": 82,
    "average_annual_income": 240000,
    "poverty_rate_percent": 12
  }
}
```

### Example: Cultural Significance

```http
PUT /api/v1/habitations/{habitation_id}/parameters/cultural_significance
```

Example data:

```json
{
  "data": {
    "heritage_sites": 3,
    "religious_sites": 8,
    "historical_monuments": 2,
    "annual_cultural_events": 6,
    "traditional_occupations": [
      "handicrafts",
      "agriculture",
      "weaving"
    ],
    "cultural_sites_protected": true
  }
}
```

The exact fields accepted by the current implementation should be checked against the corresponding Pydantic/schema definitions and Swagger UI.

## 5. GIS / Map Layers

The backend provides GIS layer storage using PostgreSQL/PostGIS.

### Create a GIS layer

```http
POST /api/v1/habitations/{habitation_id}/layers
```

The request contains the layer name, layer type, and a GeoJSON feature.

Example:

```json
{
  "name": "Village Boundary",
  "layer_type": "boundary",
  "feature": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [77.50, 12.90],
          [77.51, 12.90],
          [77.51, 12.91],
          [77.50, 12.91],
          [77.50, 12.90]
        ]
      ]
    },
    "properties": {
      "source": "demo"
    }
  }
}
```

The backend converts the GeoJSON geometry into a PostGIS geometry using SRID `4326` and checks that the geometry is not empty and is valid.

### List GIS layers

```http
GET /api/v1/habitations/{habitation_id}/layers
```

The response includes the layer ID, name, layer type, and stored properties.

Both GIS endpoints require authentication.

## 6. Imports

The import API accepts files associated with a habitation.

### Upload an import

```http
POST /api/v1/imports?habitation_id={habitation_id}
```

The request is multipart/form-data and includes:

```text
file
```

Supported file extensions:

- `.csv`
- `.xlsx`
- `.geojson`
- `.json`

The endpoint returns HTTP `202 Accepted` and an import record.

### Get import status

```http
GET /api/v1/imports/{import_id}
```

This returns the stored import information and current status.

Imports require authentication.

## 7. Simulations

The simulation API runs the SWMS forecasting model for a habitation.

### Create and run a simulation

```http
POST /api/v1/simulations
```

Example:

```json
{
  "habitation_id": "YOUR_HABITATION_ID",
  "name": "Baseline 20 Year",
  "start_year": 1,
  "duration_years": 20
}
```

The backend creates the simulation and runs the simulation service. A successful request returns the simulation record.

### Get a simulation

```http
GET /api/v1/simulations/{simulation_id}
```

### Get simulation results

```http
GET /api/v1/simulations/{simulation_id}/results
```

Simulation result records include:

- year
- population
- waste generated per day (TPD)
- collected waste per day (TPD)
- treated waste per day (TPD)
- disposed waste per day (TPD)
- estimated cost
- notes

All simulation endpoints require authentication.

## 8. Scenarios

Scenarios allow a simulation to be run with an alternative set of scenario parameters.

### Create a scenario

```http
POST /api/v1/scenarios
```

Example:

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

### Run a scenario

```http
POST /api/v1/scenarios/{scenario_id}/run
```

The scenario must reference an existing simulation.

Both scenario endpoints require authentication.

## 9. Reports

The reports API provides a summary of the results for a simulation.

### Get simulation summary

```http
GET /api/v1/reports/{simulation_id}/summary
```

The summary contains:

- `simulation_id`
- number of result years
- initial population
- final population
- initial waste TPD
- final waste TPD
- total estimated cost
- peak waste TPD

If the simulation exists but has no result rows, the endpoint returns the simulation ID with a `No results` message.

Reports require authentication.

## 10. Chat

The backend provides a chat endpoint intended as an integration point for simulator-related natural-language interaction.

### Send a chat message

```http
POST /api/v1/chat
Content-Type: application/json
```

Example:

```json
{
  "message": "Show the simulation results for my habitation."
}
```

The current implementation returns:

- a readiness message
- the received message
- a next-step instruction indicating that detected intent can be mapped to the simulation or scenario APIs

The current endpoint is therefore an integration-ready placeholder rather than a full NLP/LLM implementation.

Chat requires authentication.

## 11. API Route Summary

| Module | Method | Endpoint |
|---|---|---|
| Authentication | POST | `/api/v1/auth/register` |
| Authentication | POST | `/api/v1/auth/login` |
| Habitations | POST | `/api/v1/habitations` |
| Habitations | GET | `/api/v1/habitations` |
| Habitations | GET | `/api/v1/habitations/{habitation_id}` |
| Parameters | GET | `/api/v1/habitations/{habitation_id}/parameters` |
| Parameters | PUT | `/api/v1/habitations/{habitation_id}/parameters/{category}` |
| GIS | POST | `/api/v1/habitations/{habitation_id}/layers` |
| GIS | GET | `/api/v1/habitations/{habitation_id}/layers` |
| Imports | POST | `/api/v1/imports?habitation_id={habitation_id}` |
| Imports | GET | `/api/v1/imports/{import_id}` |
| Simulations | POST | `/api/v1/simulations` |
| Simulations | GET | `/api/v1/simulations/{simulation_id}` |
| Simulations | GET | `/api/v1/simulations/{simulation_id}/results` |
| Scenarios | POST | `/api/v1/scenarios` |
| Scenarios | POST | `/api/v1/scenarios/{scenario_id}/run` |
| Reports | GET | `/api/v1/reports/{simulation_id}/summary` |
| Chat | POST | `/api/v1/chat` |

## 12. Authentication Flow

For protected requests:

```text
Register/Login
     ↓
Access token returned
     ↓
Frontend stores token
     ↓
Authorization: Bearer <access_token>
     ↓
FastAPI authentication dependency
     ↓
Protected endpoint
```

When using the frontend, the token is attached automatically to authenticated API requests. When using Swagger directly, use the **Authorize** button to provide the token.

## 13. Backend Architecture

The backend uses the following stack:

- **FastAPI** — REST API and Swagger/OpenAPI documentation
- **PostgreSQL** — relational data storage
- **PostGIS** — geographic/spatial data storage and validation
- **Celery** — background task processing
- **Redis** — Celery broker/backend and transient task-related data
- **MinIO** — object/file storage
- **SQLAlchemy** — database ORM
- **Pydantic** — request/response validation

Major application areas include:

```text
app/
├── api/
│   └── v1/
│       ├── auth
│       ├── habitations
│       ├── parameters
│       ├── imports
│       ├── gis
│       ├── simulations
│       ├── scenarios
│       ├── reports
│       └── chat
├── core/
├── db/
├── schemas/
├── services/
├── simulation/
├── storage/
└── workers/
```

## 14. Swagger / OpenAPI

Once the backend is running, the interactive API documentation is available at:

```text
http://localhost:8000/docs
```
Swagger UI is generated from the FastAPI route definitions, so it reflects the API routes registered by the running backend.

Use Swagger to:

1. Authorize with a bearer token.
2. Create or select a habitation.
3. Add parameter categories.
4. Add GIS layers.
5. Upload imports.
6. Run simulations.
7. Create and run scenarios.
8. Generate simulation summaries.
9. Test the chat integration endpoint.

## 15. Important Implementation Note

The supplied SWMS brief defines the required categories, 20-year forecasting, GIS inputs, scenarios and outputs, but does not prescribe the exact waste-generation, cost, treatment, route-optimization or environmental-impact equations.


