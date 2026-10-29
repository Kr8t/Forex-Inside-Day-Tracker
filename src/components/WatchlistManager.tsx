import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, LayoutGrid, Table, Bookmark, Zap, ArrowUpRight } from 'lucide-react';
import { ForexPair, LanguageCode, Watchlist } from '../types/forex';
import { translations } from '../i18n/translations';

interface Props {
  currentLang: LanguageCode;
  pairs: ForexPair[];
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  onCreateWatchlist: (name: string, pairIds: string[]) => void;
  onUpdateWatchlist: (id: string, name: string, pairIds: string[]) => void;
  onDeleteWatchlist: (id: string) => void;
  
  // Filter tabs
  activeFilter:
    | 'all'
    | 'inside_only'
    | 'green'
    | 'red'
    | 'neutral'
    | 'near_breakout'
    | 'top_performers'
    | 'breakout_setups'
    | 'closed_breakout';
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
  insideCounts: {
    total: number;
    green: number;
    red: number;
    neutral: number;
    nearBreakout: number;
  };
  breakoutSetupsCount: number;
  closedBreakoutCount: number;

  viewMode: 'cards' | 'table';
  onToggleViewMode: (mode: 'cards' | 'table') => void;
}

export const WatchlistManager: React.FC<Props> = ({
  currentLang,
  pairs,
  watchlists,
  activeWatchlistId,
  onSelectWatchlist,
  onCreateWatchlist,
  onUpdateWatchlist,
  onDeleteWatchlist,
  activeFilter,
  onSelectFilter,
  insideCounts,
  breakoutSetupsCount,
  closedBreakoutCount,
  viewMode,
  onToggleViewMode,
}) => {
  const t = translations[currentLang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWatchlistId, setEditingWatchlistId] = useState<string | null>(null);
  const [modalName, setModalName] = useState('');
  const [selectedPairIds, setSelectedPairIds] = useState<string[]>([]);

  const handleOpenCreate = () => {
    setEditingWatchlistId(null);
    setModalName('');
    setSelectedPairIds(['eurusd', 'gbpusd', 'usdjpy']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wl: Watchlist) => {
    setEditingWatchlistId(wl.id);
    setModalName(wl.name);
    setSelectedPairIds([...wl.pairIds]);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    if (editingWatchlistId) {
      onUpdateWatchlist(editingWatchlistId, modalName.trim(), selectedPairIds);
    } else {
      onCreateWatchlist(modalName.trim(), selectedPairIds);
    }
    setIsModalOpen(false);
  };

  const togglePairSelection = (pairId: string) => {
    setSelectedPairIds((prev) =>
      prev.includes(pairId) ? prev.filter((id) => id !== pairId) : [...prev, pairId]
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
      
      {/* Streamlined Primary Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => onSelectFilter('inside_only')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'inside_only'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t.insideDaysOnly}</span>
          <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
            {insideCounts.total}
          </span>
        </button>

        <button
          onClick={() => onSelectFilter('green')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'green'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Green ({insideCounts.green})</span>
        </button>

        <button
          onClick={() => onSelectFilter('red')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'red'
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Red ({insideCounts.red})</span>
        </button>

        <button
          onClick={() => onSelectFilter('neutral')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'neutral'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Neutral ({insideCounts.neutral})</span>
        </button>

        <button
          onClick={() => onSelectFilter('breakout_setups')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'breakout_setups'
              ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Breakouts In Play ({breakoutSetupsCount})</span>
        </button>

        <button
          onClick={() => onSelectFilter(activeFilter === 'closed_breakout' ? 'inside_only' : 'closed_breakout')}
          title={t.closedInBreakoutDesc}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shrink-0 ${
            activeFilter === 'closed_breakout'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.closedInBreakout} ({closedBreakoutCount})</span>
        </button>

        <button
          onClick={() => onSelectFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
            activeFilter === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.allPairs} ({pairs.length})
        </button>
      </div>

      {/* Right Controls: Watchlist selector & View Toggle (Cards / Table) */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        
        {/* Watchlist Quick Switcher */}
        <div className="flex items-center gap-1 text-xs">
          <Bookmark className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeWatchlistId}
            onChange={(e) => onSelectWatchlist(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-hidden cursor-pointer"
          >
            {watchlists.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.pairIds.length})
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Create Custom Watchlist"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-1" />

        {/* View Mode Switcher: Cards vs Table */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onToggleViewMode('cards')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleViewMode('table')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Compact Table View"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Modal: Create Watchlist */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold">
                {editingWatchlistId ? t.editWatchlist : t.createWatchlist}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.watchlistName}
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. My Breakout Watch"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.selectPairs} ({selectedPairIds.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  {pairs.map((p) => {
                    const isChecked = selectedPairIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePairSelection(p.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition border ${
                          isChecked
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 font-semibold'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{p.symbol}</span>
                        {isChecked && <span className="text-[10px] text-sky-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
