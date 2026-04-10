import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export function IntegrationGuide() {
  return (
    <AppShell
      title="TradingView paper trading connection guide"
      description="Here is the practical answer: connect safely in layers. Start with review gating and alert ingestion, then move toward semi-automation if the workflow proves useful."
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">What is realistically possible</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
            <p>
              TradingView itself is excellent for charting, alerts, and paper trading, but it is not the cleanest universal external order-routing API for custom apps.
            </p>
            <p>
              So the safest MVP integration path is:
            </p>
            <ul className="space-y-2">
              <li>• trader creates the setup in TradeGate</li>
              <li>• TradeGate approves / warns / blocks</li>
              <li>• trader manually places the paper trade in TradingView</li>
              <li>• TradingView alerts feed context back into TradeGate</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-semibold">Best phased integration plan</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <li>1. Manual paper-trade workflow</li>
            <li>2. TradingView alert webhook into TradeGate</li>
            <li>3. Imported-alert queue and trader confirmation</li>
            <li>4. Broker-specific execution integration outside TradingView</li>
          </ol>
          <Link href="/journal?source=tradingview-webhook" className="mt-4 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            View imported alert queue →
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">TradingView webhook endpoint</h2>
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
          <pre>{`POST /api/tradingview/webhook
Content-Type: application/json

{
  "secret": "your-shared-secret",
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
}`}</pre>
        </div>
      </section>
    </AppShell>
  );
}
