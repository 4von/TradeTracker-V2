import { AssetClass, MonthlyGoals } from '../types.ts';

export const KEY_TRADES = 'ttfx.trades.v2';
export const KEY_SETTINGS = 'ttfx.settings.v2';

export const DEFAULT_LOT_SIZES: Record<string, number> = {
  // Forex Majors & Minors (Standard Lot = 100,000 units)
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,
  USDCHF: 100000,
  AUDUSD: 100000,
  USDCAD: 100000,
  NZDUSD: 100000,
  EURGBP: 100000,
  EURJPY: 100000,
  GBPJPY: 100000,
  AUDJPY: 100000,
  CADJPY: 100000,
  GBPAUD: 100000,
  NZDJPY: 100000,

  // Metals & Commodities
  XAUUSD: 100,    // Gold (1 lot = 100 oz)
  XAGUSD: 5000,   // Silver (1 lot = 5,000 oz)
  WTIUSD: 1000,   // US Crude Oil (1 lot = 1,000 barrels)

  // Major Stock Indices (Contracts)
  US30: 1,        // Dow Jones Industrial
  NAS100: 1,      // Nasdaq 100
  SPX500: 1,      // S&P 500
  GER40: 1,       // DAX 40

  // Cryptocurrencies
  BTCUSD: 1,
  ETHUSD: 1,
  SOLUSD: 1,
  XRPUSD: 1,
  BNBUSD: 1,
  ADAUSD: 1,
  DOGEUSD: 1,
  LTCUSD: 1,
  AVAXUSD: 1,
  LINKUSD: 1,
};

export const ASSET_CLASS: Record<string, AssetClass> = {
  EURUSD: 'forex', GBPUSD: 'forex', USDJPY: 'forex', USDCHF: 'forex',
  AUDUSD: 'forex', USDCAD: 'forex', NZDUSD: 'forex', EURGBP: 'forex',
  EURJPY: 'forex', GBPJPY: 'forex', AUDJPY: 'forex', CADJPY: 'forex',
  GBPAUD: 'forex', NZDJPY: 'forex',
  XAUUSD: 'metal', XAGUSD: 'metal', WTIUSD: 'metal',
  US30: 'index', NAS100: 'index', SPX500: 'index', GER40: 'index',
  BTCUSD: 'crypto', ETHUSD: 'crypto', SOLUSD: 'crypto', XRPUSD: 'crypto',
  BNBUSD: 'crypto', ADAUSD: 'crypto', DOGEUSD: 'crypto', LTCUSD: 'crypto',
  AVAXUSD: 'crypto', LINKUSD: 'crypto',
};

export const PRICE_DECIMALS: Record<string, number> = {
  EURUSD: 5, GBPUSD: 5, USDJPY: 3, USDCHF: 5,
  AUDUSD: 5, USDCAD: 5, NZDUSD: 5, EURGBP: 5,
  EURJPY: 3, GBPJPY: 3, AUDJPY: 3, CADJPY: 3,
  GBPAUD: 5, NZDJPY: 3,
  XAUUSD: 2, XAGUSD: 3, WTIUSD: 2,
  US30: 1, NAS100: 1, SPX500: 1, GER40: 1,
  BTCUSD: 2, ETHUSD: 2, SOLUSD: 2, XRPUSD: 4,
  BNBUSD: 2, ADAUSD: 4, DOGEUSD: 5, LTCUSD: 2,
  AVAXUSD: 2, LINKUSD: 3,
};

export const PIP_SIZES: Record<string, number> = {
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, USDCHF: 0.0001,
  AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001, EURGBP: 0.0001,
  EURJPY: 0.01, GBPJPY: 0.01, AUDJPY: 0.01, CADJPY: 0.01,
  GBPAUD: 0.0001, NZDJPY: 0.01,
  XAUUSD: 0.1, XAGUSD: 0.01, WTIUSD: 0.01,
  US30: 1, NAS100: 1, SPX500: 0.1, GER40: 1,
  BTCUSD: 1, ETHUSD: 0.1, SOLUSD: 0.01, XRPUSD: 0.0001,
  BNBUSD: 0.1, ADAUSD: 0.0001, DOGEUSD: 0.00001, LTCUSD: 0.01,
  AVAXUSD: 0.01, LINKUSD: 0.001,
};

export const STRATEGIES = [
  'Breakout',
  'Trend Continuation',
  'Range Reversal',
  'Supply / Demand',
  'Liquidity Sweep',
  'Order Block (SMC)',
  'Fair Value Gap (FVG)',
  'London Open Breakout',
  'NY Open Scalp',
  'Mean Reversion',
  'Fibonacci Retracement',
  'Momentum Pullback',
  'News Reaction',
  'Swing VWAP',
];

export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', 'Daily', 'Weekly'];

export const SESSIONS = ['Asian', 'London', 'NY Overlap', 'New York', 'Sydney'];

export const EMOTIONS = [
  'Disciplined',
  'Patient',
  'Confident',
  'Anxious',
  'FOMO',
  'Revenge',
  'Overconfident',
  'Hesitant',
  'Chased',
];

export const SUGGESTED_TAGS = [
  'A+ Setup',
  'Followed Plan',
  'FOMO',
  'Revenge Trade',
  'Early Exit',
  'Overleveraged',
  'News Event',
  'Clean R:R',
  'Trailing Stop',
  'Liquidity Run',
  'Top of Range',
  'Key Level Reaction',
];

export const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DEFAULT_MONTHLY_GOALS: MonthlyGoals = {
  targetProfit: 1500,
  targetWinRate: 60,
  targetTrades: 25,
  maxMonthlyLoss: 1000,
};

export const DEFAULT_SETTINGS = {
  accountBalance: 10000,
  currency: 'USD',
  defaultRisk: 1.0,
  maxDailyLoss: 500,
  soundEnabled: true,
  lotSizes: { ...DEFAULT_LOT_SIZES },
  monthlyGoals: { ...DEFAULT_MONTHLY_GOALS },
};
