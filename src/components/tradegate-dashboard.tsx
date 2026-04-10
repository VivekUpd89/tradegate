import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthPanel } from "@/components/auth-panel";
import { ConfigDiagnostics } from "@/components/config-diagnostics";
import { demoHistory, strategies } from "@/lib/tradegate";

export function TradegateDashboard() {
  const totalReviews = demoHistory.length;
  const passRate = Math.round((demoHistory.filter((review) => review.verdict === "PASS").length / totalReviews) * 100);
  const blocked = demoHistory.filter((review) => review.verdict === "FAIL").length;
  const browserSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <AppShell
      title="Execution discipline dashboard"
      description="A multi-page MVP for traders who want a deliberate checkpoint between impulse and order entry."
    >
      <ConfigDiagnostics browserSupabaseConfigured={browserSupabaseConfigured} appUrl={appUrl} />

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/50 bg-[#0f172a] p-8 text-white shadow-2xl shadow-slate-950/10">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Core thesis
          </span>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Force every discretionary trade through a critic before money is at risk.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            TradeGate is not trying to be a signal machine. It is a behavior-aware execution gate that asks: does this trade match the playbook, does it respect risk, and does it still make sense once spoken out loud?
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/review" className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Start a review
            </Link>
            <Link href="/integration" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Connect to TradingView paper trades
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { label: "Total reviews", value: totalReviews.toString() },
            { label: "Pass rate", value: `${passRate}%` },
            { label: "Blocked trades", value: blocked.toString() }
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AuthPanel />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-slate-950">Recent review history</h3>
            <Link href="/journal" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
              Open journal →
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {demoHistory.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {review.symbol} • {review.direction}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{review.thesis}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.verdict === "PASS"
                        ? "bg-emerald-100 text-emerald-700"
                        : review.verdict === "WARN"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {review.verdict}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3 text-slate-700">RR: {review.risk_reward}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Discipline: {review.discipline_score}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Outcome: {review.outcome ?? "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-slate-950">Starter strategy vault</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {strategies.map((strategy) => (
            <div key={strategy.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">{strategy.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {strategy.style} • {strategy.market} • {strategy.timeframe}
                  </div>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  RR {strategy.minRiskReward}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{strategy.notes}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
