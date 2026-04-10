"use client";

import { useMemo, useState } from "react";
import { reviewTrade, strategies, type ReviewInput } from "@/lib/tradegate";

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

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function TradegateClient() {
  const [input, setInput] = useState<ReviewInput>(initialInput);

  const result = useMemo(() => reviewTrade(input), [input]);
  const activeStrategy = strategies.find((strategy) => strategy.id === input.strategyId) ?? strategies[0];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
      <section className="grid gap-6 rounded-3xl border border-white/10 bg-[#0f172a] p-8 text-white shadow-2xl shadow-slate-950/20 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            TradeGate MVP
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            An AI execution checkpoint for traders who want friction before fear and greed take over.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            This MVP forces the trader to define a playbook, explain the trade, and pass through a critical review before execution.
            The point is not prediction. The point is discipline.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-200">
            {[
              "Strategy-aware review",
              "Behavioral red flags",
              "Pass / warn / fail verdict",
              "Manual trader first"
            ].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current verdict</h2>
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

          <p className="text-sm leading-6 text-slate-300">{result.summary}</p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <div className="text-slate-400">R:R</div>
              <div className="mt-1 text-2xl font-semibold">{result.riskReward}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <div className="text-slate-400">Discipline</div>
              <div className="mt-1 text-2xl font-semibold">{result.disciplineScore}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <div className="text-slate-400">Clarity</div>
              <div className="mt-1 text-2xl font-semibold">{result.clarityScore}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Critical pushback</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {(result.criticalQuestions.length ? result.criticalQuestions : ["If this fails instantly, what exactly would prove you were wrong?"]).map((question) => (
                <li key={question} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">1. Strategy vault</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The trader pre-defines ideal setups. The gatekeeper compares live trade intent against this playbook.
            </p>
          </div>

          <div className="space-y-4">
            {strategies.map((strategy) => {
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
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeStrategy.notes}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checklist</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {activeStrategy.checklist.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Forbidden</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {activeStrategy.forbidden.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">2. Pre-trade review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is the execution checkpoint. Typed or voice intent comes through here before any order is allowed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Symbol
              <input
                value={input.symbol}
                onChange={(event) => setInput((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-0 transition focus:border-slate-900"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Direction
              <select
                value={input.direction}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    direction: event.target.value as ReviewInput["direction"]
                  }))
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
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
              placeholder="Why this trade, why now, and what would invalidate it?"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            Market conditions
            <textarea
              value={input.marketContext}
              onChange={(event) => setInput((current) => ({ ...current, marketContext: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
              placeholder="Trend day, range day, event-driven, liquidity, breadth, volatility..."
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
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
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

          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="font-semibold text-slate-900">Execution status</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                In the production version, PASS enables the order ticket, WARN requires reduce-size or rewording, and FAIL blocks the send action.
              </p>
            </div>
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

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-2xl font-semibold text-slate-900">3. Why traders would pay</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Prevent one bad trade",
                text: "A single avoided revenge trade can justify a month or a year of subscription fees."
              },
              {
                title: "Force discipline ritual",
                text: "The habit loop becomes: explain → critique → decide, instead of urge → click → regret."
              },
              {
                title: "Behavioral analytics",
                text: "The app compounds value over time by showing where a trader breaks their own rules."
              }
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <h2 className="text-2xl font-semibold">Starter pricing hypothesis</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-300">Retail Pro</div>
              <div className="mt-1 text-3xl font-semibold">₹999/mo</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Unlimited playbooks, daily reviews, journal, and weekly discipline reports.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm text-slate-300">Elite</div>
              <div className="mt-1 text-3xl font-semibold">₹2,499/mo</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Broker integration waitlist, voice review, advanced analytics, and override audit trail.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
