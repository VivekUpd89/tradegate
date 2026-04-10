export type Strategy = {
  id: string;
  slug: string;
  name: string;
  style: string;
  market: string;
  timeframe: string;
  checklist: string[];
  forbidden: string[];
  minRiskReward: number;
  notes: string;
};

export type ReviewInput = {
  strategyId: string;
  symbol: string;
  direction: "Long" | "Short";
  entry: number;
  stopLoss: number;
  target: number;
  thesis: string;
  marketContext: string;
  emotions: string[];
  confidence: number;
};

export type ReviewResult = {
  verdict: "PASS" | "WARN" | "FAIL";
  riskReward: number;
  disciplineScore: number;
  clarityScore: number;
  checklistScore: number;
  executionReadiness: number;
  warnings: string[];
  criticalQuestions: string[];
  checklistHits: string[];
  checklistMisses: string[];
  guardrails: string[];
  summary: string;
};

export type PersistedReview = {
  id: string;
  strategy_id?: string | null;
  strategy_slug?: string | null;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  thesis: string;
  market_context: string;
  emotions: string[];
  confidence: number;
  verdict: "PASS" | "WARN" | "FAIL";
  risk_reward: number;
  discipline_score: number;
  clarity_score: number;
  warnings: string[];
  critical_questions: string[];
  checklist_hits?: string[];
  checklist_misses?: string[];
  guardrails?: string[];
  checklist_score?: number;
  execution_readiness?: number;
  summary: string;
  outcome?: string | null;
  journal_note?: string | null;
  source?: string | null;
  created_at: string;
};

export const strategies: Strategy[] = [
  {
    id: "local-breakout-pullback",
    slug: "breakout-pullback",
    name: "Breakout + Pullback Continuation",
    style: "Intraday momentum",
    market: "Index futures / liquid large caps",
    timeframe: "5m / 15m",
    checklist: [
      "Trend is already established before entry",
      "Breakout level is obvious and previously respected",
      "Entry only after pullback holds, not first blind spike",
      "Volume or participation confirms continuation",
      "Stop is below pullback failure point"
    ],
    forbidden: [
      "Chasing after an extended candle",
      "Entering because of FOMO after missing first move",
      "Taking breakout directly into major resistance",
      "Trading when stop placement is vague"
    ],
    minRiskReward: 1.8,
    notes: "Only take when you can explain where the trade is invalidated in one sentence."
  },
  {
    id: "local-mean-reversion",
    slug: "mean-reversion",
    name: "Mean Reversion Reclaim",
    style: "Counter-move scalp",
    market: "Range-bound liquid names",
    timeframe: "3m / 5m",
    checklist: [
      "Instrument is stretched away from value area",
      "There is a reclaim or failed breakdown / breakout",
      "Target is realistic and near mean / VWAP / prior range",
      "Trade size is smaller than trend-continuation setups"
    ],
    forbidden: [
      "Fading strong trend day without evidence of exhaustion",
      "Oversized position to recover prior losses",
      "Taking reversal purely because price feels too high or too low"
    ],
    minRiskReward: 1.5,
    notes: "This setup is valid only if the market is actually rotational, not trending cleanly."
  },
  {
    id: "local-options-momentum",
    slug: "options-momentum",
    name: "Options Momentum Entry",
    style: "Options directional",
    market: "NIFTY / BANKNIFTY / liquid stock options",
    timeframe: "5m / 15m",
    checklist: [
      "Underlying setup is clear before choosing option",
      "Liquidity and spread are acceptable",
      "Defined max premium risk exists",
      "Trade is not being used to hide oversized leverage"
    ],
    forbidden: [
      "Buying illiquid strikes",
      "Using options because futures loss feels scary",
      "No plan for time decay or exit timing"
    ],
    minRiskReward: 2,
    notes: "Option choice is implementation, not the thesis. Thesis must come from underlying market structure."
  }
];

const containsAny = (text: string, words: string[]) =>
  words.some((word) => text.toLowerCase().includes(word));

const normalize = (text: string) => text.toLowerCase();

const keywordGroups: Record<string, string[]> = {
  trend: ["trend", "trending", "higher high", "lower low", "momentum"],
  breakout: ["breakout", "break", "range break", "opening range break"],
  pullback: ["pullback", "retest", "retest hold", "held support", "retracement"],
  support: ["support", "demand", "held support", "bounce area"],
  resistance: ["resistance", "supply", "ceiling"],
  volume: ["volume", "participation", "oi", "open interest"],
  liquidity: ["liquidity", "spread", "liquid"],
  vwap: ["vwap", "value area", "mean"],
  range: ["range", "rotational", "inside day", "balance"],
  reclaim: ["reclaim", "failed breakdown", "failed breakout", "accept back above"],
  structure: ["structure", "level", "market structure", "swing"],
  invalidation: ["invalidation", "invalid", "below", "above", "failure point", "stop"]
};

function inferChecklistCoverage(strategy: Strategy, text: string) {
  const lower = normalize(text);
  const checklistHits: string[] = [];
  const checklistMisses: string[] = [];

  strategy.checklist.forEach((item) => {
    const itemLower = normalize(item);
    const matched = Object.entries(keywordGroups).some(([group, words]) => itemLower.includes(group) && containsAny(lower, words));
    const fallbackMatched = itemLower
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4)
      .some((token) => lower.includes(token));

    if (matched || fallbackMatched) checklistHits.push(item);
    else checklistMisses.push(item);
  });

  return { checklistHits, checklistMisses };
}

export function reviewTrade(input: ReviewInput, strategyList: Strategy[] = strategies): ReviewResult {
  const strategy = strategyList.find((item) => item.id === input.strategyId) ?? strategyList[0];
  const risk = Math.abs(input.entry - input.stopLoss);
  const reward = Math.abs(input.target - input.entry);
  const riskReward = risk === 0 ? 0 : Number((reward / risk).toFixed(2));

  const warnings: string[] = [];
  const criticalQuestions: string[] = [];
  const guardrails: string[] = [];

  const thesis = input.thesis.trim();
  const marketContext = input.marketContext.trim();
  const combinedText = `${thesis} ${marketContext}`.toLowerCase();
  const { checklistHits, checklistMisses } = inferChecklistCoverage(strategy, `${thesis} ${marketContext}`);

  if (!thesis || thesis.length < 35) {
    warnings.push("Your thesis is too thin. State the exact setup, trigger, and invalidation.");
    criticalQuestions.push("What specific market behavior makes this trade valid right now?");
  }

  if (riskReward < strategy.minRiskReward) {
    warnings.push(
      `Risk/reward is ${riskReward}:1, below the ${strategy.minRiskReward}:1 minimum for this strategy.`
    );
    criticalQuestions.push("Why is this worth taking if the payoff does not justify the risk?");
  } else {
    guardrails.push(`Reward profile clears the strategy minimum at ${riskReward}:1.`);
  }

  if (risk === 0) {
    warnings.push("Entry and stop loss are identical. The trade has no valid risk definition yet.");
    criticalQuestions.push("Where exactly is the trade invalidated if price moves against you?");
  }

  if (reward === 0) {
    warnings.push("Entry and target are identical. There is no defined reward target yet.");
  }

  if (risk > 0) {
    const riskPercent = Number(((risk / Math.max(Math.abs(input.entry), 1)) * 100).toFixed(2));
    if (riskPercent > 2.5) {
      warnings.push(`Risk distance is ${riskPercent}% from entry, which is unusually wide for an execution checkpoint trade.`);
      criticalQuestions.push("Is the stop too wide because the setup is vague rather than because structure demands it?");
    } else {
      guardrails.push(`Risk distance is defined at ${riskPercent}% from entry.`);
    }
  }

  if (input.direction === "Long" && input.stopLoss >= input.entry) {
    warnings.push("For a long trade, stop loss should be below entry.");
  }

  if (input.direction === "Short" && input.stopLoss <= input.entry) {
    warnings.push("For a short trade, stop loss should be above entry.");
  }

  if (input.direction === "Long" && input.target <= input.entry) {
    warnings.push("For a long trade, target should be above entry.");
  }

  if (input.direction === "Short" && input.target >= input.entry) {
    warnings.push("For a short trade, target should be below entry.");
  }

  if (
    containsAny(combinedText, [
      "fomo",
      "don’t want to miss",
      "dont want to miss",
      "miss the move",
      "quick recovery",
      "recover losses",
      "revenge"
    ])
  ) {
    warnings.push("Emotional trigger detected: the rationale sounds driven by FOMO or loss recovery.");
    criticalQuestions.push("Would you still take this if you had no prior missed move or loss today?");
  }

  if (
    input.emotions.includes("Fear") ||
    input.emotions.includes("Revenge") ||
    input.emotions.includes("FOMO")
  ) {
    warnings.push("Your selected emotional state is a red flag for impulsive execution.");
  }

  if (
    !containsAny(combinedText, [
      "support",
      "resistance",
      "vwap",
      "breakout",
      "pullback",
      "trend",
      "range",
      "liquidity",
      "volume",
      "reclaim",
      "failed breakdown",
      "structure"
    ])
  ) {
    warnings.push("The explanation lacks concrete market structure language.");
    criticalQuestions.push("Where is the structure edge here beyond a feeling about price?");
  }

  if (containsAny(combinedText, ["looks good", "feels strong", "should go", "maybe", "probably"])) {
    warnings.push("The thesis uses vague language instead of explicit evidence.");
  }

  if (!marketContext || marketContext.length < 20) {
    warnings.push("You have not described the current market conditions clearly enough.");
    criticalQuestions.push("Is this a trend day, range day, event-driven move, or random noise?");
  }

  if (input.confidence >= 85 && warnings.length >= 3) {
    warnings.push("Confidence is very high despite several red flags. That mismatch itself is a warning sign.");
    criticalQuestions.push("What would make you lower conviction here if you had to argue against the trade?");
  }

  if (input.confidence <= 35 && riskReward >= strategy.minRiskReward && thesis.length >= 50) {
    guardrails.push("The setup may be structurally acceptable, but your own confidence is low. Smaller size may be more honest than forcing conviction.");
  }

  if (checklistMisses.length >= Math.max(2, Math.ceil(strategy.checklist.length / 2))) {
    warnings.push("Your explanation does not cover enough of the strategy checklist. The setup may not actually match the playbook.");
    criticalQuestions.push("Which checklist items are explicitly present right now, and which ones are you assuming?");
  } else {
    guardrails.push("The explanation touches a meaningful share of the active strategy checklist.");
  }

  strategy.forbidden.forEach((item) => {
    const keyword = item.split(" ").slice(0, 3).join(" ").toLowerCase();
    if (combinedText.includes(keyword)) {
      warnings.push(`This trade appears close to a forbidden condition: ${item}`);
    }
  });

  const checklistCoverage = strategy.checklist.length
    ? checklistHits.length / strategy.checklist.length
    : 1;
  const checklistScore = Math.max(20, Math.min(100, Math.round(35 + checklistCoverage * 65)));

  const clarityBase = 100;
  const clarityPenalty = Math.min(
    65,
    warnings.length * 8 + (thesis.length < 50 ? 12 : 0) + (checklistMisses.length >= 2 ? 8 : 0)
  );
  const clarityScore = Math.max(25, clarityBase - clarityPenalty);

  let disciplineScore = 82;
  disciplineScore -= input.emotions.length * 7;
  if (riskReward < strategy.minRiskReward) disciplineScore -= 18;
  if (thesis.length < 35) disciplineScore -= 10;
  if (containsAny(combinedText, ["fomo", "recover", "revenge", "miss"])) disciplineScore -= 15;
  if (input.confidence >= 85 && warnings.length >= 3) disciplineScore -= 8;
  disciplineScore = Math.max(20, Math.min(95, disciplineScore));

  const executionReadiness = Math.max(
    20,
    Math.min(100, Math.round(disciplineScore * 0.45 + clarityScore * 0.3 + checklistScore * 0.25))
  );

  let verdict: ReviewResult["verdict"] = "PASS";
  if (warnings.length >= 5 || disciplineScore < 50 || executionReadiness < 45) verdict = "FAIL";
  else if (warnings.length >= 2 || clarityScore < 70 || checklistScore < 60 || executionReadiness < 70) verdict = "WARN";

  const summaryMap = {
    PASS: "Trade is reasonably aligned with the playbook. Execute only if sizing is still within your daily risk limits.",
    WARN: "Trade has potential, but the current explanation is not clean enough. Tighten the thesis, verify checklist coverage, or reduce size.",
    FAIL: "This looks like a low-discipline entry. Slow down. Rebuild the setup before risking capital."
  } as const;

  return {
    verdict,
    riskReward,
    disciplineScore,
    clarityScore,
    checklistScore,
    executionReadiness,
    warnings,
    criticalQuestions,
    checklistHits,
    checklistMisses,
    guardrails,
    summary: summaryMap[verdict]
  };
}

export const demoHistory: PersistedReview[] = [
  {
    id: "review-1",
    strategy_slug: "breakout-pullback",
    symbol: "NIFTY",
    direction: "Long",
    entry_price: 22450,
    stop_loss: 22420,
    target_price: 22520,
    thesis: "Breakout above morning range followed by a clean pullback hold at prior resistance.",
    market_context: "Trend day with broad support and no event volatility spike.",
    emotions: ["Calm"],
    confidence: 68,
    verdict: "PASS",
    risk_reward: 2.33,
    discipline_score: 75,
    clarity_score: 84,
    warnings: [],
    critical_questions: ["If the pullback fails, will you exit immediately without negotiation?"],
    checklist_hits: [
      "Trend is already established before entry",
      "Breakout level is obvious and previously respected",
      "Entry only after pullback holds, not first blind spike",
      "Stop is below pullback failure point"
    ],
    checklist_misses: ["Volume or participation confirms continuation"],
    guardrails: [
      "Reward profile clears the strategy minimum at 2.33:1.",
      "Risk distance is defined at 0.13% from entry.",
      "The explanation touches a meaningful share of the active strategy checklist."
    ],
    checklist_score: 87,
    execution_readiness: 82,
    summary: "Trade is reasonably aligned with the playbook. Execute only if sizing is still within your daily risk limits.",
    outcome: "Win",
    journal_note: "Felt clean. Followed plan. No impulse sizing.",
    source: "manual",
    created_at: new Date().toISOString()
  },
  {
    id: "review-2",
    strategy_slug: "options-momentum",
    symbol: "BANKNIFTY",
    direction: "Long",
    entry_price: 48120,
    stop_loss: 48090,
    target_price: 48160,
    thesis: "Did not want to miss the move after the first breakout candle.",
    market_context: "Fast tape after opening range break.",
    emotions: ["FOMO"],
    confidence: 82,
    verdict: "FAIL",
    risk_reward: 1.33,
    discipline_score: 42,
    clarity_score: 52,
    warnings: [
      "Emotional trigger detected: the rationale sounds driven by FOMO or loss recovery.",
      "Your selected emotional state is a red flag for impulsive execution."
    ],
    critical_questions: ["Would you still take this if you had not missed the first move?"],
    checklist_hits: ["Underlying setup is clear before choosing option"],
    checklist_misses: [
      "Liquidity and spread are acceptable",
      "Defined max premium risk exists",
      "Trade is not being used to hide oversized leverage"
    ],
    guardrails: [],
    checklist_score: 41,
    execution_readiness: 44,
    summary: "This looks like a low-discipline entry. Slow down. Rebuild the setup before risking capital.",
    outcome: "Skipped",
    journal_note: "Good block. I was chasing.",
    source: "tradingview-webhook",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  }
];
