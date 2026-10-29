import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MarketSessionBar } from './components/MarketSessionBar';
import { InsideDayHero } from './components/InsideDayHero';
import { WatchlistManager } from './components/WatchlistManager';
import { InsideDayGrid } from './components/InsideDayGrid';
import { PairsTable } from './components/PairsTable';
import { TechnicalChart } from './components/TechnicalChart';
import { InsideDayEducationModal } from './components/InsideDayEducationModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  ForexPair,
  Watchlist,
  BreakoutAlert,
  LanguageCode,
} from './types/forex';
import {
  getInitialForexPairs,
  savePairsToCache,
  updatePairsTick,
  simulatePairBreakout,
  applyLiveQuotes,
} from './services/forexData';
import { fetchLiveExchangeRates } from './services/liveForexApi';
import {
  getStoredAlerts,
  saveStoredAlerts,
  sendPushAlert,
  playAlertChime,
} from './services/notificationService';

const STORAGE_KEY_WATCHLISTS = 'forex_inside_day_watchlists_v1';
const STORAGE_KEY_STARRED = 'forex_inside_day_starred_v1';
const STORAGE_KEY_THEME = 'forex_inside_day_theme_v1';
const STORAGE_KEY_LANG = 'forex_inside_day_lang_v1';
const STORAGE_KEY_VIEWMODE = 'forex_inside_day_viewmode_v1';

export default function App() {
  const isOnline = useOnlineStatus();

  // Language state
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved && ['en', 'es', 'ja', 'de', 'fr', 'zh', 'ar'].includes(saved)) {
        return saved as LanguageCode;
      }
    } catch (e) {
      console.warn(e);
    }
    return 'en';
  });

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch (e) {
      console.warn(e);
    }
  };

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved !== null) return saved === 'dark';
    } catch (e) {
      console.warn(e);
    }
    return true; // Default to dark mode for clean financial UI
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn(e);
    }
  }, [isDarkMode]);

  // View Mode: Cards vs Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEWMODE);
      if (saved === 'cards' || saved === 'table') return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'cards';
  });

  const handleToggleViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY_VIEWMODE, mode);
    } catch (e) {
      console.warn(e);
    }
  };

  // Forex Pairs data
  const [pairs, setPairs] = useState<ForexPair[]>(() => {
    const { pairs } = getInitialForexPairs();
    return pairs;
  });

  const [selectedPairId, setSelectedPairId] = useState<string>('eurusd');
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // Watchlists state
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLISTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'all_market',
        name: 'All Forex',
        pairIds: [
          'eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'usdchf', 'nzdusd',
          'eurgbp', 'eurjpy', 'gbpjpy', 'audjpy', 'cadjpy', 'euraud', 'gbpcad',
          'usdmxn', 'usdzar', 'usdsgd', 'eurchf',
        ],
      },
      {
        id: 'core',
        name: 'Majors Only',
        pairIds: ['eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'usdchf', 'nzdusd'],
        isCustom: true,
      },
      {
        id: 'crosses',
        name: 'Yen & European Crosses',
        pairIds: ['eurjpy', 'gbpjpy', 'audjpy', 'cadjpy', 'eurgbp', 'euraud'],
        isCustom: true,
      },
    ];
  });

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('all_market');

  // Starred pairs
  const [starredPairIds, setStarredPairIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STARRED);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return ['eurusd', 'usdjpy', 'gbpusd', 'usdcad'];
  });

  // Default filter: 'inside_only' so the main focus is immediately on Inside Day closures!
  const [activeFilter, setActiveFilter] = useState<
    | 'all'
    | 'inside_only'
    | 'green'
    | 'red'
    | 'neutral'
    | 'near_breakout'
    | 'top_performers'
    | 'breakout_setups'
    | 'closed_breakout'
  >('inside_only');

  // Alerts state
  const [alerts, setAlerts] = useState<BreakoutAlert[]>(() => getStoredAlerts());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals state
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  // Save state helpers
  const handleToggleStar = (pairId: string) => {
    setStarredPairIds((prev) => {
      const next = prev.includes(pairId) ? prev.filter((id) => id !== pairId) : [...prev, pairId];
      try {
        localStorage.setItem(STORAGE_KEY_STARRED, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const handleCreateWatchlist = (name: string, pairIds: string[]) => {
    const newWl: Watchlist = {
      id: 'wl_' + Date.now(),
      name,
      pairIds,
      isCustom: true,
    };
    const next = [...watchlists, newWl];
    setWatchlists(next);
    setActiveWatchlistId(newWl.id);
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLISTS, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateWatchlist = (id: string, name: string, pairIds: string[]) => {
    const next = watchlists.map((wl) => (wl.id === id ? { ...wl, name, pairIds } : wl));
    setWatchlists(next);
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLISTS, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteWatchlist = (id: string) => {
    const next = watchlists.filter((wl) => wl.id !== id);
    setWatchlists(next);
    if (activeWatchlistId === id) {
      setActiveWatchlistId('all_market');
    }
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLISTS, JSON.stringify(next));
    } catch (e) {
      console.warn(e);
    }
  };

  // Live data feed state
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(false);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string | null>(null);

  const handleSyncLiveRates = useCallback(async () => {
    if (isSyncingLive || !isOnline) return;
    setIsSyncingLive(true);
    try {
      const res = await fetchLiveExchangeRates();
      if (res.success && Object.keys(res.quotes).length > 0) {
        setPairs((prev) => {
          const { updatedPairs } = applyLiveQuotes(prev, res.quotes);
          savePairsToCache(updatedPairs);
          return updatedPairs;
        });
        setIsLiveFeedActive(true);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastLiveSyncTime(timeStr);
      }
    } catch (err) {
      console.warn('Failed to sync live rates:', err);
    } finally {
      setIsSyncingLive(false);
    }
  }, [isSyncingLive, isOnline]);

  // Open pair chart
  const handleSelectPairAndOpenChart = (id: string) => {
    setSelectedPairId(id);
    setIsChartModalOpen(true);
  };

  // Real-time market tick simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setPairs((prevPairs) => {
        const { updatedPairs, triggeredEvents } = updatePairsTick(prevPairs);

        // Process any triggered events
        if (triggeredEvents.length > 0) {
          const newAlerts: BreakoutAlert[] = triggeredEvents.map((evt) => {
            const isHigh = evt.type === 'bullish_breakout' || evt.type === 'imminent_high';
            const threshold = isHigh ? evt.pair.motherHigh : evt.pair.motherLow;
            return {
              id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
              pairId: evt.pair.id,
              symbol: evt.pair.symbol,
              type: evt.type,
              price: evt.pair.currentPrice,
              thresholdPrice: threshold,
              timestamp: Date.now(),
              read: false,
            };
          });

          setAlerts((prevAlerts) => {
            const merged = [...newAlerts, ...prevAlerts].slice(0, 50);
            saveStoredAlerts(merged);
            return merged;
          });

          // Dispatch Web Push Notification and Sound
          const first = triggeredEvents[0];
          const isBreakout =
            first.type === 'bullish_breakout' || first.type === 'bearish_breakout';
          const title = isBreakout
            ? `🚨 ${first.pair.symbol} BREAKOUT!`
            : `⚠️ ${first.pair.symbol} Near Breakout`;
          const body = isBreakout
            ? `${first.pair.symbol} just broke outside the mother bar at ${first.pair.currentPrice}`
            : `${first.pair.symbol} is within ${Math.min(
                first.pair.distanceToHighPips,
                first.pair.distanceToLowPips
              )} pips of mother bar boundary.`;

          sendPushAlert(title, body, first.pair.symbol);
          if (soundEnabled) {
            playAlertChime();
          }
        }

        savePairsToCache(updatedPairs);
        return updatedPairs;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Simulate breakout manually
  const handleSimulateBreakout = useCallback(
    (direction: 'up' | 'down') => {
      setPairs((prev) => {
        const target = prev.find((p) => p.id === selectedPairId);
        if (!target) return prev;

        const updatedPair = simulatePairBreakout(target, direction);
        const next = prev.map((p) => (p.id === target.id ? updatedPair : p));

        // Create alert
        const isBullish = direction === 'up';
        const newAlert: BreakoutAlert = {
          id: 'alert_sim_' + Date.now(),
          pairId: updatedPair.id,
          symbol: updatedPair.symbol,
          type: isBullish ? 'bullish_breakout' : 'bearish_breakout',
          price: updatedPair.currentPrice,
          thresholdPrice: isBullish ? updatedPair.motherHigh : updatedPair.motherLow,
          timestamp: Date.now(),
          read: false,
        };

        setAlerts((prevA) => {
          const merged = [newAlert, ...prevA].slice(0, 50);
          saveStoredAlerts(merged);
          return merged;
        });

        // Trigger push notification & sound
        sendPushAlert(
          `🚨 ${updatedPair.symbol} BREAKOUT!`,
          `Price moved to ${updatedPair.currentPrice}, breaking ${
            isBullish ? 'above Mother High' : 'below Mother Low'
          }!`,
          updatedPair.symbol
        );
        if (soundEnabled) {
          playAlertChime();
        }

        savePairsToCache(next);
        return next;
      });
    },
    [selectedPairId, soundEnabled]
  );

  // Filter pairs based on active watchlist & active filter
  const displayedPairs = useMemo(() => {
    let result = [...pairs];

    // Filter by Watchlist
    const activeWl = watchlists.find((w) => w.id === activeWatchlistId);
    if (activeWl) {
      result = result.filter((p) => activeWl.pairIds.includes(p.id));
    }

    // Filter by Pattern / Status
    if (activeFilter === 'inside_only') {
      result = result.filter((p) => p.isInsideDay);
    } else if (activeFilter === 'green') {
      result = result.filter((p) => p.isInsideDay && p.insideType === 'green');
    } else if (activeFilter === 'red') {
      result = result.filter((p) => p.isInsideDay && p.insideType === 'red');
    } else if (activeFilter === 'neutral') {
      result = result.filter((p) => p.isInsideDay && p.insideType === 'neutral');
    } else if (activeFilter === 'near_breakout') {
      result = result.filter(
        (p) => p.distanceToHighPips <= 15 || p.distanceToLowPips <= 15
      );
    } else if (activeFilter === 'breakout_setups') {
      result = result.filter(
        (p) =>
          p.hadInsideDayYesterday &&
          (p.tradeSetup === 'bullish_breakout_long' ||
            p.tradeSetup === 'bearish_breakout_short' ||
            p.tradeSetup === 'false_break_reversal')
      );
    } else if (activeFilter === 'top_performers') {
      result = result.filter(
        (p) => starredPairIds.includes(p.id) || Math.abs(p.changePercent24h) >= 0.35
      );
    } else if (activeFilter === 'closed_breakout') {
      result = result.filter((p) => p.isCIB);
    }

    return result;
  }, [pairs, activeWatchlistId, watchlists, activeFilter, starredPairIds]);

  // Aggregate stats
  const stats = useMemo(() => {
    let insideCount = 0;
    let greenCount = 0;
    let redCount = 0;
    let neutralCount = 0;
    let nearBreakoutCount = 0;
    let breakoutSetupsCount = 0;
    let closedBreakoutCount = 0;

    pairs.forEach((p) => {
      if (p.isInsideDay) {
        insideCount++;
        if (p.insideType === 'green') greenCount++;
        else if (p.insideType === 'red') redCount++;
        else if (p.insideType === 'neutral') neutralCount++;
      }
      if (p.distanceToHighPips <= 15 || p.distanceToLowPips <= 15) {
        nearBreakoutCount++;
      }
      if (
        p.hadInsideDayYesterday &&
        (p.tradeSetup === 'bullish_breakout_long' ||
          p.tradeSetup === 'bearish_breakout_short' ||
          p.tradeSetup === 'false_break_reversal')
      ) {
        breakoutSetupsCount++;
      }
      if (p.isCIB) {
        closedBreakoutCount++;
      }
    });

    return {
      insideCount,
      greenCount,
      redCount,
      neutralCount,
      nearBreakoutCount,
      breakoutSetupsCount,
      closedBreakoutCount,
    };
  }, [pairs]);

  const selectedPair = useMemo(
    () => pairs.find((p) => p.id === selectedPairId) || pairs[0],
    [pairs, selectedPairId]
  );

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
        currentLang === 'ar' ? 'font-sans' : ''
      }`}
      dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Streamlined Top Navigation Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        unreadAlertCount={alerts.filter((a) => !a.read).length}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onOpenStrategy={() => setIsStrategyModalOpen(true)}
        onOpenSettings={() => setIsAlertsModalOpen(true)}
      />

      {/* Quiet Single-Line Status Strip */}
      <MarketSessionBar
        currentLang={currentLang}
        isOnline={isOnline}
        isLiveFeedActive={isLiveFeedActive}
        isSyncingLive={isSyncingLive}
        lastLiveSyncTime={lastLiveSyncTime}
        onSyncLiveRates={handleSyncLiveRates}
      />

      {/* Main Workspace Canvas: Laser-focused on Inside Day Pairs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Main Focus: Inside Day Pulse Banner & Breakouts in Play */}
        <InsideDayHero
          pairs={pairs}
          currentLang={currentLang}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onSelectPair={handleSelectPairAndOpenChart}
        />

        {/* Streamlined Filter & View Controls */}
        <WatchlistManager
          currentLang={currentLang}
          pairs={pairs}
          watchlists={watchlists}
          activeWatchlistId={activeWatchlistId}
          onSelectWatchlist={setActiveWatchlistId}
          onCreateWatchlist={handleCreateWatchlist}
          onUpdateWatchlist={handleUpdateWatchlist}
          onDeleteWatchlist={handleDeleteWatchlist}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          insideCounts={{
            total: stats.insideCount,
            green: stats.greenCount,
            red: stats.redCount,
            neutral: stats.neutralCount,
            nearBreakout: stats.nearBreakoutCount,
          }}
          breakoutSetupsCount={stats.breakoutSetupsCount}
          closedBreakoutCount={stats.closedBreakoutCount}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />

        {/* Pairs Display: Clean Cards View OR Compact Table View */}
        <section id="scanner" aria-label="Inside Day Pairs">
          {viewMode === 'cards' ? (
            <InsideDayGrid
              pairs={displayedPairs}
              selectedPairId={selectedPairId}
              onSelectPair={handleSelectPairAndOpenChart}
              starredPairIds={starredPairIds}
              onToggleStar={handleToggleStar}
              currentLang={currentLang}
            />
          ) : (
            <PairsTable
              pairs={displayedPairs}
              selectedPairId={selectedPairId}
              onSelectPair={handleSelectPairAndOpenChart}
              starredPairIds={starredPairIds}
              onToggleStar={handleToggleStar}
              currentLang={currentLang}
            />
          )}
        </section>

      </main>

      {/* Interactive Technical Chart Drawer / Modal (Opens cleanly when requested without cluttering the main page) */}
      {isChartModalOpen && selectedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto">
            <TechnicalChart
              pair={selectedPair}
              currentLang={currentLang}
              onSimulateBreakout={handleSimulateBreakout}
              onClose={() => setIsChartModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Strategy Guide Modal */}
      <InsideDayEducationModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        currentLang={currentLang}
      />

      {/* Notification Center / Breakout History Modal */}
      <NotificationCenterModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onClearAlerts={() => {
          setAlerts([]);
          saveStoredAlerts([]);
        }}
        currentLang={currentLang}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onSelectPair={(id) => {
          setSelectedPairId(id);
          setIsChartModalOpen(true);
        }}
      />

      {/* Quiet, Minimalist Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Forex Inside Day Tracker · Clean Currency Compression Scanner</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsStrategyModalOpen(true)}
              className="hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              Strategy Guide
            </button>
            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className="hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              Alerts ({alerts.length})
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
