# Hotel Offer Orchestrator

A TypeScript/Express service that asks two mock hotel suppliers in parallel through a Temporal workflow, selects the cheapest offer per hotel name, caches the result in Redis, and applies price filters with Redis sorted-set score queries.

## Project structure

```text
src/
  hotel/           Hotel routes, controller, service, Redis model, supplier adapters
  middleware/      Security defaults and centralized error handling
  types/           Shared TypeScript types
  utils/           Request logging, async handling, validation, app errors
  temporal/        Workflow, activities, Temporal client model
  config/          Environment and Redis connection
```

## Security

The API uses Helmet security headers, disables Express identification headers, applies a per-IP request limit to `/api`, caps JSON bodies at 10 KB, validates city and price query values, and returns generic server errors in production. Morgan logs ISO timestamps, method, path, status, and duration; query strings are excluded from logs. Supplier requests have a timeout. These controls reduce common risks, but production deployment should also use TLS, secret management, network restrictions, and a maintained dependency update process.

## Requirements

- Docker and Docker Compose
- Or, for local development, Node.js 22+ and npm

## Run with Docker Compose

```bash
cp .env.example .env
```

Edit `.env` to change local ports or service addresses. `.env` is ignored by Git; keep real credentials out of source control and use a secrets manager for deployment secrets. The current mock suppliers do not require API keys.

```bash
docker compose up --build
```

### Render free demo

Create one Render Docker web service from this repository and set its Start Command to `node dist/render.js` to run the API and Temporal worker together. Add `REDIS_URL` and `TEMPORAL_ADDRESS` in Render's environment; Render provides `PORT`, and supplier URLs are derived from `RENDER_EXTERNAL_URL`. This still requires reachable Temporal and Redis endpoints. Render's free service sleeps when idle and may restart, so use this setup for demos.

The API is at `http://localhost:3000`, Temporal's web UI is at `http://localhost:8233`, and Redis is available to the other containers on port 6379. The first build may take a few minutes.

```bash
curl 'http://localhost:3000/api/hotels?city=delhi'
curl 'http://localhost:3000/api/hotels?city=delhi&minPrice=5500&maxPrice=7000'
```

Example response for Delhi:


```json
[
  { "name": "Holtin", "price": 5340, "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison", "price": 5900, "supplier": "Supplier A", "commissionPct": 13 },
  { "name": "The Grand", "price": 7200, "supplier": "Supplier A", "commissionPct": 12 }
]
```


## API

### `GET /api/hotels`

Required query parameter: `city`. Optional inclusive bounds: `minPrice`, `maxPrice`. If a city is not present in the mock data, the endpoint returns `[]`. Invalid prices or a missing city return HTTP 400.

### `GET /supplierA/hotels?city=delhi` and `GET /supplierB/hotels?city=delhi`

Static mock supplier endpoints. Both contain overlapping Delhi hotel names with differing prices.

## How it works

The API starts `compareHotelOffers` on the `hotel-offer-task-queue` Temporal task queue. The workflow invokes the two supplier-fetch activities concurrently, selects the lower price for each case-insensitive hotel name (ties keep the first supplier result), then stores JSON offers in a Redis sorted set named `hotels:<city>` with price as the score. Sorted-set entries expire after one hour. Price filtering uses `ZRANGEBYSCORE` in Redis.

## Local development

Start Redis and Temporal (the Compose services can be started without the app using `docker compose up redis temporal`), then in separate terminals:

```bash
npm ci
npm run build
npm run dev:api
npm run dev:worker
```

Run the API and worker commands in separate terminals after Redis and Temporal are ready. Alternatively, start everything with `docker compose up --build`.

Local defaults use `redis://127.0.0.1:6379`, `localhost:7233`, and `http://localhost:3000/supplier{A,B}/hotels`. The API starts on port 3000. Environment variables: `PORT`, `REDIS_URL`, `TEMPORAL_ADDRESS`, `SUPPLIER_A_URL`, and `SUPPLIER_B_URL`.

## Postman

Import [`postman_collection.json`](./postman_collection.json) into Postman. It includes a city with overlapping offers, a no-results city, and a Redis price-range query.
