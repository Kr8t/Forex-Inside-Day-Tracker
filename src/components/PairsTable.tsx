import React, { useState } from 'react';
import {
  Star,
  Search,
  ArrowUpDown,
  LineChart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
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

type SortField = 'symbol' | 'price' | 'change' | 'compression' | 'distance';
type SortOrder = 'asc' | 'desc';

export const PairsTable: React.FC<Props> = ({
  pairs,
  selectedPairId,
  onSelectPair,
  starredPairIds,
  onToggleStar,
  currentLang,
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('compression');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Search filter
  const filtered = pairs.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.symbol.toLowerCase().includes(q) ||
      p.base.toLowerCase().includes(q) ||
      p.quote.toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortField === 'symbol') {
      result = a.symbol.localeCompare(b.symbol);
    } else if (sortField === 'price') {
      result = a.currentPrice - b.currentPrice;
    } else if (sortField === 'change') {
      result = a.changePercent24h - b.changePercent24h;
    } else if (sortField === 'compression') {
      if (a.isInsideDay && !b.isInsideDay) return -1;
      if (!a.isInsideDay && b.isInsideDay) return 1;
      result = a.compressionPercent - b.compressionPercent;
    } else if (sortField === 'distance') {
      const distA = Math.min(a.distanceToHighPips, a.distanceToLowPips);
      const distB = Math.min(b.distanceToHighPips, b.distanceToLowPips);
      result = distA - distB;
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      
      {/* Table Top Controls */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 outline-hidden focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span className="font-bold text-slate-700 dark:text-slate-300">{sorted.length}</span> pairs
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none">
            <tr>
              <th className="py-2.5 px-3 w-8 text-center">★</th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('symbol')}>
                <div className="flex items-center gap-1">
                  <span>{t.pair}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('price')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{t.price}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{t.change24h}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">{t.patternStatus}</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('compression')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{t.compression}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">{t.motherBarRange}</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('distance')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{t.breakoutDistance}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">{t.actions}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {sorted.map((pair) => {
              const isSelected = pair.id === selectedPairId;
              const isStarred = starredPairIds.includes(pair.id);
              const isNearBreakout =
                pair.distanceToHighPips <= 15 || pair.distanceToLowPips <= 15;

              return (
                <tr
                  key={pair.id}
                  onClick={() => onSelectPair(pair.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50/70 dark:bg-sky-950/40'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center" onClick={(e) => { e.stopPropagation(); onToggleStar(pair.id); }}>
                    <button className="text-slate-300 hover:text-amber-400 transition">
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {pair.symbol}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {pair.currentPrice.toFixed(pair.pipSize === 0.01 ? 3 : 5)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                    <span className={pair.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {pair.changePercent24h >= 0 ? '+' : ''}{pair.changePercent24h}%
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    {pair.tradeSetup === 'bullish_breakout_long' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                        🚀 Long Breakout (+{pair.pipsBeyondBreakout}p)
                      </span>
                    ) : pair.tradeSetup === 'bearish_breakout_short' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                        🔻 Short Breakdown (+{pair.pipsBeyondBreakout}p)
                      </span>
                    ) : pair.tradeSetup === 'false_break_reversal' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        ⚡ Trap Reversal
                      </span>
                    ) : pair.isInsideDay ? (
                      <div className="inline-flex items-center gap-1.5 font-semibold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            pair.insideType === 'green'
                              ? 'bg-emerald-500'
                              : pair.insideType === 'red'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={
                            pair.insideType === 'green'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : pair.insideType === 'red'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {pair.insideType === 'green'
                            ? t.bullishGreen
                            : pair.insideType === 'red'
                            ? t.bearishRed
                            : t.neutralDoji}
                        </span>
                      </div>
                    ) : pair.cibDirection === 'bullish' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        🚀 Bullish CIB (+{pair.cibPips}p &gt; HOD)
                      </span>
                    ) : pair.cibDirection === 'bearish' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        🔻 Bearish CIB (+{pair.cibPips}p &lt; LOD)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">{t.regularBar}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                    {pair.compressionPercent}%
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                    <span className="text-emerald-500">{pair.motherHigh.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</span>
                    <span className="mx-1 text-slate-400">/</span>
                    <span className="text-rose-500">{pair.motherLow.toFixed(pair.pipSize === 0.01 ? 2 : 4)}</span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`tabular-nums ${pair.isClosedAboveMotherHigh ? 'text-emerald-500 font-bold' : pair.distanceToHighPips <= 15 ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                        {pair.isClosedAboveMotherHigh ? `+${pair.pipsAboveMotherHigh}p (CIB HOD)` : `+${pair.distanceToHighPips}p`}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className={`tabular-nums ${pair.isClosedBelowMotherLow ? 'text-rose-500 font-bold' : pair.distanceToLowPips <= 15 ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                        {pair.isClosedBelowMotherLow ? `+${pair.pipsBelowMotherLow}p (CIB LOD)` : `-${pair.distanceToLowPips}p`}
                      </span>
                      {isNearBreakout && (
                        <AlertTriangle className="w-3 h-3 text-amber-500 ml-0.5" />
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPair(pair.id);
                      }}
                      className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition inline-flex items-center gap-1"
                    >
                      <LineChart className="w-3 h-3" />
                      <span>Chart</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
