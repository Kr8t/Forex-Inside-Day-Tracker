import { Candle, ForexPair, InsideDayType, BreakoutStatus, TradeSetupType } from '../types/forex';

const STORAGE_KEY_PAIRS = 'forex_inside_day_pairs_cache_v5';
const STORAGE_KEY_TIMESTAMP = 'forex_inside_day_last_sync_v5';

export const INITIAL_PAIRS_META = [
  // 1. Pairs Coiling in Inside Day Today (Day 2)
  { id: 'eurusd', symbol: 'EUR/USD', base: 'EUR', quote: 'USD', category: 'major', basePrice: 1.0845, pipSize: 0.0001, isInside: true, insideType: 'green', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'gbpusd', symbol: 'GBP/USD', base: 'GBP', quote: 'USD', category: 'major', basePrice: 1.2980, pipSize: 0.0001, isInside: true, insideType: 'red', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdjpy', symbol: 'USD/JPY', base: 'USD', quote: 'JPY', category: 'major', basePrice: 153.25, pipSize: 0.01, isInside: true, insideType: 'neutral', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdcad', symbol: 'USD/CAD', base: 'USD', quote: 'CAD', category: 'major', basePrice: 1.3892, pipSize: 0.0001, isInside: true, insideType: 'green', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdchf', symbol: 'USD/CHF', base: 'USD', quote: 'CHF', category: 'major', basePrice: 0.8670, pipSize: 0.0001, isInside: true, insideType: 'red', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'eurgbp', symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP', category: 'minor', basePrice: 0.8355, pipSize: 0.0001, isInside: true, insideType: 'green', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'gbpjpy', symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY', category: 'minor', basePrice: 198.90, pipSize: 0.01, isInside: true, insideType: 'red', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'audjpy', symbol: 'AUD/JPY', base: 'AUD', quote: 'JPY', category: 'minor', basePrice: 100.88, pipSize: 0.01, isInside: true, insideType: 'neutral', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'euraud', symbol: 'EUR/AUD', base: 'EUR', quote: 'AUD', category: 'minor', basePrice: 1.6475, pipSize: 0.0001, isInside: true, insideType: 'green', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdmxn', symbol: 'USD/MXN', base: 'USD', quote: 'MXN', category: 'exotic', basePrice: 19.8500, pipSize: 0.0001, isInside: true, insideType: 'red', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdsgd', symbol: 'USD/SGD', base: 'USD', quote: 'SGD', category: 'exotic', basePrice: 1.3210, pipSize: 0.0001, isInside: true, insideType: 'green', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'eurchf', symbol: 'EUR/CHF', base: 'EUR', quote: 'CHF', category: 'minor', basePrice: 0.9405, pipSize: 0.0001, isInside: true, insideType: 'neutral', wasInsideYesterday: false, breakoutAction: 'none' },

  // 2. Breakouts in Play Today: ONLY active because Previous Day WAS an Inside Day
  { id: 'audusd', symbol: 'AUD/USD', base: 'AUD', quote: 'USD', category: 'major', basePrice: 0.6582, pipSize: 0.0001, isInside: false, insideType: 'none', wasInsideYesterday: true, breakoutAction: 'break_high' },
  { id: 'gbpcad', symbol: 'GBP/CAD', base: 'GBP', quote: 'CAD', category: 'minor', basePrice: 1.8030, pipSize: 0.0001, isInside: false, insideType: 'none', wasInsideYesterday: true, breakoutAction: 'break_low' },
  { id: 'eurjpy', symbol: 'EUR/JPY', base: 'EUR', quote: 'JPY', category: 'minor', basePrice: 166.18, pipSize: 0.01, isInside: false, insideType: 'none', wasInsideYesterday: true, breakoutAction: 'trap_high' },

  // 3. Regular Pairs: Previous Day was NOT an Inside Day (Will NOT appear in Breakouts in Play)
  { id: 'nzdusd', symbol: 'NZD/USD', base: 'NZD', quote: 'USD', category: 'major', basePrice: 0.5975, pipSize: 0.0001, isInside: false, insideType: 'none', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'cadjpy', symbol: 'CAD/JPY', base: 'CAD', quote: 'JPY', category: 'minor', basePrice: 110.32, pipSize: 0.01, isInside: false, insideType: 'none', wasInsideYesterday: false, breakoutAction: 'none' },
  { id: 'usdzar', symbol: 'USD/ZAR', base: 'USD', quote: 'ZAR', category: 'exotic', basePrice: 17.6540, pipSize: 0.0001, isInside: false, insideType: 'none', wasInsideYesterday: false, breakoutAction: 'none' },
] as const;

/**
 * Generate historical daily candles for a pair ending with the deliberate mother/inside bar setup
 */
export function generatePairCandles(
  basePrice: number,
  pipSize: number,
  isInside: boolean,
  insideType: InsideDayType,
  wasInsideYesterday: boolean = false,
  breakoutAction: 'break_high' | 'break_low' | 'trap_high' | 'none' = 'none'
): {
  candles: Candle[];
  todayHigh: number;
  todayLow: number;
  todayOpen: number;
  todayClose: number;
  motherHigh: number;
  motherLow: number;
  motherOpen: number;
  motherClose: number;
} {
  const candles: Candle[] = [];
  const days = 60;
  const now = new Date();
  const dailyRangePips = pipSize === 0.01 ? 1.20 : 0.0080;

  let currentLevel = basePrice * 0.96;
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate historical baseline up to Day -3
  for (let i = days; i >= 3; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const r1 = random(basePrice * 100 + i * 3);
    const r2 = random(basePrice * 200 + i * 7);
    const dayDelta = (r1 - 0.49) * dailyRangePips * 0.7;

    const open = currentLevel;
    const close = open + dayDelta;
    const high = Math.max(open, close) + r2 * dailyRangePips * 0.5;
    const low = Math.min(open, close) - (1 - r2) * dailyRangePips * 0.5;
    const volume = Math.floor(40000 + r1 * 90000);

    candles.push({
      timestamp: d.getTime(),
      dateStr,
      open: round(open, pipSize),
      high: round(high, pipSize),
      low: round(low, pipSize),
      close: round(close, pipSize),
      volume,
    });
    currentLevel = close;
  }

  // Day -2 (2 Days Ago)
  const d2DaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const motherRange = dailyRangePips * 1.4;
  const day2Open = currentLevel;
  const day2Close = day2Open + (random(basePrice * 45) > 0.5 ? 1 : -1) * (motherRange * 0.35);
  const day2High = Math.max(day2Open, day2Close) + motherRange * 0.35;
  const day2Low = Math.min(day2Open, day2Close) - motherRange * 0.35;

  candles.push({
    timestamp: d2DaysAgo.getTime(),
    dateStr: d2DaysAgo.toISOString().split('T')[0],
    open: round(day2Open, pipSize),
    high: round(day2High, pipSize),
    low: round(day2Low, pipSize),
    close: round(day2Close, pipSize),
    volume: 110000,
  });

  // Day -1 (Yesterday)
  let yOpen: number;
  let yHigh: number;
  let yLow: number;
  let yClose: number;

  if (wasInsideYesterday) {
    if (breakoutAction === 'break_high') {
      // Day -2 was an Inside Day; on Wednesday 28th Oct (Day -1), AUD/USD closed in breakout (Bullish CIB) above Day -2 High
      const d2Span = day2High - day2Low;
      yOpen = day2Low + d2Span * 0.35;
      yHigh = day2High + dailyRangePips * 0.28;
      yLow = day2Low + d2Span * 0.15;
      yClose = day2High + dailyRangePips * 0.20;
    } else if (breakoutAction === 'break_low') {
      // Day -2 was an Inside Day; on Wednesday 28th Oct (Day -1), GBP/CAD closed in breakout (Bearish CIB) below Day -2 Low
      const d2Span = day2High - day2Low;
      yOpen = day2High - d2Span * 0.35;
      yLow = day2Low - dailyRangePips * 0.28;
      yHigh = day2High - d2Span * 0.15;
      yClose = day2Low - dailyRangePips * 0.20;
    } else {
      // Yesterday was an Inside Day inside Day -2
      const d2Span = day2High - day2Low;
      yHigh = day2High - d2Span * 0.15;
      yLow = day2Low + d2Span * 0.15;
      yOpen = yLow + (yHigh - yLow) * 0.35;
      yClose = yLow + (yHigh - yLow) * 0.65;
    }
  } else {
    // Normal previous day
    yOpen = day2Close;
    yHigh = day2High + (random(basePrice * 17) > 0.5 ? dailyRangePips * 0.15 : -dailyRangePips * 0.1);
    yLow = day2Low - (random(basePrice * 19) > 0.5 ? dailyRangePips * 0.15 : -dailyRangePips * 0.1);
    yClose = (yHigh + yLow) / 2;
  }

  const dYesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  candles.push({
    timestamp: dYesterday.getTime(),
    dateStr: dYesterday.toISOString().split('T')[0],
    open: round(yOpen, pipSize),
    high: round(yHigh, pipSize),
    low: round(yLow, pipSize),
    close: round(yClose, pipSize),
    volume: 125000,
  });

  // Day 0: Today's Bar
  let todayOpen: number;
  let todayHigh: number;
  let todayLow: number;
  let todayClose: number;

  let refHigh = yHigh;
  let refLow = yLow;
  let refOpen = yOpen;
  let refClose = yClose;

  if (isInside) {
    // Compress tightly inside yesterday's bar: high < yHigh AND low > yLow
    const motherHeight = yHigh - yLow;
    const compressionRatio = 0.45 + random(basePrice * 11) * 0.25;
    const innerPadding = (motherHeight * (1 - compressionRatio)) / 2;

    todayHigh = yHigh - innerPadding;
    todayLow = yLow + innerPadding;
    const todayMid = (todayHigh + todayLow) / 2;

    if (insideType === 'green') {
      todayOpen = todayLow + (todayHigh - todayLow) * 0.25;
      todayClose = todayLow + (todayHigh - todayLow) * 0.8;
    } else if (insideType === 'red') {
      todayOpen = todayLow + (todayHigh - todayLow) * 0.75;
      todayClose = todayLow + (todayHigh - todayLow) * 0.25;
    } else {
      todayOpen = todayMid;
      todayClose = todayMid + (pipSize === 0.01 ? 0.01 : 0.0001) * (random(basePrice * 2) > 0.5 ? 1 : -1);
    }
  } else if (wasInsideYesterday) {
    // Today breaks out of Yesterday's Inside Day!
    todayOpen = yClose;
    if (breakoutAction === 'break_high') {
      todayHigh = yHigh + dailyRangePips * 0.35;
      todayClose = yHigh + dailyRangePips * 0.22;
      todayLow = yLow + (yHigh - yLow) * 0.35;
    } else if (breakoutAction === 'break_low') {
      todayLow = yLow - dailyRangePips * 0.35;
      todayClose = yLow - dailyRangePips * 0.22;
      todayHigh = yHigh - (yHigh - yLow) * 0.35;
    } else if (breakoutAction === 'trap_high') {
      todayHigh = yHigh + dailyRangePips * 0.28;
      todayClose = yHigh - dailyRangePips * 0.12;
      todayLow = yLow + (yHigh - yLow) * 0.2;
    } else {
      todayHigh = yHigh + dailyRangePips * 0.2;
      todayLow = yLow - dailyRangePips * 0.1;
      todayClose = todayHigh - dailyRangePips * 0.05;
    }
  } else {
    // Standard bar (not inside today, and yesterday was NOT inside)
    todayOpen = yClose;
    const trendUp = random(basePrice * 88) > 0.5;
    todayHigh = trendUp ? yHigh + dailyRangePips * 0.3 : yHigh - dailyRangePips * 0.1;
    todayLow = !trendUp ? yLow - dailyRangePips * 0.3 : yLow + dailyRangePips * 0.1;
    todayClose = trendUp ? todayHigh - dailyRangePips * 0.1 : todayLow + dailyRangePips * 0.1;
  }

  const todayDateStr = now.toISOString().split('T')[0];
  candles.push({
    timestamp: now.getTime(),
    dateStr: todayDateStr,
    open: round(todayOpen, pipSize),
    high: round(todayHigh, pipSize),
    low: round(todayLow, pipSize),
    close: round(todayClose, pipSize),
    volume: 98000,
  });

  // Annotate CIB (Closed In Breakout: candle closed outside the prior day's High or Low)
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    if (curr.close > prev.high) {
      curr.isCIB = true;
      curr.cibType = 'bullish';
      curr.cibPips = round((curr.close - prev.high) / pipSize, 0.1);
      curr.cibNote = `Bullish CIB: Closed +${curr.cibPips}p above ${prev.dateStr} HOD (${prev.high})`;
    } else if (curr.close < prev.low) {
      curr.isCIB = true;
      curr.cibType = 'bearish';
      curr.cibPips = round((prev.low - curr.close) / pipSize, 0.1);
      curr.cibNote = `Bearish CIB: Closed +${curr.cibPips}p below ${prev.dateStr} LOD (${prev.low})`;
    }
  }

  return {
    candles,
    todayHigh: round(todayHigh, pipSize),
    todayLow: round(todayLow, pipSize),
    todayOpen: round(todayOpen, pipSize),
    todayClose: round(todayClose, pipSize),
    motherHigh: round(refHigh, pipSize),
    motherLow: round(refLow, pipSize),
    motherOpen: round(refOpen, pipSize),
    motherClose: round(refClose, pipSize),
  };
}

/**
 * Determine Next-Day Breakout Setup strictly requiring that yesterday was an Inside Day
 */
export function determineNextDayBreakoutSetup(
  todayHigh: number,
  todayLow: number,
  todayClose: number,
  prevHigh: number,
  prevLow: number,
  pipSize: number,
  isActuallyInside: boolean,
  wasInsideYesterday: boolean
): {
  tradeSetup: TradeSetupType;
  hadInsideDayYesterday: boolean;
  setupHeadline: string;
  setupLevel: number;
  pipsBeyondBreakout: number;
  targetPrice: number;
  invalidationLevel: number;
} {
  const motherRange = Math.max(prevHigh - prevLow, pipSize);
  const pipAlertZone = pipSize === 0.01 ? 15 : 12;

  // STRICT REQUIREMENT: Only evaluate next-day breakout setups if yesterday was an Inside Day
  if (wasInsideYesterday) {
    // 1. Broke above previous Inside Day High (Long Breakout)
    if (todayClose > prevHigh) {
      const pipsBeyond = round((todayClose - prevHigh) / pipSize, 0.1);
      return {
        tradeSetup: 'bullish_breakout_long',
        hadInsideDayYesterday: true,
        setupHeadline: 'Long Breakout: Breached Inside Day High',
        setupLevel: prevHigh,
        pipsBeyondBreakout: pipsBeyond,
        targetPrice: round(prevHigh + motherRange, pipSize),
        invalidationLevel: todayLow,
      };
    }

    // 2. Broke below previous Inside Day Low (Short Breakdown)
    if (todayClose < prevLow) {
      const pipsBeyond = round((prevLow - todayClose) / pipSize, 0.1);
      return {
        tradeSetup: 'bearish_breakout_short',
        hadInsideDayYesterday: true,
        setupHeadline: 'Short Breakdown: Breached Inside Day Low',
        setupLevel: prevLow,
        pipsBeyondBreakout: pipsBeyond,
        targetPrice: round(prevLow - motherRange, pipSize),
        invalidationLevel: todayHigh,
      };
    }

    // 3. False Break Trap at High (Pump & Dump back inside)
    if (todayHigh > prevHigh && todayClose <= prevHigh) {
      const pipsBeyond = round((todayHigh - prevHigh) / pipSize, 0.1);
      return {
        tradeSetup: 'false_break_reversal',
        hadInsideDayYesterday: true,
        setupHeadline: 'Trap Reversal: False Break High',
        setupLevel: prevHigh,
        pipsBeyondBreakout: pipsBeyond,
        targetPrice: round(prevLow, pipSize),
        invalidationLevel: round(todayHigh + pipSize * 5, pipSize),
      };
    }

    // 4. False Break Trap at Low (Dump & Pump back inside)
    if (todayLow < prevLow && todayClose >= prevLow) {
      const pipsBeyond = round((prevLow - todayLow) / pipSize, 0.1);
      return {
        tradeSetup: 'false_break_reversal',
        hadInsideDayYesterday: true,
        setupHeadline: 'Trap Reversal: False Break Low',
        setupLevel: prevLow,
        pipsBeyondBreakout: pipsBeyond,
        targetPrice: round(prevHigh, pipSize),
        invalidationLevel: round(todayLow - pipSize * 5, pipSize),
      };
    }

    // Testing boundary of yesterday's inside day
    const highDiffPips = round((prevHigh - todayClose) / pipSize, 0.1);
    const lowDiffPips = round((todayClose - prevLow) / pipSize, 0.1);

    if (highDiffPips <= pipAlertZone) {
      return {
        tradeSetup: 'imminent_breakout',
        hadInsideDayYesterday: true,
        setupHeadline: 'Testing Inside Day High (<15p)',
        setupLevel: prevHigh,
        pipsBeyondBreakout: 0,
        targetPrice: round(prevHigh + motherRange, pipSize),
        invalidationLevel: prevLow,
      };
    }

    if (lowDiffPips <= pipAlertZone) {
      return {
        tradeSetup: 'imminent_breakout',
        hadInsideDayYesterday: true,
        setupHeadline: 'Testing Inside Day Low (<15p)',
        setupLevel: prevLow,
        pipsBeyondBreakout: 0,
        targetPrice: round(prevLow - motherRange, pipSize),
        invalidationLevel: prevHigh,
      };
    }

    return {
      tradeSetup: 'coiled_inside',
      hadInsideDayYesterday: true,
      setupHeadline: 'Holding Inside Previous Day Range',
      setupLevel: prevHigh,
      pipsBeyondBreakout: 0,
      targetPrice: round(prevHigh + motherRange, pipSize),
      invalidationLevel: prevLow,
    };
  }

  // If yesterday was NOT an Inside Day:
  // Check if today itself is an inside day (coiling for tomorrow)
  if (isActuallyInside) {
    const highDiffPips = round((prevHigh - todayClose) / pipSize, 0.1);
    const lowDiffPips = round((todayClose - prevLow) / pipSize, 0.1);

    if (highDiffPips <= pipAlertZone || lowDiffPips <= pipAlertZone) {
      return {
        tradeSetup: 'imminent_breakout',
        hadInsideDayYesterday: false,
        setupHeadline: 'Inside Day: Testing Boundary (<15p)',
        setupLevel: highDiffPips <= pipAlertZone ? prevHigh : prevLow,
        pipsBeyondBreakout: 0,
        targetPrice: round(prevHigh + motherRange, pipSize),
        invalidationLevel: prevLow,
      };
    }

    return {
      tradeSetup: 'coiled_inside',
      hadInsideDayYesterday: false,
      setupHeadline: 'Coiled Inside: Day 2 Inside Day',
      setupLevel: prevHigh,
      pipsBeyondBreakout: 0,
      targetPrice: round(prevHigh + motherRange, pipSize),
      invalidationLevel: prevLow,
    };
  }

  // Regular pair with neither inside day yesterday nor today
  return {
    tradeSetup: 'none',
    hadInsideDayYesterday: false,
    setupHeadline: 'Normal Day Range',
    setupLevel: prevHigh,
    pipsBeyondBreakout: 0,
    targetPrice: round(todayClose + motherRange, pipSize),
    invalidationLevel: prevLow,
  };
}

export function buildForexPair(meta: (typeof INITIAL_PAIRS_META)[number]): ForexPair {
  const {
    candles,
    todayHigh,
    todayLow,
    todayOpen,
    todayClose,
    motherHigh,
    motherLow,
    motherOpen,
    motherClose,
  } = generatePairCandles(
    meta.basePrice,
    meta.pipSize,
    meta.isInside,
    meta.insideType as InsideDayType,
    meta.wasInsideYesterday,
    meta.breakoutAction
  );

  const isActuallyInside = todayHigh < motherHigh && todayLow > motherLow;
  let insideType: InsideDayType = 'none';

  if (isActuallyInside) {
    const spread = todayHigh - todayLow || meta.pipSize * 10;
    const body = Math.abs(todayClose - todayOpen);
    if (body / spread < 0.12) {
      insideType = 'neutral';
    } else if (todayClose > todayOpen) {
      insideType = 'green';
    } else {
      insideType = 'red';
    }
  }

  const motherRange = Math.max(motherHigh - motherLow, meta.pipSize);
  const todayRange = Math.max(todayHigh - todayLow, meta.pipSize);
  const compressionPercent = round((todayRange / motherRange) * 100, 0.1);

  // Distances to previous day breakout boundaries
  const highDiff = motherHigh - todayClose;
  const lowDiff = todayClose - motherLow;

  const distanceToHighPips = round(highDiff / meta.pipSize, 0.1);
  const distanceToLowPips = round(lowDiff / meta.pipSize, 0.1);
  const distanceToHighPct = round((highDiff / todayClose) * 100, 0.01);
  const distanceToLowPct = round((lowDiff / todayClose) * 100, 0.01);

  // Determine breakout status
  let breakoutStatus: BreakoutStatus = 'none';
  const pipAlertZone = meta.pipSize === 0.01 ? 15 : 12;
  if (todayClose >= motherHigh) {
    breakoutStatus = 'broken_above';
  } else if (todayClose <= motherLow) {
    breakoutStatus = 'broken_below';
  } else if (distanceToHighPips <= pipAlertZone) {
    breakoutStatus = 'near_high';
  } else if (distanceToLowPips <= pipAlertZone) {
    breakoutStatus = 'near_low';
  }

  const prevClose = motherClose;
  const change24h = round(todayClose - prevClose, meta.pipSize);
  const changePercent24h = round(((todayClose - prevClose) / prevClose) * 100, 0.01);

  // Next-Day Breakout Setup calculation strictly honoring wasInsideYesterday
  const setup = determineNextDayBreakoutSetup(
    todayHigh,
    todayLow,
    todayClose,
    motherHigh,
    motherLow,
    meta.pipSize,
    isActuallyInside,
    meta.wasInsideYesterday
  );

  // CIB (Closed In Breakout) analysis: Closed Above Previous Day High OR Below Previous Day Low
  const isClosedAboveMotherHigh = todayClose > motherHigh;
  const isClosedBelowMotherLow = todayClose < motherLow;
  const isCIB = isClosedAboveMotherHigh || isClosedBelowMotherLow;

  let cibDirection: 'bullish' | 'bearish' | 'none' = 'none';
  let cibPips = 0;
  if (isClosedAboveMotherHigh) {
    cibDirection = 'bullish';
    cibPips = round((todayClose - motherHigh) / meta.pipSize, 0.1);
  } else if (isClosedBelowMotherLow) {
    cibDirection = 'bearish';
    cibPips = round((motherLow - todayClose) / meta.pipSize, 0.1);
  }
  const pipsAboveMotherHigh = isClosedAboveMotherHigh ? cibPips : 0;
  const pipsBelowMotherLow = isClosedBelowMotherLow ? cibPips : 0;

  return {
    id: meta.id,
    symbol: meta.symbol,
    base: meta.base,
    quote: meta.quote,
    category: meta.category,
    currentPrice: todayClose,
    previousClose: prevClose,
    change24h,
    changePercent24h,
    pipSize: meta.pipSize,
    todayHigh,
    todayLow,
    todayOpen,
    todayClose,
    motherHigh,
    motherLow,
    motherOpen,
    motherClose,
    isInsideDay: isActuallyInside,
    insideType,
    compressionPercent,
    breakoutStatus,
    distanceToHighPips,
    distanceToLowPips,
    distanceToHighPct,
    distanceToLowPct,
    tradeSetup: setup.tradeSetup,
    hadInsideDayYesterday: setup.hadInsideDayYesterday,
    setupHeadline: setup.setupHeadline,
    setupLevel: setup.setupLevel,
    pipsBeyondBreakout: setup.pipsBeyondBreakout,
    targetPrice: setup.targetPrice,
    invalidationLevel: setup.invalidationLevel,
    isCIB,
    cibDirection,
    cibPips,
    isClosedAboveMotherHigh,
    pipsAboveMotherHigh,
    isClosedBelowMotherLow,
    pipsBelowMotherLow,
    candles,
  };
}

/**
 * Initialize all pairs and check offline cache
 */
export function getInitialForexPairs(): { pairs: ForexPair[]; isFromCache: boolean } {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY_PAIRS);
      if (cached) {
        const parsed = JSON.parse(cached) as ForexPair[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { pairs: parsed, isFromCache: true };
        }
      }
    }
  } catch (err) {
    console.warn('Could not read cached forex pairs:', err);
  }

  const pairs = INITIAL_PAIRS_META.map(buildForexPair);
  savePairsToCache(pairs);
  return { pairs, isFromCache: false };
}

export function savePairsToCache(pairs: ForexPair[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PAIRS, JSON.stringify(pairs));
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
    }
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

/**
 * Utility: simulate live tick updates across pairs
 */
export function updatePairsTick(pairs: ForexPair[]): {
  updatedPairs: ForexPair[];
  triggeredEvents: {
    pair: ForexPair;
    type: 'bullish_breakout' | 'bearish_breakout' | 'imminent_high' | 'imminent_low';
  }[];
} {
  const triggeredEvents: {
    pair: ForexPair;
    type: 'bullish_breakout' | 'bearish_breakout' | 'imminent_high' | 'imminent_low';
  }[] = [];

  const updatedPairs = pairs.map((pair) => {
    // 35% chance to tick this pair
    if (Math.random() > 0.35) return pair;

    const pip = pair.pipSize;
    // Small nudge (-2 to +2 pips)
    const nudgePips = (Math.random() - 0.49) * 2;
    const nudgeAmount = nudgePips * pip;
    const newPrice = round(pair.currentPrice + nudgeAmount, pip);

    const newTodayHigh = Math.max(pair.todayHigh, newPrice);
    const newTodayLow = Math.min(pair.todayLow, newPrice);
    const newTodayClose = newPrice;

    const isActuallyInside = newTodayHigh < pair.motherHigh && newTodayLow > pair.motherLow;
    let insideType: InsideDayType = pair.insideType;

    if (isActuallyInside) {
      const spread = newTodayHigh - newTodayLow || pip * 10;
      const body = Math.abs(newTodayClose - pair.todayOpen);
      if (body / spread < 0.12) {
        insideType = 'neutral';
      } else if (newTodayClose > pair.todayOpen) {
        insideType = 'green';
      } else {
        insideType = 'red';
      }
    } else {
      insideType = 'none';
    }

    const highDiff = pair.motherHigh - newTodayClose;
    const lowDiff = newTodayClose - pair.motherLow;
    const distanceToHighPips = round(highDiff / pip, 0.1);
    const distanceToLowPips = round(lowDiff / pip, 0.1);
    const distanceToHighPct = round((highDiff / newTodayClose) * 100, 0.01);
    const distanceToLowPct = round((lowDiff / newTodayClose) * 100, 0.01);

    const motherRange = Math.max(pair.motherHigh - pair.motherLow, pip);
    const todayRange = Math.max(newTodayHigh - newTodayLow, pip);
    const compressionPercent = round((todayRange / motherRange) * 100, 0.1);

    const pipAlertZone = pip === 0.01 ? 15 : 12;
    let breakoutStatus: BreakoutStatus = 'none';

    if (newTodayClose >= pair.motherHigh) {
      breakoutStatus = 'broken_above';
      if (pair.breakoutStatus !== 'broken_above') {
        triggeredEvents.push({ pair, type: 'bullish_breakout' });
      }
    } else if (newTodayClose <= pair.motherLow) {
      breakoutStatus = 'broken_below';
      if (pair.breakoutStatus !== 'broken_below') {
        triggeredEvents.push({ pair, type: 'bearish_breakout' });
      }
    } else if (distanceToHighPips <= pipAlertZone) {
      breakoutStatus = 'near_high';
      if (pair.breakoutStatus === 'none') {
        triggeredEvents.push({ pair, type: 'imminent_high' });
      }
    } else if (distanceToLowPips <= pipAlertZone) {
      breakoutStatus = 'near_low';
      if (pair.breakoutStatus === 'none') {
        triggeredEvents.push({ pair, type: 'imminent_low' });
      }
    }

    const prevClose = pair.previousClose;
    const change24h = round(newTodayClose - prevClose, pip);
    const changePercent24h = round(((newTodayClose - prevClose) / prevClose) * 100, 0.01);

    // Update last candle
    const updatedCandles = [...pair.candles];
    if (updatedCandles.length > 0) {
      const lastIndex = updatedCandles.length - 1;
      const last = updatedCandles[lastIndex];
      updatedCandles[lastIndex] = {
        ...last,
        high: newTodayHigh,
        low: newTodayLow,
        close: newTodayClose,
        volume: last.volume + Math.floor(Math.random() * 8),
      };
    }

    // Recalculate trade setup strictly preserving wasInsideYesterday
    const nextSetup = determineNextDayBreakoutSetup(
      newTodayHigh,
      newTodayLow,
      newTodayClose,
      pair.motherHigh,
      pair.motherLow,
      pip,
      isActuallyInside,
      pair.hadInsideDayYesterday
    );

    // CIB (Closed In Breakout) analysis: Closed Above Previous Day High OR Below Previous Day Low
    const isClosedAboveMotherHigh = newTodayClose > pair.motherHigh;
    const isClosedBelowMotherLow = newTodayClose < pair.motherLow;
    const isCIB = isClosedAboveMotherHigh || isClosedBelowMotherLow;

    let cibDirection: 'bullish' | 'bearish' | 'none' = 'none';
    let cibPips = 0;
    if (isClosedAboveMotherHigh) {
      cibDirection = 'bullish';
      cibPips = round((newTodayClose - pair.motherHigh) / pip, 0.1);
    } else if (isClosedBelowMotherLow) {
      cibDirection = 'bearish';
      cibPips = round((pair.motherLow - newTodayClose) / pip, 0.1);
    }
    const pipsAboveMotherHigh = isClosedAboveMotherHigh ? cibPips : 0;
    const pipsBelowMotherLow = isClosedBelowMotherLow ? cibPips : 0;

    return {
      ...pair,
      currentPrice: newTodayClose,
      todayHigh: newTodayHigh,
      todayLow: newTodayLow,
      todayClose: newTodayClose,
      isInsideDay: isActuallyInside,
      insideType,
      compressionPercent,
      breakoutStatus,
      distanceToHighPips,
      distanceToLowPips,
      distanceToHighPct,
      distanceToLowPct,
      change24h,
      changePercent24h,
      tradeSetup: nextSetup.tradeSetup,
      hadInsideDayYesterday: nextSetup.hadInsideDayYesterday,
      setupHeadline: nextSetup.setupHeadline,
      setupLevel: nextSetup.setupLevel,
      pipsBeyondBreakout: nextSetup.pipsBeyondBreakout,
      targetPrice: nextSetup.targetPrice,
      invalidationLevel: nextSetup.invalidationLevel,
      isCIB,
      cibDirection,
      cibPips,
      isClosedAboveMotherHigh,
      pipsAboveMotherHigh,
      isClosedBelowMotherLow,
      pipsBelowMotherLow,
      candles: updatedCandles,
    };
  });

  return { updatedPairs, triggeredEvents };
}

/**
 * Update forex pairs with real live spot quotes fetched from open market API
 */
export function applyLiveQuotes(
  pairs: ForexPair[],
  quotes: Record<string, number>
): {
  updatedPairs: ForexPair[];
  updatedCount: number;
} {
  let updatedCount = 0;
  const updatedPairs = pairs.map((pair) => {
    const livePrice = quotes[pair.symbol];
    if (livePrice === undefined || isNaN(livePrice)) {
      return pair;
    }
    updatedCount++;
    const pip = pair.pipSize;
    const newPrice = round(livePrice, pip);
    const newTodayHigh = Math.max(pair.todayHigh, newPrice);
    const newTodayLow = Math.min(pair.todayLow, newPrice);
    const newTodayClose = newPrice;

    const isActuallyInside = newTodayHigh < pair.motherHigh && newTodayLow > pair.motherLow;
    let insideType: InsideDayType = pair.insideType;

    if (isActuallyInside) {
      const spread = newTodayHigh - newTodayLow || pip * 10;
      const body = Math.abs(newTodayClose - pair.todayOpen);
      if (body / spread < 0.12) {
        insideType = 'neutral';
      } else if (newTodayClose > pair.todayOpen) {
        insideType = 'green';
      } else {
        insideType = 'red';
      }
    } else {
      insideType = 'none';
    }

    const highDiff = pair.motherHigh - newTodayClose;
    const lowDiff = newTodayClose - pair.motherLow;
    const distanceToHighPips = round(highDiff / pip, 0.1);
    const distanceToLowPips = round(lowDiff / pip, 0.1);
    const distanceToHighPct = round((highDiff / newTodayClose) * 100, 0.01);
    const distanceToLowPct = round((lowDiff / newTodayClose) * 100, 0.01);

    const motherRange = Math.max(pair.motherHigh - pair.motherLow, pip);
    const todayRange = Math.max(newTodayHigh - newTodayLow, pip);
    const compressionPercent = round((todayRange / motherRange) * 100, 0.1);

    const pipAlertZone = pip === 0.01 ? 15 : 12;
    let breakoutStatus: BreakoutStatus = 'none';

    if (newTodayClose >= pair.motherHigh) {
      breakoutStatus = 'broken_above';
    } else if (newTodayClose <= pair.motherLow) {
      breakoutStatus = 'broken_below';
    } else if (distanceToHighPips <= pipAlertZone) {
      breakoutStatus = 'near_high';
    } else if (distanceToLowPips <= pipAlertZone) {
      breakoutStatus = 'near_low';
    }

    const prevClose = pair.previousClose;
    const change24h = round(newTodayClose - prevClose, pip);
    const changePercent24h = round(((newTodayClose - prevClose) / prevClose) * 100, 0.01);

    const updatedCandles = [...pair.candles];
    if (updatedCandles.length > 0) {
      const lastIndex = updatedCandles.length - 1;
      const last = updatedCandles[lastIndex];
      updatedCandles[lastIndex] = {
        ...last,
        high: newTodayHigh,
        low: newTodayLow,
        close: newTodayClose,
      };
    }

    const nextSetup = determineNextDayBreakoutSetup(
      newTodayHigh,
      newTodayLow,
      newTodayClose,
      pair.motherHigh,
      pair.motherLow,
      pip,
      isActuallyInside,
      pair.hadInsideDayYesterday
    );

    // CIB (Closed In Breakout) analysis: Closed Above Previous Day High OR Below Previous Day Low
    const isClosedAboveMotherHigh = newTodayClose > pair.motherHigh;
    const isClosedBelowMotherLow = newTodayClose < pair.motherLow;
    const isCIB = isClosedAboveMotherHigh || isClosedBelowMotherLow;

    let cibDirection: 'bullish' | 'bearish' | 'none' = 'none';
    let cibPips = 0;
    if (isClosedAboveMotherHigh) {
      cibDirection = 'bullish';
      cibPips = round((newTodayClose - pair.motherHigh) / pip, 0.1);
    } else if (isClosedBelowMotherLow) {
      cibDirection = 'bearish';
      cibPips = round((pair.motherLow - newTodayClose) / pip, 0.1);
    }
    const pipsAboveMotherHigh = isClosedAboveMotherHigh ? cibPips : 0;
    const pipsBelowMotherLow = isClosedBelowMotherLow ? cibPips : 0;

    return {
      ...pair,
      currentPrice: newTodayClose,
      todayHigh: newTodayHigh,
      todayLow: newTodayLow,
      todayClose: newTodayClose,
      isInsideDay: isActuallyInside,
      insideType,
      compressionPercent,
      breakoutStatus,
      distanceToHighPips,
      distanceToLowPips,
      distanceToHighPct,
      distanceToLowPct,
      change24h,
      changePercent24h,
      tradeSetup: nextSetup.tradeSetup,
      hadInsideDayYesterday: nextSetup.hadInsideDayYesterday,
      setupHeadline: nextSetup.setupHeadline,
      setupLevel: nextSetup.setupLevel,
      pipsBeyondBreakout: nextSetup.pipsBeyondBreakout,
      targetPrice: nextSetup.targetPrice,
      invalidationLevel: nextSetup.invalidationLevel,
      isCIB,
      cibDirection,
      cibPips,
      isClosedAboveMotherHigh,
      pipsAboveMotherHigh,
      isClosedBelowMotherLow,
      pipsBelowMotherLow,
      candles: updatedCandles,
    };
  });

  return { updatedPairs, updatedCount };
}

/**
 * Manually force a breakout simulation for demonstration & alerts testing
 */
export function simulatePairBreakout(
  pair: ForexPair,
  direction: 'up' | 'down'
): ForexPair {
  const pip = pair.pipSize;
  const targetPrice =
    direction === 'up'
      ? round(pair.motherHigh + pip * 8, pip)
      : round(pair.motherLow - pip * 8, pip);

  const newTodayHigh = Math.max(pair.todayHigh, targetPrice);
  const newTodayLow = Math.min(pair.todayLow, targetPrice);
  const newTodayClose = targetPrice;

  const highDiff = pair.motherHigh - newTodayClose;
  const lowDiff = newTodayClose - pair.motherLow;
  const distanceToHighPips = round(highDiff / pip, 0.1);
  const distanceToLowPips = round(lowDiff / pip, 0.1);

  const prevClose = pair.previousClose;
  const change24h = round(newTodayClose - prevClose, pip);
  const changePercent24h = round(((newTodayClose - prevClose) / prevClose) * 100, 0.01);

  const updatedCandles = [...pair.candles];
  if (updatedCandles.length > 0) {
    const lastIndex = updatedCandles.length - 1;
    const last = updatedCandles[lastIndex];
    updatedCandles[lastIndex] = {
      ...last,
      high: newTodayHigh,
      low: newTodayLow,
      close: newTodayClose,
      volume: last.volume + 1200,
    };
  }

  const nextSetup = determineNextDayBreakoutSetup(
    newTodayHigh,
    newTodayLow,
    newTodayClose,
    pair.motherHigh,
    pair.motherLow,
    pip,
    false,
    true // When simulating breakout, set hadInsideDayYesterday to true
  );

  const isClosedAboveMotherHigh = newTodayClose > pair.motherHigh;
  const isClosedBelowMotherLow = newTodayClose < pair.motherLow;
  const isCIB = isClosedAboveMotherHigh || isClosedBelowMotherLow;

  let cibDirection: 'bullish' | 'bearish' | 'none' = 'none';
  let cibPips = 0;
  if (isClosedAboveMotherHigh) {
    cibDirection = 'bullish';
    cibPips = round((newTodayClose - pair.motherHigh) / pip, 0.1);
  } else if (isClosedBelowMotherLow) {
    cibDirection = 'bearish';
    cibPips = round((pair.motherLow - newTodayClose) / pip, 0.1);
  }
  const pipsAboveMotherHigh = isClosedAboveMotherHigh ? cibPips : 0;
  const pipsBelowMotherLow = isClosedBelowMotherLow ? cibPips : 0;

  return {
    ...pair,
    currentPrice: newTodayClose,
    todayHigh: newTodayHigh,
    todayLow: newTodayLow,
    todayClose: newTodayClose,
    isInsideDay: false, // Broke out of mother bar!
    insideType: 'none',
    breakoutStatus: direction === 'up' ? 'broken_above' : 'broken_below',
    distanceToHighPips,
    distanceToLowPips,
    change24h,
    changePercent24h,
    tradeSetup: direction === 'up' ? 'bullish_breakout_long' : 'bearish_breakout_short',
    hadInsideDayYesterday: true,
    setupHeadline: direction === 'up' ? 'Long Breakout: Breached Inside Day High' : 'Short Breakdown: Breached Inside Day Low',
    setupLevel: nextSetup.setupLevel,
    pipsBeyondBreakout: nextSetup.pipsBeyondBreakout,
    targetPrice: nextSetup.targetPrice,
    invalidationLevel: nextSetup.invalidationLevel,
    isCIB,
    cibDirection,
    cibPips,
    isClosedAboveMotherHigh,
    pipsAboveMotherHigh,
    isClosedBelowMotherLow,
    pipsBelowMotherLow,
    candles: updatedCandles,
  };
}

/**
 * Technical Indicators calculations: EMA, SMA, Bollinger, RSI, ATR
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let previousEMA: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      previousEMA = sum / period;
      result.push(previousEMA);
    } else {
      const currentEMA: number = (data[i] - (previousEMA ?? 0)) * multiplier + (previousEMA ?? 0);
      previousEMA = currentEMA;
      result.push(currentEMA);
    }
  }
  return result;
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const sma = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const ma = sma[i];
    if (ma === null) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(closes[i - j] - ma, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      upper.push(ma + stdDevMultiplier * stdDev);
      middle.push(ma);
      lower.push(ma - stdDevMultiplier * stdDev);
    }
  }

  return { upper, middle, lower };
}

export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  const initialRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + initialRS));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateATR(candles: Candle[], period = 14): (number | null)[] {
  const atr: (number | null)[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const prevClose = candles[i - 1].close;
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - prevClose),
        Math.abs(candles[i].low - prevClose)
      );
      trueRanges.push(tr);
    }
  }

  const smaTR = calculateSMA(trueRanges, period);
  return smaTR;
}

export function round(value: number, step: number): number {
  const inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}
