export type AssetClass = 'forex' | 'metal' | 'crypto' | 'index';

export type TradeDirection = 'Long' | 'Short';

export interface TradeChecklist {
  biasConfirmed?: boolean;
  keyLevelSwept?: boolean;
  riskWithinLimit?: boolean;
  validRiskReward?: boolean;
  noHighImpactNews?: boolean;
}

export interface TradeAiAudit {
  executionGrade: string;
  riskScore: number;
  adherenceScore: number;
  pros: string[];
  cons: string[];
  tacticalTip: string;
}

export interface Trade {
  id: string;
  datetime: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  entry: number;
  exit?: number | null;
  lots: number;
  lotMultiplier: number;
  stopLoss?: number | null;
  target?: number | null;
  commission: number;
  swap: number;
  session: string;
  strategy: string;
  timeframe: string;
  emotion: string;
  confidence: number;
  rating?: number; // 1 to 5 stars setup quality rating
  tags: string[];
  notes: string;
  pnl?: number;
  rMultiple?: number | null;
  screenshotUrl?: string;
  chartImage?: string;
  checklist?: TradeChecklist;
  aiAudit?: TradeAiAudit;
}

export interface MonthlyGoals {
  targetProfit: number;
  targetWinRate: number;
  targetTrades?: number;
  maxMonthlyLoss?: number;
  monthOverrides?: Record<string, {
    targetProfit?: number;
    targetWinRate?: number;
    targetTrades?: number;
  }>;
}

export interface Settings {
  currency: string;
  accountBalance: number;
  defaultRisk: number;
  maxDailyLoss: number;
  soundEnabled: boolean;
  lotSizes: Record<string, number>;
  monthlyGoals?: MonthlyGoals;
}

export interface EquityPoint {
  x: string;
  y: number;
  tradeIndex: number;
  pnl: number;
  r: number | null;
  peak: number;
  drawdown: number;
  drawdownPct: number;
}

export interface Stats {
  sorted: Trade[];
  n: number;
  total: number;
  totalGross: number;
  totalCosts: number;
  wins: Trade[];
  losses: Trade[];
  breakevens: Trade[];
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  rr: number;
  equity: EquityPoint[];
  maxDD: number;
  maxDDPct: number;
  currentDD: number;
  currentDDPct: number;
  recoveryFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  sqn: number;
  sqnRating: string;
  kellyCriterion: number;
  totalLots: number;
  avgLots: number;
  best: Trade | null;
  worst: Trade | null;
  curStreak: number;
  curIsWin: boolean | null;
  maxWinStreak: number;
  maxLossStreak: number;
  rMults: number[];
  avgR: number;
  totalR: number;
  longStats: { count: number; pnl: number; win: number };
  shortStats: { count: number; pnl: number; win: number };
  totalPct: number;
}

export interface MonteCarloResult {
  percentile5: number[];
  percentile50: number[];
  percentile95: number[];
  allPaths: number[][];
  probDrawdown10: number;
  probDrawdown20: number;
  probDoubling: number;
  medianFinal: number;
}
