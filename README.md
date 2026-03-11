# HardScope Creator Analytics Dashboard

A full-stack, zero-config analytics dashboard built to help Brand Partnership teams track macro-level platform trends and evaluate creator campaign context.

## 🚀 How to Run Locally (Under 2 minutes)

To ensure a frictionless code review process without requiring `.env` files, API keys, or database containers, this app uses an in-memory SQLite database seeded via Kaggle CSVs (downloaded) on server startup.

1. **Clone the repo**

```bash
git clone https://github.com/ZenRepoMaster/hardscope-build-challenge.git 
cd hardscope-build-challenge
```

2. **Start the Backend:**

```bash
cd backend
npm install
node server.js
```

3. **Start the Frontend:** (In a new terminal window)

```bash
cd frontend
npm install
npm run dev
```

4. **View Dashboard:** Open `http://localhost:5173` in your browser.

---

## 📊 Data Modeling & Schema Normalization

**Source:** Kaggle's "YouTube/TikTok Trends Dataset" public dataset: [https://www.kaggle.com/datasets/tarekmasryo/youtube-shorts-and-tiktok-trends-2025]()

To satisfy the requirement of tying creator data to campaign context, I ingested two sub-datasets and normalized them into a relational schema:

1. **`top_creators_impact_2025.csv`**: Populates the core `creators` table.
2. **`youtube_shorts_tiktok_trends_2025.csv` (50,000 rows)**: Stream-parsed on startup to extract unique `genre`, `hashtag`, and `title_keywords`. This is joined dynamically via a `LEFT JOIN` on `(handle, platform)` to provide real, contextual campaign data for the dashboard. Programmatically aggregates view counts by date and genre to generate the macro-level trend data for the Line Chart.

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express, SQLite, `csv-parser`.
* **Frontend:** React, Vite, Tailwind CSS v4, Recharts, `lucide-react`.

---

## ⚖️ Architecture Decisions & Tradeoffs

* **In-Memory SQLite vs. PostgreSQL/Docker:** I chose an in-memory SQLite database to guarantee the app spins up instantly for the reviewer. The tradeoff is a lack of data persistence across server restarts, which is acceptable for a local prototype but would be swapped for Postgres in production.
* **Static Data vs. Live APIs:** Live APIs (YouTube Data API, TikTok Graph API) are susceptible to rate limits and require complex OAuth flows that violate the "run in under 5 minutes" requirement. Bundling static Kaggle datasets ensures 100% reliability for this review.
* **Cross-Browser UI Polish:** Tailwind CSS was used to create a premium, enterprise-grade interface. Specific overrides (`appearance-none`) were implemented to ensure form elements render pixel-perfect across Chromium and Apple WebKit (Safari) engines.

---

## 🔮 What I'd Do With Another Week

1. **Automated Data Pipelines:** Replace the static CSV ingestion with scheduled Airflow DAGs to pull live data from social graph APIs.
2. **Alerting System:** Build an automated background worker (e.g., BullMQ) to flag creators whose engagement rate drops below a certain threshold week-over-week.
3. **Robust Testing:** Implement Jest for backend API unit tests and Cypress for end-to-end dashboard user flows.
4. **TypeScript:** Migrate the codebase to TypeScript for strict typing on the API contracts between the frontend and backend.
