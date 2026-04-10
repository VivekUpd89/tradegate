# TradeGate MVP

TradeGate is a pre-trade execution checkpoint for discretionary traders.

This version includes:
- multi-page polished MVP
- Supabase SSR-based auth plumbing
- custom strategy creation/editing UI
- pre-trade review workbench
- editable journal/history dashboard
- review detail page backed by real user review fetch where available
- imported TradingView alert queue via journal filter
- browser voice-input flow
- Supabase/Postgres persistence hooks
- TradingView webhook ingestion endpoint bound to real user webhook tokens
- deployment guide for Vercel + Supabase

## Pages

- `/` overview dashboard
- `/review` trade review workbench
- `/review/[id]` review detail page
- `/journal` review history and editable journal
- `/journal?source=tradingview-webhook` imported-alert queue
- `/strategies` strategy manager
- `/integration` TradingView paper-trade guide
- `/deploy` deployment guide

## Local run

```bash
cmd /c npm install
cmd /c npm run dev
```

Open `http://localhost:3000`

## Supabase setup

1. Create a Supabase project
2. Copy `.env.example` to `.env.local`
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TRADINGVIEW_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. For a fresh project, run `supabase.sql` in the Supabase SQL editor
5. For an existing project, run `supabase.migration.sql` after the original schema
6. In Supabase Auth, enable Email provider / magic links
7. Add your local and production redirect URLs in Supabase Auth settings
8. Restart the dev server

## TradingView webhook

Endpoint after deploy:

`/api/tradingview/webhook`

Example payload:

```json
{
  "secret": "your-shared-secret",
  "token": "user-profile-webhook-token",
  "symbol": "NIFTY",
  "direction": "Long",
  "entry": 22450,
  "stopLoss": 22420,
  "target": 22520,
  "strategySlug": "breakout-pullback",
  "thesis": "Breakout alert fired after pullback hold.",
  "marketContext": "Imported from TradingView alert.",
  "emotions": ["Calm"],
  "confidence": 68
}
```

## Live deployment cost

For MVP deployment, costs can still be very low:
- Vercel Hobby: often free
- Supabase Free tier: often free
- Domain: optional, usually ₹800-₹1500/year

So initial live deployment can still be close to ₹0/month if free tiers are enough.

## Live deployment steps

1. Deploy on Vercel
2. Configure env vars
3. Sign in with magic link
4. Let the app create your profile row
5. Open `/integration` and copy your `tradingview_webhook_token`
6. Put that token into your TradingView alert payload
7. Send a test alert to `/api/tradingview/webhook`
8. Check `/journal?source=tradingview-webhook`

## Important product note

TradeGate should be positioned as a discipline and decision-support tool.
It should not be marketed as investment advice or a profit-guarantee system.
