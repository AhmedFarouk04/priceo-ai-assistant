# Priceo AI Assistant MVP

API-only Next.js assistant for Priceo, built for Vercel deployment.

## Endpoints

- `GET /api/health`
- `POST /api/chat`

## Required Environment Variables

- `OPENAI_API_KEY`
- `PRICEO_BASE_URL`
- `ALLOW_DEBUG=false`

## Notes

- Do not commit tokens or `.env` files.
- Keep production debug mode disabled unless explicitly enabled for safe testing.
