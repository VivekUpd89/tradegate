import { AppShell } from "@/components/app-shell";
import { strategies } from "@/lib/tradegate";

export function StrategyLibrary() {
  return (
    <AppShell
      title="Strategy library"
      description="The trader should teach the product what good looks like before the product is allowed to critique live trade ideas."
    >
      <section className="grid gap-6 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <div key={strategy.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">{strategy.name}</h2>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                RR {strategy.minRiskReward}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {strategy.style} • {strategy.market} • {strategy.timeframe}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-700">{strategy.notes}</p>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {strategy.checklist.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Forbidden conditions</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {strategy.forbidden.map((item) => (
                  <li key={item} className="rounded-xl bg-rose-50 p-3 text-rose-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
