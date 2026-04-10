import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { reviewTrade, strategies, type ReviewInput } from "@/lib/tradegate";

type TradingViewPayload = {
  secret?: string;
  token?: string;
  symbol?: string;
  direction?: "Long" | "Short";
  entry?: number;
  stopLoss?: number;
  target?: number;
  strategySlug?: string;
  thesis?: string;
  marketContext?: string;
  emotions?: string[];
  confidence?: number;
};

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET;
  const body = (await request.json()) as TradingViewPayload;

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

  const strategy = strategyList.find((item) => item.slug === body.strategySlug) ?? strategyList[0];

  const input: ReviewInput = {
    strategyId: strategy.id,
    symbol: body.symbol ?? "UNKNOWN",
    direction: body.direction ?? "Long",
    entry: Number(body.entry ?? 0),
    stopLoss: Number(body.stopLoss ?? 0),
    target: Number(body.target ?? 0),
    thesis: body.thesis ?? "TradingView alert-triggered setup awaiting trader confirmation.",
    marketContext: body.marketContext ?? "Imported from TradingView alert.",
    emotions: body.emotions ?? ["Calm"],
    confidence: Number(body.confidence ?? 50)
  };

  const result = reviewTrade(input, strategyList);

  await supabase.from("reviews").insert({
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
