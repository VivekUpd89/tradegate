"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { reviewTrade, strategies, type ReviewInput, type Strategy } from "@/lib/tradegate";

const emotionOptions = ["Calm", "Confident", "Fear", "FOMO", "Revenge", "Tired"];

const initialInput: ReviewInput = {
  strategyId: strategies[0].id,
  symbol: "NIFTY",
  direction: "Long",
  entry: 22450,
  stopLoss: 22420,
  target: 22520,
  thesis:
    "Breakout above morning range, price pulled back and held prior resistance as support with improving participation.",
  marketContext:
    "Index has been trending higher since open, no major news spike, breadth supportive, and the breakout level has been tested once already.",
  emotions: ["Calm"],
  confidence: 68
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultLike[];
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    SpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

async function getSignedInUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function loadStrategies(userId: string | null): Promise<Strategy[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return strategies;

  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data?.length) return strategies;

  return data.map((row) => ({
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
  }));
}

export function ReviewWorkbench() {
  const [input, setInput] = useState<ReviewInput>(initialInput);
  const [strategyList, setStrategyList] = useState<Strategy[]>(strategies);
  const [saveMessage, setSaveMessage] = useState<string>(isSupabaseConfigured() ? "Supabase ready" : "Supabase not configured. Using local demo mode.");
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    async function boot() {
      const currentUserId = await getSignedInUserId();
      setUserId(currentUserId);
      const loaded = await loadStrategies(currentUserId);
      setStrategyList(loaded);
      if (!loaded.find((strategy) => strategy.id === input.strategyId)) {
        setInput((current) => ({ ...current, strategyId: loaded[0]?.id ?? current.strategyId }));
      }
    }

    boot();
  }, [input.strategyId]);

  const result = useMemo(() => reviewTrade(input, strategyList), [input, strategyList]);
  const activeStrategy = strategyList.find((strategy) => strategy.id === input.strategyId) ?? strategyList[0];

  const startVoiceCapture = () => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      setSaveMessage("Voice input is not supported in this browser. Chrome usually works best.");
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((resultItem) => resultItem[0].transcript)
        .join(" ");

      setInput((current) => ({
        ...current,
        thesis: `${current.thesis} ${transcript}`.trim()
      }));
      setSaveMessage("Voice note added to thesis. Clean it up before saving.");
      setIsListening(false);
    };

    recognition.onerror = () => {
      setSaveMessage("Voice capture failed. You can still type your trade normally.");
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceCapture = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const saveReview = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) {
      setSaveMessage("Sign in first to persist reviews under your account.");
      return;
    }

    setIsSaving(true);
    const payload = {
      user_id: userId,
      strategy_id: activeStrategy?.id ?? null,
      strategy_slug: activeStrategy?.slug ?? null,
      symbol: input.symbol,
      direction: input.direction,
      entry_price: input.entry,
      stop_loss: input.stopLoss,
      target_price: input.target,
      thesis: input.thesis,
      market_context: input.marketContext,
      emotions: input.emotions,
      confidence: input.confidence,
      verdict: result.verdict,
      risk_reward: result.riskReward,
      discipline_score: result.disciplineScore,
      clarity_score: result.clarityScore,
      checklist_score: result.checklistScore,
      execution_readiness: result.executionReadiness,
      warnings: result.warnings,
      critical_questions: result.criticalQuestions,
      checklist_hits: result.checklistHits,
      checklist_misses: result.checklistMisses,
      guardrails: result.guardrails,
      summary: result.summary,
      source: "manual"
    };

    const { error } = await supabase.from("reviews").insert(payload);
    setIsSaving(false);

    if (error) {
      setSaveMessage(`Failed to save review: ${error.message}`);
      return;
    }

    setSaveMessage("Review saved to your account.");
  };

  return (
    <AppShell
      title="Pre-trade review workbench"
      description="Typed or spoken intent comes through here. In the production path, PASS would unlock the order ticket while FAIL keeps the gate shut."
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Strategy vault</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose the playbook this trade is supposed to match.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {userId ? "Signed in" : "Guest/demo"}
            </div>
          </div>

          <div className="space-y-4">
            {strategyList.map((strategy) => {
              const active = strategy.id === input.strategyId;
              return (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => setInput((current) => ({ ...current, strategyId: strategy.id }))}
                  className={classNames(
                    "w-full rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{strategy.name}</div>
                      <div className={classNames("mt-1 text-sm", active ? "text-slate-300" : "text-slate-600")}>
                        {strategy.style} • {strategy.timeframe}
                      </div>
                    </div>
                    <span className={classNames("rounded-full px-2.5 py-1 text-xs", active ? "bg-white/10 text-white" : "bg-slate-200 text-slate-700")}>
                      Min RR {strategy.minRiskReward}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Current playbook notes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeStrategy?.notes}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Trade intent capture</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Make the trader explain the trade before capital is committed.</p>
            </div>
            <button
              type="button"
              onClick={isListening ? stopVoiceCapture : startVoiceCapture}
              className={classNames(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                isListening ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {isListening ? "Stop voice capture" : "Add voice note"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Symbol
              <input
                value={input.symbol}
                onChange={(event) => setInput((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Direction
              <select
                value={input.direction}
                onChange={(event) =>
                  setInput((current) => ({ ...current, direction: event.target.value as ReviewInput["direction"] }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              >
                <option>Long</option>
                <option>Short</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Entry
              <input
                type="number"
                value={input.entry}
                onChange={(event) => setInput((current) => ({ ...current, entry: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Stop loss
              <input
                type="number"
                value={input.stopLoss}
                onChange={(event) => setInput((current) => ({ ...current, stopLoss: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Target
              <input
                type="number"
                value={input.target}
                onChange={(event) => setInput((current) => ({ ...current, target: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900"
              />
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Trade thesis
            <textarea
              value={input.thesis}
              onChange={(event) => setInput((current) => ({ ...current, thesis: event.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Market context
            <textarea
              value={input.marketContext}
              onChange={(event) => setInput((current) => ({ ...current, marketContext: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
            />
          </label>

          <div className="mt-4">
            <div className="text-sm font-medium text-slate-700">Current emotional state</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {emotionOptions.map((emotion) => {
                const active = input.emotions.includes(emotion);
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        emotions: active
                          ? current.emotions.filter((item) => item !== emotion)
                          : [...current.emotions.filter((item) => item !== "Calm"), emotion]
                      }))
                    }
                    className={classNames(
                      "rounded-full border px-3 py-2 text-sm transition",
                      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                    )}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Confidence: <span className="font-semibold text-slate-900">{input.confidence}%</span>
            <input
              type="range"
              min={1}
              max={100}
              value={input.confidence}
              onChange={(event) => setInput((current) => ({ ...current, confidence: Number(event.target.value) }))}
              className="mt-3 w-full"
            />
          </label>

          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <div className="font-semibold text-slate-900">Persistence</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{saveMessage}</p>
            </div>
            <button
              type="button"
              onClick={saveReview}
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save review"}
            </button>
            <button
              type="button"
              className={classNames(
                "rounded-2xl px-5 py-3 text-sm font-semibold transition",
                result.verdict === "PASS" && "bg-emerald-600 text-white hover:bg-emerald-500",
                result.verdict === "WARN" && "bg-amber-500 text-slate-950 hover:bg-amber-400",
                result.verdict === "FAIL" && "bg-rose-600 text-white hover:bg-rose-500"
              )}
            >
              {result.verdict === "PASS" ? "Order Eligible" : result.verdict === "WARN" ? "Review Before Sending" : "Blocked by Gate"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Live verdict</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">The critic challenges the structure, reward, and emotional state of the trade.</p>
          </div>
          <span
            className={classNames(
              "rounded-full px-3 py-1 text-xs font-bold tracking-wide",
              result.verdict === "PASS" && "bg-emerald-400/20 text-emerald-200",
              result.verdict === "WARN" && "bg-amber-400/20 text-amber-200",
              result.verdict === "FAIL" && "bg-rose-400/20 text-rose-200"
            )}
          >
            {result.verdict}
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Risk / Reward</div>
            <div className="mt-1 text-3xl font-semibold">{result.riskReward}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Discipline</div>
            <div className="mt-1 text-3xl font-semibold">{result.disciplineScore}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Clarity</div>
            <div className="mt-1 text-3xl font-semibold">{result.clarityScore}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Checklist</div>
            <div className="mt-1 text-3xl font-semibold">{result.checklistScore}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Readiness</div>
            <div className="mt-1 text-3xl font-semibold">{result.executionReadiness}</div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Warnings</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {(result.warnings.length ? result.warnings : ["No major red flags. Stay honest about position size and exit discipline."]).map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Critical questions</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {(result.criticalQuestions.length ? result.criticalQuestions : ["If this fails instantly, what exactly proves your thesis wrong?"]).map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Checklist coverage</h3>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Present</div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {(result.checklistHits.length ? result.checklistHits : ["No checklist items clearly confirmed yet."]).map((item) => (
                    <li key={item} className="rounded-xl border border-emerald-400/15 bg-emerald-400/10 p-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Missing / unclear</div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {(result.checklistMisses.length ? result.checklistMisses : ["Checklist coverage looks complete enough for this pass."]).map((item) => (
                    <li key={item} className="rounded-xl border border-amber-400/15 bg-amber-400/10 p-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Guardrails that passed</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {(result.guardrails.length ? result.guardrails : ["No positive guardrails confirmed yet. Tighten the setup description."]).map((item) => (
                <li key={item} className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
