import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { demoHistory } from "@/lib/tradegate";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function ReviewDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  await ensureProfile();

  const supabase = await getSupabaseServerClient();

  let review = null;
  if (supabase && user) {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    review = data;
  }

  const fallback = demoHistory.find((item) => item.id === id) ?? demoHistory[0];
  const item = review ?? fallback;

  return (
    <AppShell
      title={`Review detail: ${item.symbol}`}
      description="This page is the start of a fuller audit trail for each reviewed trade."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                {item.symbol} • {item.direction}
              </h2>
              <div className="mt-2 text-sm text-slate-600">{new Date(item.created_at).toLocaleString()}</div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                item.verdict === "PASS"
                  ? "bg-emerald-100 text-emerald-700"
                  : item.verdict === "WARN"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {item.verdict}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">Entry: {item.entry_price}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Stop: {item.stop_loss}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Target: {item.target_price}</div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">Thesis</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.thesis}</p>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">Market context</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.market_context}</p>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-950">Journal note</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.journal_note ?? "No note yet."}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Warnings</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {(item.warnings.length ? item.warnings : ["No warnings recorded."]).map((warning: string) => (
                <li key={warning} className="rounded-2xl bg-slate-50 p-4">{warning}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Critical questions</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {(item.critical_questions.length ? item.critical_questions : ["No questions recorded."]).map((question: string) => (
                <li key={question} className="rounded-2xl bg-slate-50 p-4">{question}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
            <h2 className="text-2xl font-semibold">Audit trail direction</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This detail page now fetches real signed-in user review data when available, while still falling back to demo content during local setup.
            </p>
            <Link href="/journal" className="mt-4 inline-block font-semibold text-cyan-300 hover:text-cyan-200">
              Back to journal →
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
