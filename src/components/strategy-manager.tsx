"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { strategies as fallbackStrategies, type Strategy } from "@/lib/tradegate";

type StrategyForm = {
  id?: string;
  slug: string;
  name: string;
  style: string;
  market: string;
  timeframe: string;
  checklistText: string;
  forbiddenText: string;
  minRiskReward: number;
  notes: string;
};

const emptyForm: StrategyForm = {
  slug: "",
  name: "",
  style: "",
  market: "",
  timeframe: "",
  checklistText: "",
  forbiddenText: "",
  minRiskReward: 1.5,
  notes: ""
};

function toForm(strategy?: Strategy): StrategyForm {
  if (!strategy) return emptyForm;
  return {
    id: strategy.id,
    slug: strategy.slug,
    name: strategy.name,
    style: strategy.style,
    market: strategy.market,
    timeframe: strategy.timeframe,
    checklistText: strategy.checklist.join("\n"),
    forbiddenText: strategy.forbidden.join("\n"),
    minRiskReward: strategy.minRiskReward,
    notes: strategy.notes
  };
}

function mapRowToStrategy(row: {
  id: string;
  slug: string;
  name: string;
  style: string;
  market: string;
  timeframe: string;
  checklist: string[];
  forbidden: string[];
  min_risk_reward: number;
  notes: string;
}): Strategy {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    style: row.style,
    market: row.market,
    timeframe: row.timeframe,
    checklist: row.checklist ?? [],
    forbidden: row.forbidden ?? [],
    minRiskReward: Number(row.min_risk_reward),
    notes: row.notes
  };
}

export function StrategyManager() {
  const [strategyList, setStrategyList] = useState<Strategy[]>(fallbackStrategies);
  const [selectedId, setSelectedId] = useState<string>(fallbackStrategies[0]?.id ?? "");
  const [form, setForm] = useState<StrategyForm>(toForm(fallbackStrategies[0]));
  const [status, setStatus] = useState(isSupabaseConfigured() ? "Connected to Supabase." : "Demo mode. Configure Supabase and sign in to save strategies.");
  const [userId, setUserId] = useState<string | null>(null);

  const selectedStrategy = useMemo(
    () => strategyList.find((strategy) => strategy.id === selectedId) ?? strategyList[0],
    [selectedId, strategyList]
  );

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id ?? null;
      setUserId(currentUserId);
      if (!currentUserId) {
        setStatus("Sign in to load your personal strategies.");
        return;
      }

      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: true });

      if (error || !data?.length) return;
      const mapped = data.map(mapRowToStrategy);
      setStrategyList(mapped);
      setSelectedId(mapped[0].id);
      setForm(toForm(mapped[0]));
    }

    load();
  }, []);

  useEffect(() => {
    setForm(toForm(selectedStrategy));
  }, [selectedStrategy]);

  const saveStrategy = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      setStatus("Sign in first to save strategies.");
      return;
    }

    const payload = {
      user_id: userId,
      slug: form.slug.trim(),
      name: form.name.trim(),
      style: form.style.trim(),
      market: form.market.trim(),
      timeframe: form.timeframe.trim(),
      checklist: form.checklistText.split("\n").map((line) => line.trim()).filter(Boolean),
      forbidden: form.forbiddenText.split("\n").map((line) => line.trim()).filter(Boolean),
      min_risk_reward: form.minRiskReward,
      notes: form.notes.trim()
    };

    if (form.id) {
      const { data, error } = await supabase
        .from("strategies")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();

      if (error) {
        setStatus(`Save failed: ${error.message}`);
        return;
      }

      const updated = mapRowToStrategy(data);
      setStrategyList((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setStatus("Strategy updated.");
      return;
    }

    const { data, error } = await supabase.from("strategies").insert(payload).select().single();

    if (error) {
      setStatus(`Create failed: ${error.message}`);
      return;
    }

    const created = mapRowToStrategy(data);
    setStrategyList((current) => [...current, created]);
    setSelectedId(created.id);
    setStatus("Strategy created.");
  };

  const deleteStrategy = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      setStatus("Sign in first to delete strategies.");
      return;
    }

    if (!form.id) {
      setForm(emptyForm);
      setStatus("Blank form ready for a new strategy.");
      return;
    }

    const { error } = await supabase.from("strategies").delete().eq("id", form.id);
    if (error) {
      setStatus(`Delete failed: ${error.message}`);
      return;
    }

    const next = strategyList.filter((item) => item.id !== form.id);
    setStrategyList(next);
    setSelectedId(next[0]?.id ?? "");
    setForm(next[0] ? toForm(next[0]) : emptyForm);
    setStatus("Strategy deleted.");
  };

  return (
    <AppShell
      title="Custom strategy creation and editing"
      description="This is where the trader teaches TradeGate what a valid setup looks like. The better the playbook, the better the critique."
    >
      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">Library</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedId("");
                setForm(emptyForm);
                setStatus("Creating a new strategy.");
              }}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              New strategy
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {strategyList.map((strategy) => (
              <button
                key={strategy.id}
                type="button"
                onClick={() => setSelectedId(strategy.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  selectedId === strategy.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
                }`}
              >
                <div className="font-semibold">{strategy.name}</div>
                <div className={`mt-1 text-sm ${selectedId === strategy.id ? "text-slate-300" : "text-slate-600"}`}>
                  {strategy.style} • {strategy.timeframe}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Strategy editor</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{status}</p>
            </div>
            <button
              type="button"
              onClick={deleteStrategy}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Slug", "slug"],
              ["Name", "name"],
              ["Style", "style"],
              ["Market", "market"],
              ["Timeframe", "timeframe"]
            ].map(([label, key]) => (
              <label key={key} className="space-y-2 text-sm font-medium text-slate-700">
                {label}
                <input
                  value={form[key as keyof StrategyForm] as string}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
                />
              </label>
            ))}

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Minimum risk/reward
              <input
                type="number"
                step="0.1"
                value={form.minRiskReward}
                onChange={(event) => setForm((current) => ({ ...current, minRiskReward: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Checklist (one per line)
            <textarea
              rows={6}
              value={form.checklistText}
              onChange={(event) => setForm((current) => ({ ...current, checklistText: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Forbidden conditions (one per line)
            <textarea
              rows={5}
              value={form.forbiddenText}
              onChange={(event) => setForm((current) => ({ ...current, forbiddenText: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Notes
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={saveStrategy}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Save strategy
            </button>
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Clear form
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
