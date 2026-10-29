import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { ForexPair, LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';

interface Props {
  pairs: ForexPair[];
  currentLang: LanguageCode;
  activeFilter: string;
  onSelectFilter: (
    filter:
      | 'all'
      | 'inside_only'
      | 'green'
      | 'red'
      | 'neutral'
      | 'near_breakout'
      | 'top_performers'
      | 'breakout_setups'
      | 'closed_breakout'
  ) => void;
  onSelectPair: (id: string) => void;
}

export const InsideDayHero: React.FC<Props> = ({
  pairs,
  currentLang,
  activeFilter,
  onSelectFilter,
  onSelectPair,
}) => {
  const t = translations[currentLang];

  const insidePairs = pairs.filter((p) => p.isInsideDay);
  const greenPairs = insidePairs.filter((p) => p.insideType === 'green');
  const redPairs = insidePairs.filter((p) => p.insideType === 'red');
  const neutralPairs = insidePairs.filter((p) => p.insideType === 'neutral');

  // Next-Day Breakout Setups (Only active if previous day closed as an Inside Day)
  const breakoutSetups = pairs.filter(
    (p) =>
      p.hadInsideDayYesterday &&
      (p.tradeSetup === 'bullish_breakout_long' ||
        p.tradeSetup === 'bearish_breakout_short' ||
        p.tradeSetup === 'false_break_reversal')
  );

  // CIB (Closed In Breakout: Instrument closed outside previous day's High or Low)
  const cibPairs = pairs.filter((p) => p.isCIB);
  const bullishCIBPairs = pairs.filter((p) => p.cibDirection === 'bullish');
  const bearishCIBPairs = pairs.filter((p) => p.cibDirection === 'bearish');

  return (
    <div className="space-y-4">
      {/* Hero Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Forex Inside Day &amp; Breakout Tracker
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold">
              {insidePairs.length} Coils · {breakoutSetups.length} In Play
            </span>
            <button
              onClick={() =>
                onSelectFilter(
                  activeFilter === 'closed_breakout' ? 'inside_only' : 'closed_breakout'
                )
              }
              title={t.closedInBreakoutDesc}
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition flex items-center gap-1.5 border ${
                activeFilter === 'closed_breakout'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <span>CIB:</span>
              <span className="font-extrabold">{cibPairs.length}</span>
              <span className="text-[10px] opacity-80 font-normal">({bullishCIBPairs.length} &gt; HOD · {bearishCIBPairs.length} &lt; LOD)</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking Inside Day compressions (Green/Red/Neutral), Next-Day Breakouts, and CIB (Closed In Breakout outside Previous Day High/Low, e.g. AUD/USD Wed 28th Oct).
          </p>
        </div>
      </div>

      {/* Main 4 Visual Cards: Green Coil, Red Coil, Neutral Coil, and Next-Day Breakouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. GREEN (Bullish Inside Day Coil) */}
        <div
          onClick={() => onSelectFilter(activeFilter === 'green' ? 'inside_only' : 'green')}
          className={`group cursor-pointer rounded-xl p-3.5 transition-all border ${
            activeFilter === 'green'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{t.bullishGreen}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coiling inside · Close &gt; Open
              </p>
            </div>
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {greenPairs.length}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {greenPairs.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPair(p.id);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* 2. RED (Bearish Inside Day Coil) */}
        <div
          onClick={() => onSelectFilter(activeFilter === 'red' ? 'inside_only' : 'red')}
          className={`group cursor-pointer rounded-xl p-3.5 transition-all border ${
            activeFilter === 'red'
              ? 'bg-rose-500/15 border-rose-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>{t.bearishRed}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coiling inside · Close &lt; Open
              </p>
            </div>
            <span className="font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
              {redPairs.length}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {redPairs.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPair(p.id);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition"
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* 3. NEUTRAL (Doji / Equilibrium Inside Day) */}
        <div
          onClick={() => onSelectFilter(activeFilter === 'neutral' ? 'inside_only' : 'neutral')}
          className={`group cursor-pointer rounded-xl p-3.5 transition-all border ${
            activeFilter === 'neutral'
              ? 'bg-amber-500/15 border-amber-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>{t.neutralDoji}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Equilibrium · Close ≈ Open
              </p>
            </div>
            <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
              {neutralPairs.length}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {neutralPairs.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPair(p.id);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* 4. NEXT-DAY BREAKOUTS IN PLAY (Broke Prev High or Low after Inside Day) */}
        <div
          onClick={() =>
            onSelectFilter(
              activeFilter === 'breakout_setups' ? 'inside_only' : 'breakout_setups'
            )
          }
          className={`group cursor-pointer rounded-xl p-3.5 transition-all border ${
            activeFilter === 'breakout_setups'
              ? 'bg-sky-500/15 border-sky-500 shadow-xs ring-1 ring-sky-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Breakouts In Play</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Previous Day Was Inside Day
              </p>
            </div>
            <span className="font-mono text-2xl font-bold text-sky-600 dark:text-sky-400">
              {breakoutSetups.length}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {breakoutSetups.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPair(p.id);
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition"
              >
                {p.symbol} ({p.tradeSetup === 'bullish_breakout_long' ? '↑' : p.tradeSetup === 'bearish_breakout_short' ? '↓' : '⚡'})
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
