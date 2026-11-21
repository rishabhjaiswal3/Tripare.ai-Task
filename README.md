# Hotel Offer Orchestrator

A TypeScript/Express service that queries two hotel suppliers **in parallel through a Temporal workflow**, keeps the **cheapest offer per hotel**, caches the result in a **Redis sorted set**, and serves **price-range filters** straight from Redis.

## 🔗 Live demo

Base URL: **https://tripare-ai-task.onrender.com**

> Hosted on Render's free tier. The service sleeps when idle, so the **first request may take 30–60 s** while it wakes up. Later requests are fast.

Click any link to see the JSON response in your browser:

| What it shows | Link |
|---|---|
| Best offers for Delhi (hotels from both suppliers) | https://tripare-ai-task.onrender.com/api/hotels?city=delhi |
| Delhi, price between 5500 and 7000 | https://tripare-ai-task.onrender.com/api/hotels?city=delhi&minPrice=5500&maxPrice=7000 |
| Delhi, price up to 5500 | https://tripare-ai-task.onrender.com/api/hotels?city=delhi&maxPrice=5500 |
| Best offers for Mumbai | https://tripare-ai-task.onrender.com/api/hotels?city=mumbai |
| City with no hotels (returns `[]`) | https://tripare-ai-task.onrender.com/api/hotels?city=tokyo |
| Validation error (missing city, HTTP 400) | https://tripare-ai-task.onrender.com/api/hotels |
| Validation error (min price above max price, HTTP 400) | https://tripare-ai-task.onrender.com/api/hotels?city=delhi&minPrice=7000&maxPrice=5000 |
| Raw Supplier A data | https://tripare-ai-task.onrender.com/supplierA/hotels?city=delhi |
| Raw Supplier B data | https://tripare-ai-task.onrender.com/supplierB/hotels?city=delhi |

Example: `GET /api/hotels?city=delhi`

```json
[
  { "name": "Holtin",    "price": 5340, "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison",   "price": 5900, "supplier": "Supplier A", "commissionPct": 13 },
  { "name": "The Grand", "price": 7200, "supplier": "Supplier A", "commissionPct": 12 }
]
```

Holtin is cheaper at Supplier B (5340 vs 6000). Radison is cheaper at Supplier A (5900 vs 6100). The Grand costs the same at both, so the first supplier (A) is kept.

## How it works

```text
GET /api/hotels?city=delhi&minPrice=..&maxPrice=..
        │
        ▼
  Is the city cached in Redis (hotels:<city>)?
        │
   no   │   yes ───────────────────────────────┐
        ▼                                      │
  Start Temporal workflow `compareHotelOffers` │
        │                                      │
        ├── activity: fetchSupplierA ─┐        │
        ├── activity: fetchSupplierB ─┤ (parallel, 3 retries each)
        ▼                             ▼        │
  activity: mergeAndCacheOffers               │
    • cheapest offer per hotel name           │
      (case-insensitive; ties keep the first) │
    • ZADD to sorted set hotels:<city>        │
      (score = price, TTL = 1 hour)           │
        │                                      │
        ▼                                      ▼
  ZRANGEBYSCORE hotels:<city> minPrice maxPrice  →  JSON response
```

- **Temporal** runs the supplier calls as activities with timeouts and retries, so a flaky supplier is retried rather than failing the request straight away.
- **Redis** sorted sets store each offer with its price as the score, so price filtering is a single `ZRANGEBYSCORE` query. Cached cities skip the workflow entirely.
- City names are matched case-insensitively (`DELHI` and `delhi` return the same result).

## API reference

### `GET /api/hotels`

| Query param | Required | Description |
|---|---|---|
| `city` | yes | City name: letters, numbers, spaces, `.` `'` `-`; up to 80 characters |
| `minPrice` | no | Inclusive lower bound, a non-negative number |
| `maxPrice` | no | Inclusive upper bound, a non-negative number, ≥ `minPrice` |

| Status | When | Body |
|---|---|---|
| 200 | Success. A city with no hotels returns `[]` | `[{ name, price, supplier, commissionPct }]` |
| 400 | Missing or invalid city | `{ "error": "...", "code": "INVALID_CITY" }` |
| 400 | Price not a non-negative number | `{ "error": "...", "code": "INVALID_PRICE" }` |
| 400 | `minPrice` > `maxPrice` | `{ "error": "...", "code": "INVALID_PRICE_RANGE" }` |
| 429 | More than 100 requests per minute from one IP | `{ "error": "...", "code": "RATE_LIMITED" }` |
| 500 | Unexpected failure | `{ "error": "Internal server error.", "code": "INTERNAL_ERROR" }` |

### `GET /supplierA/hotels?city=<city>` and `GET /supplierB/hotels?city=<city>`

Mock supplier endpoints. The mock data covers **Delhi** (three overlapping hotels with different prices) and **Mumbai** (one hotel per supplier).

## Tech stack

Node.js 22 · TypeScript · Express · Temporal (TypeScript SDK) · Redis (ioredis) · Docker

## Project structure

```text
src/
  api.ts / worker.ts   Entrypoints for the API and the Temporal worker
  render.ts            Runs the API and the worker in one process (used by the Docker image / Render)
  app.ts               Express app and route wiring
  hotel/               Routes, controllers, service, Redis model, supplier client
  temporal/            Workflow, activities, Temporal client, shared connection options
  config/              Environment config and Redis connection
  middleware/          Rate limiting and centralized error handling
  utils/               Validation, request logging, async handler, app errors
  mock-data.ts         Mock supplier data
```

## Run locally with Docker Compose (recommended)

Requirements: Docker with Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

This starts four containers: the API, the Temporal worker, a Temporal dev server and Redis. The first build takes a few minutes.

- API: http://localhost:3000
- Temporal Web UI (to inspect workflow runs): http://localhost:8233

```bash
curl 'http://localhost:3000/api/hotels?city=delhi'
curl 'http://localhost:3000/api/hotels?city=delhi&minPrice=5500&maxPrice=7000'
curl 'http://localhost:3000/api/hotels?city=tokyo'
```

Stop everything with `docker compose down`.

## Run locally without Docker for the app

Requirements: Node.js 22+ and npm. Redis and Temporal still need to run somewhere; the easiest way is:

```bash
docker compose up redis temporal
```

Then, in two separate terminals:

```bash
npm ci
npm run dev:api      # terminal 1: API on http://localhost:3000
npm run dev:worker   # terminal 2: Temporal worker
```

## Configuration

All settings come from environment variables (see [`.env.example`](./.env.example)). `.env` is ignored by Git.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API port |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection (required when `NODE_ENV=production`) |
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal server address (required when `NODE_ENV=production`) |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `TEMPORAL_API_KEY` | *(unset)* | Set it for Temporal Cloud; the app then connects over TLS with API-key auth |
| `TEMPORAL_TASK_QUEUE` | `hotel-offer-task-queue` | Task queue shared by the API and the worker |
| `SUPPLIER_A_URL` / `SUPPLIER_B_URL` | `http://localhost:<PORT>/supplier{A,B}/hotels` | Supplier endpoints. Leave unset when the API and worker run together |
| `SUPPLIER_TIMEOUT_MS` | `5000` | Timeout for each supplier request |
| `CACHE_TTL_SECONDS` | `3600` | How long city results stay in Redis |

## Deployment (Render)

The live demo runs as a single Render **Docker web service** built from this repository:

- The Docker image starts `node dist/render.js`, which runs the API **and** the Temporal worker in one container.
- **Temporal Cloud** provides the Temporal server; **managed Redis** provides the cache.
- Render environment variables: `NODE_ENV=production`, `REDIS_URL`, `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY`. Render sets `PORT` itself. Do **not** set `SUPPLIER_A_URL`/`SUPPLIER_B_URL`: the worker reaches the suppliers over `localhost` inside the same container.

## Testing with Postman

Import [`postman_collection.json`](./postman_collection.json). Its `baseUrl` variable points to the live demo; change it to `http://localhost:3000` to test a local run. It includes a city with overlapping offers, a price-range query and a city with no results.

## Security

- Helmet security headers; the Express `X-Powered-By` header is disabled
- Per-IP rate limit on `/api` (100 requests per minute)
- Strict validation of `city`, `minPrice` and `maxPrice`; JSON bodies capped at 10 KB
- Generic error messages in production (no stack traces leak to clients)
- Timeouts on supplier requests; query strings left out of request logs
- Secrets come only from environment variables and are never committed
