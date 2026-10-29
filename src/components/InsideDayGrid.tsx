import React from 'react';
import { LineChart, Star, AlertTriangle, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { ForexPair, LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';

interface Props {
  pairs: ForexPair[];
  selectedPairId: string;
  onSelectPair: (id: string) => void;
  starredPairIds: string[];
  onToggleStar: (pairId: string) => void;
  currentLang: LanguageCode;
}

export const InsideDayGrid: React.FC<Props> = ({
  pairs,
  selectedPairId,
  onSelectPair,
  starredPairIds,
  onToggleStar,
  currentLang,
}) => {
  const t = translations[currentLang];

  if (pairs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-400">
        No pairs match the selected filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pairs.map((pair) => {
        const isSelected = pair.id === selectedPairId;
        const isStarred = starredPairIds.includes(pair.id);
        const isNearBreakout =
          pair.distanceToHighPips <= 15 || pair.distanceToLowPips <= 15;

        // Theme colors based on inside candle closure
        const isGreen = pair.insideType === 'green';
        const isRed = pair.insideType === 'red';
        const isNeutral = pair.insideType === 'neutral';

        const statusLabel = isGreen
          ? t.bullishGreen
          : isRed
          ? t.bearishRed
          : isNeutral
          ? t.neutralDoji
          : t.regularBar;

        const borderAccent = isSelected
          ? 'border-sky-500 ring-1 ring-sky-500'
          : isGreen
          ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
          : isRed
          ? 'border-slate-200 dark:border-slate-800 hover:border-rose-500/50'
          : isNeutral
          ? 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
          : 'border-slate-200 dark:border-slate-800';

        // Range calculation for the visual corridor
        const motherSpan = Math.max(pair.motherHigh - pair.motherLow, pair.pipSize);
        const todayMinPct = Math.max(0, ((pair.todayLow - pair.motherLow) / motherSpan) * 100);
        const todayWidthPct = Math.min(100 - todayMinPct, ((pair.todayHigh - pair.todayLow) / motherSpan) * 100);
        const currentPosPct = Math.min(100, Math.max(0, ((pair.currentPrice - pair.motherLow) / motherSpan) * 100));

        return (
          <div
            key={pair.id}
            onClick={() => onSelectPair(pair.id)}
            className={`cursor-pointer rounded-2xl bg-white dark:bg-slate-900 p-4 transition-all duration-150 shadow-xs flex flex-col justify-between border ${borderAccent}`}
          >
            {/* Top Row: Symbol, Price, Star */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {pair.symbol}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(pair.id);
                      }}
                      className="p-1 text-slate-300 hover:text-amber-400 transition"
                      title="Toggle Watchlist"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                    {pair.category} Forex
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {pair.currentPrice.toFixed(pair.pipSize === 0.01 ? 3 : 5)}
                  </div>
                  <div
                    className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold tabular-nums ${
                      pair.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {pair.change24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{pair.changePercent24h >= 0 ? '+' : ''}{pair.changePercent24h}%</span>
                  </div>
                </div>
              </div>

              {/* Status Badge: Prominent Inside Day or Next-Day Breakout Setup */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      pair.tradeSetup === 'bullish_breakout_long'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-bold'
                        : pair.tradeSetup === 'bearish_breakout_short'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold'
                        : pair.tradeSetup === 'false_break_reversal'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold'
                        : isGreen
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isRed
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : isNeutral
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pair.tradeSetup === 'bullish_breakout_long'
                          ? 'bg-sky-500 animate-pulse'
                          : pair.tradeSetup === 'bearish_breakout_short'
                          ? 'bg-purple-500 animate-pulse'
                          : pair.tradeSetup === 'false_break_reversal'
                          ? 'bg-amber-500 animate-pulse'
                          : isGreen
                          ? 'bg-emerald-500'
                          : isRed
                          ? 'bg-rose-500'
                          : isNeutral
                          ? 'bg-amber-500'
                          : pair.cibDirection === 'bullish'
                          ? 'bg-emerald-500'
                          : pair.cibDirection === 'bearish'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {pair.tradeSetup === 'bullish_breakout_long'
                        ? '🚀 Long Setup (Broke High)'
                        : pair.tradeSetup === 'bearish_breakout_short'
                        ? '🔻 Short Setup (Broke Low)'
                        : pair.tradeSetup === 'false_break_reversal'
                        ? '⚡ Trap Reversal Setup'
                        : pair.cibDirection === 'bullish'
                        ? '🚀 Bullish CIB (Closed > HOD)'
                        : pair.cibDirection === 'bearish'
                        ? '🔻 Bearish CIB (Closed < LOD)'
                        : statusLabel}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {pair.isInsideDay
                      ? `${pair.compressionPercent}% ${t.compression}`
                      : pair.tradeSetup === 'bullish_breakout_long'
                      ? `+${pair.pipsBeyondBreakout}p past High`
                      : pair.tradeSetup === 'bearish_breakout_short'
                      ? `+${pair.pipsBeyondBreakout}p past Low`
                      : pair.cibDirection === 'bullish'
                      ? `+${pair.cibPips}p > Prev HOD`
                      : pair.cibDirection === 'bearish'
                      ? `+${pair.cibPips}p < Prev LOD`
                      : 'Breakout Close'}
                  </span>
                </div>

                {/* Next-Day Breakout Trade Plan details (when breakout triggered or coiled) */}
                {pair.tradeSetup !== 'none' && (
                  <div className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      Target: <strong className="text-emerald-500">{pair.targetPrice.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</strong>
                    </span>
                    <span>
                      Stop: <strong className="text-rose-400">{pair.invalidationLevel.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Mother Bar Corridor Indicator */}
              <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Prev Low: <strong className="text-rose-500">{pair.motherLow.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</strong></span>
                  <span>Prev High: <strong className="text-emerald-500">{pair.motherHigh.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</strong></span>
                </div>

                {/* Range Bar */}
                <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden my-1">
                  {/* Inside Bar Range */}
                  <div
                    className={`absolute h-full rounded-full ${
                      isGreen ? 'bg-emerald-500' : isRed ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{
                      left: `${todayMinPct}%`,
                      width: `${Math.max(4, todayWidthPct)}%`,
                    }}
                  />
                  {/* Current Price Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xs"
                    style={{ left: `${currentPosPct}%` }}
                  />
                </div>

                {/* Distance to boundaries */}
                <div className="flex items-center justify-between text-[10px] font-mono mt-1.5 text-slate-500">
                  <span>{pair.distanceToLowPips > 0 ? `${pair.distanceToLowPips}p to Low` : 'BROKE LOW'}</span>
                  <span>{pair.distanceToHighPips > 0 ? `${pair.distanceToHighPips}p to High` : 'BROKE HIGH'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Imminent Breakout Alert & Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              {pair.tradeSetup === 'bullish_breakout_long' ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Next-Day Long Breakout</span>
                </div>
              ) : pair.tradeSetup === 'bearish_breakout_short' ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Next-Day Short Breakdown</span>
                </div>
              ) : isNearBreakout ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                  <span>{t.imminentBreakout} (&lt;15p)</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">
                  {t.withinRange}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPair(pair.id);
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Chart</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
