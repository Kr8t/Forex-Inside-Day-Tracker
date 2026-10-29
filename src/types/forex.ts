export type InsideDayType = 'green' | 'red' | 'neutral' | 'none';

export type BreakoutStatus = 'none' | 'near_high' | 'near_low' | 'broken_above' | 'broken_below';

export type TradeSetupType =
  | 'bullish_breakout_long' // Broke previous day High following an Inside Day
  | 'bearish_breakout_short' // Broke previous day Low following an Inside Day
  | 'false_break_reversal' // Broke boundary and reversed back inside range
  | 'imminent_breakout' // Inside Day testing boundary within 15 pips
  | 'coiled_inside' // Coiled inside yesterday's range
  | 'none';

export interface Candle {
  timestamp: number;
  dateStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isCIB?: boolean;
  cibType?: 'bullish' | 'bearish';
  cibPips?: number;
  cibNote?: string;
}

export interface ForexPair {
  id: string;
  symbol: string; // e.g. "EUR/USD"
  base: string; // e.g. "EUR"
  quote: string; // e.g. "USD"
  category: 'major' | 'minor' | 'exotic';
  currentPrice: number;
  previousClose: number;
  change24h: number;
  changePercent24h: number;
  pipSize: number; // 0.0001 or 0.01 for JPY
  
  // Today's bar
  todayHigh: number;
  todayLow: number;
  todayOpen: number;
  todayClose: number;

  // Mother bar / Previous Day bar
  motherHigh: number;
  motherLow: number;
  motherOpen: number;
  motherClose: number;

  // Inside day analysis (Today)
  isInsideDay: boolean;
  insideType: InsideDayType; // 'green' (close > open), 'red' (close < open), 'neutral' (doji/flat)
  compressionPercent: number; // (todayRange / motherRange) * 100
  breakoutStatus: BreakoutStatus;
  distanceToHighPips: number;
  distanceToLowPips: number;
  distanceToHighPct: number;
  distanceToLowPct: number;

  // Next-Day Breakout Setup (Only active if yesterday was an Inside Day)
  tradeSetup: TradeSetupType;
  hadInsideDayYesterday: boolean; // Strictly true only if yesterday closed as an Inside Day
  setupHeadline: string; // e.g., "Long Setup: Broke Prev High"
  setupLevel: number; // Previous Day High or Low trigger
  pipsBeyondBreakout: number; // pips past the boundary
  targetPrice: number; // 1x range expansion target
  invalidationLevel: number; // Stop / invalidation boundary

  // CIB (Closed In Breakout) analysis: Closes Above Previous Day High OR Below Previous Day Low
  isCIB: boolean; // true if closed > motherHigh OR closed < motherLow
  cibDirection: 'bullish' | 'bearish' | 'none'; // 'bullish' (close > HOD) or 'bearish' (close < LOD)
  cibPips: number; // pips beyond previous day boundary
  isClosedAboveMotherHigh: boolean; // close > previous day High
  pipsAboveMotherHigh: number; // pips closed above previous day High
  isClosedBelowMotherLow: boolean; // close < previous day Low
  pipsBelowMotherLow: number; // pips closed below previous day Low

  // History for sparkline & indicators
  candles: Candle[];
}

export interface Watchlist {
  id: string;
  name: string;
  pairIds: string[];
  isCustom?: boolean;
}

export interface BreakoutAlert {
  id: string;
  pairId: string;
  symbol: string;
  type: 'bullish_breakout' | 'bearish_breakout' | 'imminent_high' | 'imminent_low' | 'next_day_breakout';
  price: number;
  thresholdPrice: number;
  timestamp: number;
  read: boolean;
  setupNote?: string;
}

export interface TechnicalIndicators {
  showEMA20: boolean;
  showSMA50: boolean;
  showSMA200: boolean;
  showBollinger: boolean;
  showRSI: boolean;
  showATR: boolean;
  showVolume: boolean;
  chartType: 'candle' | 'line';
}

export type Timeframe = '1D' | '4H' | '1H' | '1W';

export type LanguageCode = 'en' | 'es' | 'ja' | 'de' | 'fr' | 'zh' | 'ar';

export interface AlertSettings {
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  imminentPipsThreshold: number; // e.g., 15 pips
  notifyOnInsideDayClose: boolean;
  notifyOnBreakout: boolean;
}
