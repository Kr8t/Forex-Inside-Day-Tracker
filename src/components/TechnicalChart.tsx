import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  Zap,
  BarChart2,
  Calendar,
  X,
} from 'lucide-react';
import {
  Candle,
  ForexPair,
  LanguageCode,
  TechnicalIndicators,
  Timeframe,
} from '../types/forex';
import { translations } from '../i18n/translations';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateRSI,
  calculateATR,
} from '../services/forexData';

interface Props {
  pair: ForexPair;
  currentLang: LanguageCode;
  onSimulateBreakout: (direction: 'up' | 'down') => void;
  onClose?: () => void;
}

export const TechnicalChart: React.FC<Props> = ({
  pair,
  currentLang,
  onSimulateBreakout,
  onClose,
}) => {
  const t = translations[currentLang];
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const [indicators, setIndicators] = useState<TechnicalIndicators>({
    showEMA20: true,
    showSMA50: true,
    showSMA200: false,
    showBollinger: true,
    showRSI: true,
    showATR: false,
    showVolume: true,
    chartType: 'candle',
  });

  const candles = pair.candles;
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);

  // Indicator series
  const ema20 = useMemo(() => calculateEMA(closes, 20), [closes]);
  const sma50 = useMemo(() => calculateSMA(closes, 50), [closes]);
  const sma200 = useMemo(() => calculateSMA(closes, 200), [closes]);
  const bollinger = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);
  const atr = useMemo(() => calculateATR(candles, 14), [candles]);

  // Chart dimensions & scaling
  const width = 860;
  const mainHeight = 340;
  const rsiHeight = indicators.showRSI ? 100 : 0;
  const totalSvgHeight = mainHeight + rsiHeight + (indicators.showRSI ? 24 : 0);
  const padding = { top: 24, right: 64, bottom: 24, left: 16 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = mainHeight - padding.top - padding.bottom;

  // Compute price min / max
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Math.min(...candles.map((c) => c.low));
    let max = Math.max(...candles.map((c) => c.high));

    if (indicators.showBollinger) {
      bollinger.upper.forEach((val) => {
        if (val !== null && val > max) max = val;
      });
      bollinger.lower.forEach((val) => {
        if (val !== null && val < min) min = val;
      });
    }

    const margin = (max - min) * 0.08 || 0.002;
    return { minPrice: min - margin, maxPrice: max + margin };
  }, [candles, indicators.showBollinger, bollinger]);

  const maxVolume = useMemo(
    () => Math.max(...candles.map((c) => c.volume), 1),
    [candles]
  );

  // Coordinate mappers
  const getX = (index: number) => {
    if (candles.length <= 1) return padding.left;
    return padding.left + (index / (candles.length - 1)) * plotWidth;
  };

  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / (maxPrice - minPrice)) * plotHeight;
  };

  const candleWidth = Math.max(3, Math.min(10, (plotWidth / candles.length) * 0.65));

  // Current hovered or latest candle data
  const activeCandleIndex = hoverIndex !== null ? hoverIndex : candles.length - 1;
  const activeCandle = candles[activeCandleIndex];
  const activeRSI = rsi[activeCandleIndex];
  const activeATR = atr[activeCandleIndex];
  const activeEMA20 = ema20[activeCandleIndex];
  const activeSMA50 = sma50[activeCandleIndex];

  // SVG Paths for indicators
  const buildLinePath = (data: (number | null)[]) => {
    let path = '';
    data.forEach((val, i) => {
      if (val === null) return;
      const x = getX(i);
      const y = getY(val);
      if (!path) path = `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  };

  const ema20Path = useMemo(() => buildLinePath(ema20), [ema20, minPrice, maxPrice]);
  const sma50Path = useMemo(() => buildLinePath(sma50), [sma50, minPrice, maxPrice]);
  const sma200Path = useMemo(() => buildLinePath(sma200), [sma200, minPrice, maxPrice]);
  const bollingerUpperPath = useMemo(() => buildLinePath(bollinger.upper), [bollinger.upper, minPrice, maxPrice]);
  const bollingerLowerPath = useMemo(() => buildLinePath(bollinger.lower), [bollinger.lower, minPrice, maxPrice]);

  // Bollinger Shaded Area
  const bollingerBandArea = useMemo(() => {
    let topPoints: { x: number; y: number }[] = [];
    let bottomPoints: { x: number; y: number }[] = [];
    bollinger.upper.forEach((u, i) => {
      const l = bollinger.lower[i];
      if (u !== null && l !== null) {
        topPoints.push({ x: getX(i), y: getY(u) });
        bottomPoints.push({ x: getX(i), y: getY(l) });
      }
    });
    if (topPoints.length === 0) return '';
    const topStr = topPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const botStr = bottomPoints.reverse().map((p) => `L ${p.x} ${p.y}`).join(' ');
    return `${topStr} ${botStr} Z`;
  }, [bollinger, minPrice, maxPrice]);

  // RSI Line Path
  const rsiPlotY = (val: number) => {
    const top = mainHeight + 24;
    const h = rsiHeight - 16;
    return top + (1 - val / 100) * h;
  };

  const rsiPath = useMemo(() => {
    if (!indicators.showRSI) return '';
    let p = '';
    rsi.forEach((val, i) => {
      if (val === null) return;
      const x = getX(i);
      const y = rsiPlotY(val);
      if (!p) p = `M ${x} ${y}`;
      else p += ` L ${x} ${y}`;
    });
    return p;
  }, [rsi, indicators.showRSI]);

  // Mother Bar boundary levels on chart (Index = candles.length - 2 for mother, length - 1 for inside)
  const motherBarX = getX(candles.length - 2);
  const insideBarX = getX(candles.length - 1);
  const motherHighY = getY(pair.motherHigh);
  const motherLowY = getY(pair.motherLow);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      
      {/* Chart Top Control Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Pair Info & Live Quote */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {pair.symbol}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {pair.currentPrice.toFixed(pair.pipSize === 0.01 ? 3 : 5)}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-mono font-semibold ${
              pair.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            <span>{pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</span>
            <span>({pair.changePercent24h >= 0 ? '+' : ''}{pair.changePercent24h}%)</span>
          </div>

          {/* Inside Day Status Tag */}
          {pair.isInsideDay && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                pair.insideType === 'green'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : pair.insideType === 'red'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pair.insideType === 'green'
                    ? 'bg-emerald-500'
                    : pair.insideType === 'red'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {pair.insideType === 'green'
                  ? t.bullishInside
                  : pair.insideType === 'red'
                  ? t.bearishInside
                  : t.neutralInside}
              </span>
              <span className="font-mono text-[11px] opacity-80">
                ({pair.compressionPercent}% {t.compression})
              </span>
            </div>
          )}

          {/* CIB (Closed in Breakout) Badges */}
          {pair.cibDirection === 'bullish' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bullish CIB (Closed &gt; HOD)</span>
              <span className="font-mono text-[11px] font-bold">
                (+{pair.cibPips}p)
              </span>
            </div>
          )}
          {pair.cibDirection === 'bearish' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Bearish CIB (Closed &lt; LOD)</span>
              <span className="font-mono text-[11px] font-bold">
                (+{pair.cibPips}p)
              </span>
            </div>
          )}
        </div>

        {/* Right: Timeframe, Chart Mode & Breakout Simulation CTA */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Timeframes */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            {(['1D', '4H', '1H', '1W'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Candle vs Line Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, chartType: 'candle' }))}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
                indicators.chartType === 'candle'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, chartType: 'line' }))}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
                indicators.chartType === 'line'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Breakout Simulation Trigger */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => onSimulateBreakout('up')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition whitespace-nowrap shrink-0"
              title="Simulate Bullish Breakout above Mother High"
            >
              <Zap className="w-3 h-3 text-emerald-500" />
              <span>Sim Breakout ↑</span>
            </button>
            <button
              onClick={() => onSimulateBreakout('down')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-lg transition whitespace-nowrap shrink-0"
              title="Simulate Bearish Breakdown below Mother Low"
            >
              <Zap className="w-3 h-3 text-rose-500" />
              <span>Sim Breakout ↓</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0"
              title="Close Chart"
            >
              <X className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Indicator Pill Toggles (Allowed functional button controls per skill) */}
      <div className="px-4 py-2 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>{t.indicators}:</span>
        </span>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showEMA20: !prev.showEMA20 }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showEMA20
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          EMA 20
        </button>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showSMA50: !prev.showSMA50 }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showSMA50
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          SMA 50
        </button>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showSMA200: !prev.showSMA200 }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showSMA200
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          SMA 200
        </button>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showBollinger: !prev.showBollinger }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showBollinger
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          BB (20, 2)
        </button>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showRSI: !prev.showRSI }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showRSI
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          RSI (14)
        </button>

        <button
          onClick={() => setIndicators((prev) => ({ ...prev, showVolume: !prev.showVolume }))}
          className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium transition border ${
            indicators.showVolume
              ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
              : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          {t.volume}
        </button>
      </div>

      {/* Crosshair Metric Inspection Bar */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{activeCandle.dateStr}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>O: <strong className="text-slate-900 dark:text-white tabular-nums">{activeCandle.open.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong></span>
          <span>H: <strong className="text-emerald-500 tabular-nums">{activeCandle.high.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong></span>
          <span>L: <strong className="text-rose-500 tabular-nums">{activeCandle.low.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong></span>
          <span>C: <strong className="text-slate-900 dark:text-white tabular-nums">{activeCandle.close.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong></span>
        </div>

        {indicators.showEMA20 && activeEMA20 && (
          <span className="text-amber-500">
            EMA20: <strong className="tabular-nums">{activeEMA20.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong>
          </span>
        )}

        {indicators.showSMA50 && activeSMA50 && (
          <span className="text-blue-500">
            SMA50: <strong className="tabular-nums">{activeSMA50.toFixed(pair.pipSize === 0.01 ? 3 : 5)}</strong>
          </span>
        )}

        {indicators.showRSI && activeRSI && (
          <span className="text-indigo-400">
            RSI14: <strong className="tabular-nums">{activeRSI.toFixed(1)}</strong>
          </span>
        )}

        {activeATR && (
          <span className="text-slate-400">
            ATR: <strong className="tabular-nums">{(activeATR / pair.pipSize).toFixed(1)} pips</strong>
          </span>
        )}

        {activeCandle.isCIB && (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              activeCandle.cibType === 'bullish'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {activeCandle.cibNote || `${activeCandle.cibType === 'bullish' ? 'Bullish CIB' : 'Bearish CIB'} (+${activeCandle.cibPips}p)`}
          </span>
        )}
      </div>

      {/* Main Interactive SVG Chart Canvas */}
      <div className="relative w-full overflow-x-auto bg-slate-950 select-none">
        <svg
          viewBox={`0 0 ${width} ${totalSvgHeight}`}
          className="w-full h-auto min-w-[700px] cursor-crosshair block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const index = Math.round(((relX - padding.left) / plotWidth) * (candles.length - 1));
            if (index >= 0 && index < candles.length) {
              setHoverIndex(index);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="bollingerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = padding.top + ratio * plotHeight;
            const priceVal = maxPrice - ratio * (maxPrice - minPrice);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 8}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {priceVal.toFixed(pair.pipSize === 0.01 ? 2 : 4)}
                </text>
              </g>
            );
          })}

          {/* Inside Day Mother Bar Highlight Zone */}
          {pair.isInsideDay && (
            <g>
              {/* Shaded enclosing corridor */}
              <rect
                x={motherBarX - candleWidth}
                y={motherHighY}
                width={insideBarX - motherBarX + candleWidth * 2}
                height={Math.max(4, motherLowY - motherHighY)}
                fill="#0284C7"
                fillOpacity="0.09"
                stroke="#0284C7"
                strokeOpacity="0.3"
                strokeWidth="1"
                rx="4"
              />
              
              {/* Mother High / Previous Day HOD Breakout Line */}
              <line
                x1={motherBarX - candleWidth}
                y1={motherHighY}
                x2={width - padding.right}
                y2={motherHighY}
                stroke={pair.isClosedAboveMotherHigh ? '#10B981' : '#38BDF8'}
                strokeDasharray="4 4"
                strokeWidth={pair.isClosedAboveMotherHigh ? '2' : '1.5'}
              />
              <text
                x={width - padding.right + 6}
                y={motherHighY - 3}
                fill={pair.isClosedAboveMotherHigh ? '#10B981' : '#38BDF8'}
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pair.isClosedAboveMotherHigh
                  ? `PREV HOD (CIB BROKE +${pair.pipsAboveMotherHigh}p)`
                  : `PREV HOD ${pair.motherHigh.toFixed(pair.pipSize === 0.01 ? 2 : 4)}`}
              </text>

              {/* Mother Low / Previous Day LOD Breakout Line */}
              <line
                x1={motherBarX - candleWidth}
                y1={motherLowY}
                x2={width - padding.right}
                y2={motherLowY}
                stroke={pair.isClosedBelowMotherLow ? '#F43F5E' : '#EF4444'}
                strokeDasharray="4 4"
                strokeWidth={pair.isClosedBelowMotherLow ? '2' : '1.5'}
              />
              <text
                x={width - padding.right + 6}
                y={motherLowY + 10}
                fill={pair.isClosedBelowMotherLow ? '#F43F5E' : '#EF4444'}
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pair.isClosedBelowMotherLow
                  ? `PREV LOD (CIB BROKE +${pair.pipsBelowMotherLow}p)`
                  : `PREV LOD ${pair.motherLow.toFixed(pair.pipSize === 0.01 ? 2 : 4)}`}
              </text>
            </g>
          )}

          {/* Volume bars (subtle background histogram) */}
          {indicators.showVolume &&
            candles.map((c, i) => {
              const x = getX(i) - candleWidth / 2;
              const barH = (c.volume / maxVolume) * 45;
              const y = mainHeight - padding.bottom - barH;
              const isUp = c.close >= c.open;
              return (
                <rect
                  key={`vol-${c.timestamp}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={barH}
                  fill={isUp ? '#10B981' : '#EF4444'}
                  fillOpacity="0.18"
                />
              );
            })}

          {/* Bollinger Bands Shaded Area & Lines */}
          {indicators.showBollinger && (
            <g>
              <path d={bollingerBandArea} fill="url(#bollingerGrad)" />
              <path d={bollingerUpperPath} stroke="#06B6D4" strokeWidth="1.2" fill="none" opacity="0.6" />
              <path d={bollingerLowerPath} stroke="#06B6D4" strokeWidth="1.2" fill="none" opacity="0.6" />
            </g>
          )}

          {/* Moving Averages */}
          {indicators.showSMA200 && (
            <path d={sma200Path} stroke="#A855F7" strokeWidth="1.5" fill="none" opacity="0.8" />
          )}
          {indicators.showSMA50 && (
            <path d={sma50Path} stroke="#3B82F6" strokeWidth="1.5" fill="none" opacity="0.9" />
          )}
          {indicators.showEMA20 && (
            <path d={ema20Path} stroke="#F59E0B" strokeWidth="1.75" fill="none" />
          )}

          {/* Price Candles or Line */}
          {indicators.chartType === 'line' ? (
            <path
              d={buildLinePath(closes)}
              stroke="#38BDF8"
              strokeWidth="2"
              fill="none"
            />
          ) : (
            candles.map((c, i) => {
              const x = getX(i);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const isUp = c.close >= c.open;
              const isNeutral = Math.abs(c.close - c.open) < (c.high - c.low) * 0.08;
              
              const candleColor = isNeutral ? '#F59E0B' : isUp ? '#10B981' : '#EF4444';
              const topY = Math.min(openY, closeY);
              const bodyH = Math.max(2, Math.abs(closeY - openY));

              // Mark if this is the Mother Bar or Inside Bar
              const isMotherBar = i === candles.length - 2 && pair.isInsideDay;
              const isInsideBar = i === candles.length - 1 && pair.isInsideDay;

              return (
                <g key={c.timestamp}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={topY}
                    width={candleWidth}
                    height={bodyH}
                    fill={candleColor}
                    rx="1"
                  />
                  {/* Visual Marker for Mother Bar */}
                  {isMotherBar && (
                    <text
                      x={x}
                      y={highY - 8}
                      fill="#0284C7"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      MOTHER
                    </text>
                  )}
                  {/* Visual Marker for Inside Bar */}
                  {isInsideBar && (
                    <text
                      x={x}
                      y={highY - 8}
                      fill={candleColor}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      INSIDE
                    </text>
                  )}
                  {/* Visual Marker for CIB (Closed in Breakout) */}
                  {c.isCIB && (
                    <g>
                      <circle
                        cx={x}
                        cy={c.cibType === 'bullish' ? highY - 7 : lowY + 7}
                        r="2.5"
                        fill={c.cibType === 'bullish' ? '#10B981' : '#F43F5E'}
                      />
                      <text
                        x={x}
                        y={c.cibType === 'bullish' ? highY - 13 : lowY + 17}
                        fill={c.cibType === 'bullish' ? '#10B981' : '#F43F5E'}
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        CIB {c.cibType === 'bullish' ? '▲' : '▼'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Interactive Crosshair */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={totalSvgHeight - padding.bottom}
                stroke="#64748B"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal line at close price */}
              <line
                x1={padding.left}
                y1={getY(activeCandle.close)}
                x2={width - padding.right}
                y2={getY(activeCandle.close)}
                stroke="#64748B"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          )}

          {/* RSI Pane Divider & Sub-Chart */}
          {indicators.showRSI && (
            <g>
              <line
                x1={padding.left}
                y1={mainHeight + 10}
                x2={width - padding.right}
                y2={mainHeight + 10}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={padding.left}
                y={mainHeight + 22}
                fill="#94A3B8"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                RSI (14)
              </text>

              {/* 70 Overbought level */}
              <line
                x1={padding.left}
                y1={rsiPlotY(70)}
                x2={width - padding.right}
                y2={rsiPlotY(70)}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={width - padding.right + 6}
                y={rsiPlotY(70) + 3}
                fill="#EF4444"
                fontSize="8"
                fontFamily="monospace"
              >
                70
              </text>

              {/* 30 Oversold level */}
              <line
                x1={padding.left}
                y1={rsiPlotY(30)}
                x2={width - padding.right}
                y2={rsiPlotY(30)}
                stroke="#10B981"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={width - padding.right + 6}
                y={rsiPlotY(30) + 3}
                fill="#10B981"
                fontSize="8"
                fontFamily="monospace"
              >
                30
              </text>

              {/* RSI Curve */}
              <path d={rsiPath} stroke="#818CF8" strokeWidth="1.5" fill="none" />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Strategic Summary strip for the selected pair */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 text-[11px] block">{t.motherBarRange}</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {pair.motherLow.toFixed(pair.pipSize === 0.01 ? 2 : 4)} - {pair.motherHigh.toFixed(pair.pipSize === 0.01 ? 2 : 4)}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-[11px] block">
            {pair.isInsideDay ? t.compression : 'Breakout Status'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {pair.isInsideDay ? `${pair.compressionPercent}%` : pair.breakoutStatus}
            </span>
            {pair.isInsideDay && (
              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${Math.min(100, pair.compressionPercent)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <span className="text-slate-500 text-[11px] block">Measured Target (1x)</span>
          <span className="font-mono font-bold text-emerald-500">
            {pair.targetPrice ? pair.targetPrice.toFixed(pair.pipSize === 0.01 ? 2 : 4) : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-[11px] block">Stop Invalidation</span>
          <span className="font-mono font-bold text-rose-400">
            {pair.invalidationLevel ? pair.invalidationLevel.toFixed(pair.pipSize === 0.01 ? 2 : 4) : 'N/A'}
          </span>
        </div>
      </div>

    </div>
  );
};
