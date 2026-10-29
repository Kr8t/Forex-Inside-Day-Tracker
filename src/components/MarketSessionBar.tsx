import React, { useState, useEffect } from 'react';
import { WifiOff, Clock, RefreshCw, Radio } from 'lucide-react';
import { LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';

interface Props {
  currentLang: LanguageCode;
  isOnline: boolean;
  isLiveFeedActive?: boolean;
  isSyncingLive?: boolean;
  lastLiveSyncTime?: string | null;
  onSyncLiveRates?: () => void;
}

export const MarketSessionBar: React.FC<Props> = ({
  currentLang,
  isOnline,
  isLiveFeedActive = false,
  isSyncingLive = false,
  lastLiveSyncTime = null,
  onSyncLiveRates,
}) => {
  const t = translations[currentLang];
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 22) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentHourUTC = new Date().getUTCHours();
  const sessions = [
    { code: 'LDN', name: t.sessionLondon, isOpen: currentHourUTC >= 8 && currentHourUTC < 17 },
    { code: 'NYC', name: t.sessionNewYork, isOpen: currentHourUTC >= 13 && currentHourUTC < 22 },
    { code: 'TYO', name: t.sessionTokyo, isOpen: currentHourUTC >= 0 && currentHourUTC < 9 },
    { code: 'SYD', name: t.sessionSydney, isOpen: currentHourUTC >= 22 || currentHourUTC < 7 },
  ];

  return (
    <div className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/40 text-xs">
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold">{t.offlineMode}</span>
            <span>· {t.cachedDataNotice}</span>
          </div>
          <span className="text-[10px] opacity-80 font-mono">OFFLINE CACHED</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{utcTime}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">·</span>

          <div className="flex items-center gap-2.5">
            {sessions.map((s) => (
              <span
                key={s.code}
                title={`${s.name} (${s.isOpen ? t.marketOpen : t.marketClosed})`}
                className="flex items-center gap-1 font-mono cursor-help"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    s.isOpen ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <span
                  className={
                    s.isOpen
                      ? 'text-slate-800 dark:text-slate-200 font-bold'
                      : 'text-slate-400 dark:text-slate-500 font-medium'
                  }
                >
                  {s.code}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Data Source & Live Sync Indicator */}
        <div className="flex items-center gap-2 text-[10px]">
          {isLiveFeedActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE API (open.er-api.com)</span>
              {lastLiveSyncTime && (
                <span className="hidden md:inline text-emerald-600/70 dark:text-emerald-400/70">
                  · {lastLiveSyncTime}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 font-mono">
              <Radio className="w-3 h-3 text-sky-500" />
              <span>SIMULATED TICKS</span>
            </div>
          )}

          {onSyncLiveRates && (
            <button
              onClick={onSyncLiveRates}
              disabled={isSyncingLive || !isOnline}
              title="Sync live real-world exchange rates from open.er-api.com"
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin text-sky-500' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncingLive ? 'Syncing...' : 'Sync Live Rates'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

