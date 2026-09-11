# Real-Time Indian Airfare Price Intelligence Platform
### Smart India Hackathon (SIH 2026) Prototype
**Problem Statement:** *"Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)."*

---

## 1. Executive Summary & Purpose

In India, air travel has become a vital mode of mass and business transit. However, official inflation metrics like the Consumer Price Index (CPI) have traditionally relied on lagged survey data or sparse sampling for the passenger airfare sub-component. 

This platform provides a **government-grade airfare intelligence and monitoring engine** that:
1. Systematically observes genuine domestic airfares across critical trunk corridors.
2. Ingests, normalizes, and stores historical fare observations across 5 standard advance booking horizons ($T+1, T+7, T+15, T+30, T+45$).
3. Calculates a **Prototype Airfare Price Index** using a transparent Laspeyres-weighted formulation to augment the CPI transport basket.
4. Detects **unusually expensive routes** and pricing anomalies using $Z$-score and deviation baselines.
5. Algorithmic distinguishes between **temporary demand spikes** and **persistent structural increases**, providing explicit diagnostic rationale.
6. Delivers an interactive, financial-terminal-style React dashboard with geographic route visualization on a Leaflet map of India.

> [!IMPORTANT]
> **Data Authenticity Guarantee:** The platform strictly demarcates real versus simulated data. When commercial GDS APIs are active, records are certified as **VERIFIED**. In standalone demonstration mode, records are transparently branded with **DEMO DATA** badges and `is_demo=true`. Simulated data is never conflated with live verified data.

---

## 2. Platform Architecture

```
airfare-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (routes, fares, airlines, index, analytics, collection)
│   │   ├── models/          # SQLAlchemy models (Route, Airline, FareObservation, PriceIndex, DataSource)
│   │   ├── schemas/         # Pydantic schemas (V2 ConfigDict)
│   │   ├── providers/       # Modular DataProvider abstraction (DemoProvider, APIProvider, ScraperProvider)
│   │   ├── analytics/       # Index calculator, anomaly detector, booking elasticity
│   │   ├── services/        # Collection pipeline & background AsyncIOScheduler
│   │   ├── database/        # Engine & session management (SQLite / PostgreSQL dual support)
│   │   ├── config.py        # Settings & environment validation
│   │   ├── main.py          # FastAPI application & lifecycle handlers
│   │   └── seed.py          # Realistic 30-day statistical data generator
│   ├── tests/               # Pytest suite (fare math, anomalies, index, API integration)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, RouteMap (Leaflet), Charts (Recharts), StatusBadge
│   │   ├── pages/           # Dashboard, Routes, RouteDetail, PriceIndex, DataSources, DataCollection, Methodology
│   │   ├── services/        # Typed API service client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # React Router layout
│   │   └── index.css        # Tailwind CSS & custom dark theme styling
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml       # Production-ready multi-container configuration
├── .env.example             # Complete environment configuration reference
└── README.md
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet / React-Leaflet, Lucide Icons, React Router.
- **Backend:** Python 3.11+, FastAPI, Pydantic V2, SQLAlchemy 2.0, APScheduler.
- **Database:** PostgreSQL (with instant SQLite zero-dependency fallback).
- **Testing:** Pytest, HTTPX TestClient.

---

## 4. Quickstart Installation

### Option 0: Single-Command Full Launch (Fastest & Recommended)

Simply run the master launcher from the project root:
```bash
python main.py
```
*(On Windows, you can also simply double-click **`start.bat`**)*

This automatically checks dependencies, seeds the database if needed, boots both the FastAPI backend and Vite frontend, and opens the dashboard in your browser at **`http://localhost:5173`**.

---

### Option A: Manual Local Development

#### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Seed 30 days of realistic airfare observations (7,700+ records)
python -m app.seed

# Start FastAPI server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

### Option B: Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:8000/docs`

---

## 5. Environment Variables (`.env`)

Copy `.env.example` to `.env`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATA_PROVIDER` | `demo` | Provider engine: `demo`, `api`, or `scraper` |
| `DATABASE_URL` | `sqlite:///./airfare_intelligence.db` | Database connection string (SQLite or PostgreSQL) |
| `COLLECTION_INTERVAL_MINUTES`| `30` | Scheduler frequency for automated background collection |
| `API_KEY` | `None` | External commercial aviation API key (when `DATA_PROVIDER=api`) |
| `API_SECRET` | `None` | External API client secret |
| `API_BASE_URL` | `https://api.aviationprovider.com/v1` | Base URL for external GDS/OTA API provider |

---

## 6. How to Run with PostgreSQL

To use a dedicated PostgreSQL instance instead of the default SQLite:
1. Start PostgreSQL:
   ```bash
   docker run --name airfare_postgres -e POSTGRES_DB=airfare_db -e POSTGRES_USER=airfare_user -e POSTGRES_PASSWORD=securepassword -p 5432:5432 -d postgres:15
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL=postgresql://airfare_user:securepassword@localhost:5432/airfare_db
   ```
3. Install PostgreSQL driver:
   ```bash
   pip install psycopg2-binary
   ```
4. Run the seed script:
   ```bash
   python -m app.seed
   ```

---

## 7. How to Switch from Demo Mode to a Live Provider

The backend utilizes an extensible **Provider Pattern** (`FareDataProvider`).

To connect a commercial airline/GDS API (e.g. Amadeus, AviationStack, Travelport, Duffel):
1. In `.env`:
   ```env
   DATA_PROVIDER=api
   API_KEY=your_actual_api_key
   API_SECRET=your_actual_api_secret
   API_BASE_URL=https://api.aviationprovider.com/v1
   ```
2. Restart the backend server.
3. The platform will automatically query the verified API, set `is_demo=False`, and display the live indicator:
   `● LIVE DATA — VERIFIED API STREAM`

---

## 8. How to Add Another Airline or Route

### Adding an Airline
Airlines are stored dynamically in the `airlines` table. You can insert records directly via SQL or during seeding in `app/seed.py`:
```python
new_airline = Airline(
    code="IX",
    name="Air India Express",
    country="India",
    market_share_pct=7.5,
    is_active=True
)
db.add(new_airline)
db.commit()
```

### Adding a Route
Routes are stored dynamically in the `routes` table:
```python
new_route = Route(
    code="DEL-GOI",
    origin="DEL",
    destination="GOI",
    origin_name="Indira Gandhi International, New Delhi",
    destination_name="Dabolim Airport, Goa",
    origin_lat=28.5562, origin_lng=77.1000,
    dest_lat=15.3800, dest_lng=73.8314,
    distance_km=1505.0,
    cpi_weight=1.1, # Weight in CPI basket
    is_active=True
)
db.add(new_route)
db.commit()
```

---

## 9. Price Index Methodology (Laspeyres Basket)

To construct a high-frequency airfare indicator that accurately augments the Consumer Price Index (CPI):

1. **Route Price Index ($I_r$):**
   $$I_r(t) = \left( \frac{\bar{P}_r(t)}{\bar{P}_r(0)} \right) \times 100$$
   Where $\bar{P}_r(t)$ is the current mean fare across all carriers for route corridor $r$, and $\bar{P}_r(0)$ is the 30-day baseline reference price.

2. **Prototype National Airfare Price Index ($I_{nat}$):**
   $$I_{nat}(t) = \frac{\sum_{r} w_r \times I_r(t)}{\sum_{r} w_r}$$
   Where $w_r$ represents the route's traffic volume share derived from DGCA domestic passenger statistics (e.g. DEL-BOM has weight 1.5, DEL-BLR has weight 1.3).

---

## 10. Anomaly Detection & Spike Classification

### Severity Thresholds (vs 30-Day Moving Baseline)
- **NORMAL:** $\Delta \le +15\%$
- **ELEVATED:** $+15\% < \Delta \le +35\%$
- **UNUSUALLY HIGH:** $+35\% < \Delta \le +60\%$
- **EXTREME:** $\Delta > +60\%$

### Trajectory Differentiation Algorithm
- **Temporary Spike:** An isolated 1-2 day sharp surge ($>30\%$ above baseline) followed by mean reversion or exhibiting elevated volatility coefficient.
- **Persistent Increase:** Monotonically increasing fares across 3+ consecutive periods or sustained elevations ($>20\%$ above baseline) with low variance. Provides human-readable diagnostic explanations.

---

## 11. Advance Booking Horizons ($T+1$ to $T+45$)

The platform records observations across 5 advance booking windows:
- **$T+1$:** Last-minute booking (1 day prior to departure) — measures peak consumer surge pricing.
- **$T+7$:** Near-term booking (1 week prior).
- **$T+15$:** Standard booking baseline (2 weeks prior).
- **$T+30$:** Early bird horizon (1 month prior).
- **$T+45$:** Deep advance planning (45 days prior).

This allows the system to compute the **Booking Price Elasticity Curve** and quantify average consumer savings (e.g., *"Average saving from booking 30 days early: ₹2,350 / 31%"*).

---

## 12. Automated WhatsApp Intelligence Dispatcher (Linked Devices)

The platform features an automated WhatsApp Multi-Device Gateway:
- **Zero-Cost Multi-Device Linking:** Employs `@whiskeysockets/baileys` to link any standard WhatsApp mobile number via **Settings > Linked Devices > Link a Device**.
- **1-Click Executive Delivery:** Dispatches the complete MoSPI CPI Augmentation bulletin, National Laspeyres Index status, festival anomaly warnings, and booking elasticity savings directly to:
  - The linked user ("Message Yourself")
  - Custom phone numbers (Judges, Ministry evaluators, or stakeholders)
- **Direct Web Fallback:** Provides an instant `wa.me` fallback link requiring zero pairing.
- **REST Endpoints:**
  - `GET /api/whatsapp/status`: Check connection state and retrieve multi-device QR code.
  - `GET /api/whatsapp/report`: Real-time formatted analytical bulletin.
  - `POST /api/whatsapp/send`: One-click programmatic WhatsApp dispatch.
  - `POST /api/whatsapp/disconnect`: Unlink session and reset multi-device pairing.

---

## 12. Ethical Scraping & Legal Compliance Charter

1. **Zero Bot Evasion:** The platform **does NOT** bypass CAPTCHA, Cloudflare, bot-shields, authentication, or paywalls.
2. **Robots.txt & Rate Limiting:** All public endpoints respect `robots.txt` directives with mandatory politeness delays.
3. **Open Access:** Designed primarily for official open data feeds, licensed GDS APIs, and research-permitted transparency portals.

---

## 13. Running Automated Tests

Run backend tests using Pytest:
```bash
cd backend
python -m pytest -v
```
All 13 integration and unit tests validate fare normalization math ($base + taxes + fees = total$), anomaly thresholds, spike classification, Laspeyres index calculation, and API endpoints.

---

## 14. License & SIH 2026 Disclosure

This software is developed as a technical and architectural prototype for **Smart India Hackathon (SIH 2026)**. It is an academic and engineering demonstrator and is not an official gazetted index of the Government of India or the Ministry of Statistics and Programme Implementation (MoSPI).
