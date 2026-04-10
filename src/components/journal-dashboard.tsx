"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { demoHistory, type PersistedReview } from "@/lib/tradegate";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

async function getSignedInUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function loadReviews(userId: string | null): Promise<PersistedReview[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return demoHistory;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return demoHistory;
  return data;
}

export function JournalDashboard() {
  const [reviews, setReviews] = useState<PersistedReview[]>(demoHistory);
  const [status, setStatus] = useState("Edit outcomes and notes to build actual behavior analytics.");
  const [userId, setUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sourceFilter = searchParams.get("source");

  useEffect(() => {
    async function boot() {
      const currentUserId = await getSignedInUserId();
      setUserId(currentUserId);
      const loaded = await loadReviews(currentUserId);
      setReviews(loaded);
    }

    boot();
  }, []);

  const filteredReviews = useMemo(() => {
    if (!sourceFilter) return reviews;
    return reviews.filter((review) => (review.source ?? "manual") === sourceFilter);
  }, [reviews, sourceFilter]);

  const analytics = useMemo(() => {
    const total = filteredReviews.length;
    const pass = filteredReviews.filter((review) => review.verdict === "PASS").length;
    const warn = filteredReviews.filter((review) => review.verdict === "WARN").length;
    const fail = filteredReviews.filter((review) => review.verdict === "FAIL").length;
    const win = filteredReviews.filter((review) => review.outcome === "Win").length;
    const loss = filteredReviews.filter((review) => review.outcome === "Loss").length;
    const skipped = filteredReviews.filter((review) => review.outcome === "Skipped").length;
    const avgDiscipline = total
      ? Math.round(filteredReviews.reduce((sum, review) => sum + review.discipline_score, 0) / total)
      : 0;
    const avgChecklist = total
      ? Math.round(filteredReviews.reduce((sum, review) => sum + (review.checklist_score ?? 0), 0) / total)
      : 0;
    const avgReadiness = total
      ? Math.round(filteredReviews.reduce((sum, review) => sum + (review.execution_readiness ?? 0), 0) / total)
      : 0;
    const warnOrFailLosses = filteredReviews.filter(
      (review) => ["WARN", "FAIL"].includes(review.verdict) && review.outcome === "Loss"
    ).length;

    const topWarning = filteredReviews
      .flatMap((review) => review.warnings ?? [])
      .reduce<Record<string, number>>((acc, warning) => {
        acc[warning] = (acc[warning] ?? 0) + 1;
        return acc;
      }, {});

    const topWarningEntry = Object.entries(topWarning).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      passRate: total ? Math.round((pass / total) * 100) : 0,
      warnRate: total ? Math.round((warn / total) * 100) : 0,
      failRate: total ? Math.round((fail / total) * 100) : 0,
      winRate: total ? Math.round((win / total) * 100) : 0,
      lossRate: total ? Math.round((loss / total) * 100) : 0,
      skipped,
      avgDiscipline,
      avgChecklist,
      avgReadiness,
      warnOrFailLosses,
      topWarning: topWarningEntry?.[0] ?? "No dominant warning yet"
    };
  }, [filteredReviews]);

  const updateReview = async (reviewId: string, patch: Partial<PersistedReview>) => {
    setReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, ...patch } : review)));

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      setStatus("Sign in to save journal updates to your account.");
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .update({
        outcome: patch.outcome,
        journal_note: patch.journal_note,
        override_reason: patch.override_reason,
        override_executed: patch.override_executed
      })
      .eq("id", reviewId)
      .eq("user_id", userId);

    if (error) {
      setStatus(`Save failed: ${error.message}`);
      return;
    }

    setStatus("Journal update saved.");
  };

  return (
    <AppShell
      title="Review history and journal"
      description="This is where the product gets sticky. You start seeing what kind of trade you should block, not just what kind of trade you should take."
    >
      {sourceFilter ? (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          Showing only reviews from source: <strong>{sourceFilter}</strong>. <Link href="/journal" className="font-semibold underline">Clear filter</Link>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-10">
        {[
          { label: "Total", value: analytics.total },
          { label: "Pass", value: `${analytics.passRate}%` },
          { label: "Warn", value: `${analytics.warnRate}%` },
          { label: "Fail", value: `${analytics.failRate}%` },
          { label: "Win", value: `${analytics.winRate}%` },
          { label: "Loss", value: `${analytics.lossRate}%` },
          { label: "Skipped", value: analytics.skipped },
          { label: "Avg discipline", value: analytics.avgDiscipline },
          { label: "Avg checklist", value: analytics.avgChecklist },
          { label: "Avg readiness", value: analytics.avgReadiness }
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{stat.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">Editable review timeline</h2>
            <div className="text-sm text-slate-600">{status}</div>
          </div>
          <div className="mt-4 space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {review.symbol} • {review.direction}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {new Date(review.created_at).toLocaleString()} • {review.strategy_slug ?? "manual"} • {review.source ?? "manual"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/review/${review.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 hover:text-cyan-800">
                      Details
                    </Link>
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
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{review.thesis}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-6 text-sm">
                  <div className="rounded-xl bg-white p-3 text-slate-700">RR: {review.risk_reward}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Discipline: {review.discipline_score}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Clarity: {review.clarity_score}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Checklist: {review.checklist_score ?? "—"}</div>
                  <div className="rounded-xl bg-white p-3 text-slate-700">Readiness: {review.execution_readiness ?? "—"}</div>
                  <select
                    value={review.outcome ?? "Pending"}
                    onChange={(event) => updateReview(review.id, { outcome: event.target.value })}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700 outline-none focus:border-slate-900"
                  >
                    <option>Pending</option>
                    <option>Win</option>
                    <option>Loss</option>
                    <option>Skipped</option>
                    <option>Breakeven</option>
                  </select>
                </div>
                {review.verdict !== "PASS" ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(review.override_executed)}
                        onChange={(event) => updateReview(review.id, { override_executed: event.target.checked })}
                        className="mt-1"
                      />
                      <span>I overrode the gate and took this trade anyway.</span>
                    </label>
                    <textarea
                      value={review.override_reason ?? ""}
                      onChange={(event) => updateReview(review.id, { override_reason: event.target.value })}
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                      placeholder="Why did you override the gate?"
                    />
                  </div>
                ) : null}
                <textarea
                  value={review.journal_note ?? ""}
                  onChange={(event) => updateReview(review.id, { journal_note: event.target.value })}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-slate-900"
                  placeholder="What happened? Did you follow the plan? Did the warning help?"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Pattern board</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">Most common warning</div>
                <div className="mt-2">{analytics.topWarning}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">Losses after WARN/FAIL</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{analytics.warnOrFailLosses}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Ignored-friction proxy</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">Imported alert queue</div>
                <div className="mt-2">Use the TradingView filter to inspect webhook-created reviews separately.</div>
                <Link href="/journal?source=tradingview-webhook" className="mt-3 inline-block font-semibold text-cyan-700 hover:text-cyan-800">
                  Open imported-alert queue →
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
            <h2 className="text-2xl font-semibold">Next analytics worth building</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>• verdict-to-outcome conversion by strategy</li>
              <li>• emotional-state correlation to losses</li>
              <li>• checklist miss frequency by strategy type</li>
              <li>• top rules ignored before losing trades</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
