# ChainWatch Pro — Reference Backend (FastAPI)

This is a minimal production-shaped mock backend you can run locally while building your real SaaS.

It implements the exact contract the web demo + Python/C++ SDKs expect.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8787
```

Then point the frontend (future) or SDKs at `http://localhost:8787`.

## Endpoints

- `POST /v1/scan` — wallet scan (demo data, accepts same params as UI)
- `GET  /v1/vaults`
- `GET  /v1/alerts`
- `GET  /health`

Add real auth (JWT / API key verification), rate limiting, persistent storage, and plug in real indexers (Alchemy, etc.) + your risk models.

Stripe webhooks, alert delivery, and user management are left as the next layer for a real SaaS.
