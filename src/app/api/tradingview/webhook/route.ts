import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { reviewTrade, strategies, type ReviewInput } from "@/lib/tradegate";

type TradingViewPayload = {
  secret?: string;
  token?: string;
  symbol?: string;
  ticker?: string;
  direction?: "Long" | "Short" | string;
  side?: "Long" | "Short" | string;
  entry?: number | string;
  stopLoss?: number | string;
  stop_loss?: number | string;
  target?: number | string;
  targetPrice?: number | string;
  strategySlug?: string;
  strategy_slug?: string;
  thesis?: string;
  marketContext?: string;
  market_context?: string;
  emotions?: string[] | string;
  confidence?: number | string;
};

function toNumber(value: number | string | undefined, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeDirection(value?: string) {
  const lower = value?.trim().toLowerCase();
  if (lower === "short" || lower === "sell") return "Short";
  return "Long";
}

function normalizeEmotions(value?: string[] | string) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["Calm"];
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET;

  let body: TradingViewPayload;
  try {
    body = (await request.json()) as TradingViewPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  if (expectedSecret && body.secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }

  if (!body.token) {
    return NextResponse.json({ ok: false, error: "Missing user webhook token" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("tradingview_webhook_token", body.token)
    .single();

  if (!profile) {
    return NextResponse.json({ ok: false, error: "Unknown webhook token" }, { status: 404 });
  }

  const { data: ownedStrategies } = await supabase
    .from("strategies")
    .select("*")
    .eq("user_id", profile.id);

  const strategyList = ownedStrategies?.length
    ? ownedStrategies.map((row) => ({
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
      }))
    : strategies;

  const strategySlug = body.strategySlug ?? body.strategy_slug;
  const strategy = strategyList.find((item) => item.slug === strategySlug) ?? strategyList[0];

  const entry = toNumber(body.entry, 0);
  const stopLoss = toNumber(body.stopLoss ?? body.stop_loss, entry);
  const target = toNumber(body.target ?? body.targetPrice, entry);

  const input: ReviewInput = {
    strategyId: strategy.id,
    symbol: body.symbol ?? body.ticker ?? "UNKNOWN",
    direction: normalizeDirection(body.direction ?? body.side),
    entry,
    stopLoss,
    target,
    thesis: body.thesis ?? "TradingView alert-triggered setup awaiting trader confirmation.",
    marketContext: body.marketContext ?? body.market_context ?? "Imported from TradingView alert.",
    emotions: normalizeEmotions(body.emotions),
    confidence: toNumber(body.confidence, 50)
  };

  const result = reviewTrade(input, strategyList);

  const { error: insertError } = await supabase.from("reviews").insert({
    user_id: profile.id,
    strategy_id: strategy.id,
    strategy_slug: strategy.slug,
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
    source: "tradingview-webhook"
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: `Failed to persist webhook review: ${insertError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    boundUserId: profile.id,
    source: "tradingview-webhook",
    verdict: result.verdict,
    summary: result.summary,
    warnings: result.warnings,
    criticalQuestions: result.criticalQuestions,
    checklistHits: result.checklistHits,
    checklistMisses: result.checklistMisses,
    guardrails: result.guardrails,
    executionReadiness: result.executionReadiness
  });
}
