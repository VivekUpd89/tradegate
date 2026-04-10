import { AppShell } from "@/components/app-shell";

export function DeployGuide() {
  return (
    <AppShell
      title="Deployment guide for Vercel + Supabase"
      description="This is the practical path to get TradeGate online without overcomplicating infra."
    >
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">1. Supabase</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>• Create a new Supabase project</li>
            <li>• Open SQL Editor and run `supabase.sql`</li>
            <li>• Enable Email auth in Authentication → Providers</li>
            <li>• Add redirect URLs for local and production</li>
            <li>• Confirm tables: profiles, strategies, reviews</li>
          </ol>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">2. Vercel</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>• Push the `tradegate` folder to GitHub or another git remote</li>
            <li>• Import the repo into Vercel</li>
            <li>• Framework preset: Next.js</li>
            <li>• Root directory: `tradegate` if this is in a monorepo/workspace</li>
          </ol>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">3. Environment variables</h2>
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
          <pre>{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
TRADINGVIEW_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`}</pre>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">4. Live deployment checklist</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>• Deploy app on Vercel</li>
            <li>• Open homepage and sign in with magic link</li>
            <li>• First signed-in visit will create your profile row</li>
            <li>• In Supabase, read your `tradingview_webhook_token` from `profiles`</li>
            <li>• Put that token into TradingView webhook alert JSON</li>
            <li>• Send a test alert and verify it appears in `/journal?source=tradingview-webhook`</li>
          </ol>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-semibold">5. TradingView webhook URL</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Once deployed, your webhook endpoint will be:
          </p>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-cyan-200">
            https://your-domain.vercel.app/api/tradingview/webhook
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            TradingView payloads should include both the shared secret and your profile-specific webhook token so imported alerts bind to the right user.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
