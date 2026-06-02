# Priceo AI Assistant MVP

API-only AI assistant for the Priceo e-commerce platform, built with Next.js and designed for Vercel deployment.

## Features

- Natural-language product search
- Order and cart assistance
- Wishlist and notifications support
- Admin analytics for orders and sales
- Policy Q&A for payment, shipping, coupons, and support
- Safe two-step confirmation for sensitive actions
- Role-based access for users and admins

## API Endpoints

- `GET /api/health`
- `POST /api/chat`

## Required Environment Variables

```env
OPENAI_API_KEY=
PRICEO_BASE_URL=https://priceo.vercel.app
ALLOW_DEBUG=false
```

## Security Notes

- Do not commit tokens or `.env` files.
- Keep `ALLOW_DEBUG=false` in production.
- Protected Priceo APIs require a valid user or admin token.
- Notification execution is disabled in the MVP.

## Deployment

This project is intended to be deployed on Vercel.

```

```
