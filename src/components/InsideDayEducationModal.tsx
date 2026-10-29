import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, ShieldCheck, Zap } from 'lucide-react';
import { LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
}

export const InsideDayEducationModal: React.FC<Props> = ({ isOpen, onClose, currentLang }) => {
  if (!isOpen) return null;
  const t = translations[currentLang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {t.strategyTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.strategySummary}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Diagram */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-around gap-6">
          
          {/* Mother Bar + Green Inside Day Diagram */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
              {t.bullishInside}
            </span>
            <svg className="w-28 h-36" viewBox="0 0 120 160">
              {/* Mother Bar High / Low Boundary lines */}
              <line x1="15" y1="20" x2="105" y2="20" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
              <text x="108" y="24" fontSize="8" fill="#0284C7" fontFamily="monospace">HIGH</text>
              <line x1="15" y1="140" x2="105" y2="140" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
              <text x="108" y="144" fontSize="8" fill="#0284C7" fontFamily="monospace">LOW</text>

              {/* Mother Bar (Day 1) */}
              <line x1="40" y1="20" x2="40" y2="140" stroke="#0284C7" strokeWidth="2.5" />
              <rect x="30" y="45" width="20" height="70" fill="#0284C7" rx="2" />
              <text x="24" y="154" fontSize="8" fill="#64748B" fontWeight="600">Day 1 (Mother)</text>

              {/* Inside Bar (Day 2 - Green) */}
              <line x1="80" y1="45" x2="80" y2="115" stroke="#10B981" strokeWidth="2.5" />
              <rect x="70" y="55" width="20" height="50" fill="#10B981" rx="2" />
              <text x="64" y="154" fontSize="8" fill="#10B981" fontWeight="600">Day 2 (Inside)</text>
            </svg>
            <span className="text-[10px] text-slate-500 font-mono mt-1">High &lt; Mother High</span>
          </div>

          {/* Mother Bar + Red Inside Day Diagram */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-2">
              {t.bearishInside}
            </span>
            <svg className="w-28 h-36" viewBox="0 0 120 160">
              <line x1="15" y1="20" x2="105" y2="20" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
              <line x1="15" y1="140" x2="105" y2="140" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />

              {/* Mother Bar */}
              <line x1="40" y1="20" x2="40" y2="140" stroke="#0284C7" strokeWidth="2.5" />
              <rect x="30" y="45" width="20" height="70" fill="#0284C7" rx="2" />
              <text x="24" y="154" fontSize="8" fill="#64748B" fontWeight="600">Day 1 (Mother)</text>

              {/* Inside Bar (Day 2 - Red) */}
              <line x1="80" y1="45" x2="80" y2="115" stroke="#EF4444" strokeWidth="2.5" />
              <rect x="70" y="55" width="20" height="50" fill="#EF4444" rx="2" />
              <text x="64" y="154" fontSize="8" fill="#EF4444" fontWeight="600">Day 2 (Inside)</text>
            </svg>
            <span className="text-[10px] text-slate-500 font-mono mt-1">Low &gt; Mother Low</span>
          </div>

          {/* Mother Bar + Neutral (Doji) Inside Day */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-2">
              {t.neutralInside}
            </span>
            <svg className="w-28 h-36" viewBox="0 0 120 160">
              <line x1="15" y1="20" x2="105" y2="20" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />
              <line x1="15" y1="140" x2="105" y2="140" stroke="#0284C7" strokeDasharray="3 3" strokeWidth="1.5" />

              {/* Mother Bar */}
              <line x1="40" y1="20" x2="40" y2="140" stroke="#0284C7" strokeWidth="2.5" />
              <rect x="30" y="45" width="20" height="70" fill="#0284C7" rx="2" />
              <text x="24" y="154" fontSize="8" fill="#64748B" fontWeight="600">Day 1 (Mother)</text>

              {/* Inside Bar (Day 2 - Doji) */}
              <line x1="80" y1="45" x2="80" y2="115" stroke="#F59E0B" strokeWidth="2.5" />
              <line x1="70" y1="80" x2="90" y2="80" stroke="#F59E0B" strokeWidth="4" />
              <text x="64" y="154" fontSize="8" fill="#F59E0B" fontWeight="600">Day 2 (Doji)</text>
            </svg>
            <span className="text-[10px] text-slate-500 font-mono mt-1">Close ≈ Open</span>
          </div>

        </div>

        {/* 3 Strategic Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-1.5">
              <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>{t.rule1Title}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.rule1Desc}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-1.5">
              <div className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Zap className="w-4 h-4" />
              </div>
              <span>{t.rule2Title}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.rule2Desc}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-1.5">
              <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>{t.rule3Title}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.rule3Desc}
            </p>
          </div>

        </div>

        {/* Next-Day Breakout Playbook Banner */}
        <div className="mt-5 p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20 text-xs">
          <div className="flex items-center gap-2 font-bold text-sky-700 dark:text-sky-300 mb-1">
            <Zap className="w-4 h-4 text-sky-500" />
            <span>Next-Day Breakout Playbook (Day After Inside Day)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            When a currency pair forms an Inside Day, it coils market liquidity into a compressed volatility band. On the following day, watch for two high-probability setups when the previous day&apos;s High or Low is breached:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sky-600 dark:text-sky-400 block mb-0.5">
                1. Trend Breakout Continuation
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Clean break above Previous High (Long) or below Previous Low (Short) with volume during London/NY open. Enter on 15m/5m retest targeting 1x-2x range expansion.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                2. False Break Trap Reversal
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Market pokes through previous High/Low to trigger stops and liquidity, fails to follow through, and aggressively closes back inside the range. Counter-trend trade back to opposite boundary.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
          >
            {t.closeWindow}
          </button>
        </div>

      </div>
    </div>
  );
};
