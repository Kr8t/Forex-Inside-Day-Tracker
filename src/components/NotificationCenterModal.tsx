import React from 'react';
import { X, Bell, BellOff, Volume2, VolumeX, CheckCircle, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BreakoutAlert, LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';
import { requestNotificationPermission, getNotificationPermission } from '../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alerts: BreakoutAlert[];
  onClearAlerts: () => void;
  currentLang: LanguageCode;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectPair: (pairId: string) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  currentLang,
  soundEnabled,
  onToggleSound,
  onSelectPair,
}) => {
  if (!isOpen) return null;
  const t = translations[currentLang];
  const permission = getNotificationPermission();

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    // force re-render
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold">{t.alertHistory}</h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
              {alerts.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        <div className="my-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {t.pushNotifications}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {permission === 'granted'
                ? t.notificationPermissionGranted
                : permission === 'denied'
                ? t.notificationPermissionDenied
                : 'Enable system notifications for imminent breakouts'}
            </div>
          </div>

          {permission !== 'granted' && permission !== 'denied' ? (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition whitespace-nowrap shrink-0"
            >
              {t.enableBrowserAlerts}
            </button>
          ) : permission === 'granted' ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
              <CheckCircle className="w-4 h-4" />
              <span>Active</span>
            </span>
          ) : (
            <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
              <BellOff className="w-3.5 h-3.5" />
              <span>Blocked</span>
            </span>
          )}
        </div>

        {/* Audio Chime Toggle */}
        <div className="flex items-center justify-between text-xs px-1 pb-3 text-slate-600 dark:text-slate-400">
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>Sound alerts {soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>

          {alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </button>
          )}
        </div>

        {/* Alert List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {t.noAlertsYet}
            </div>
          ) : (
            alerts.map((alert) => {
              const isBullish =
                alert.type === 'bullish_breakout' || alert.type === 'imminent_high';
              const isBreach =
                alert.type === 'bullish_breakout' || alert.type === 'bearish_breakout';

              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    onSelectPair(alert.pairId);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isBreach
                      ? isBullish
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBullish ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {alert.symbol}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isBullish ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {alert.type === 'bullish_breakout'
                          ? t.bullishBreakout
                          : alert.type === 'bearish_breakout'
                          ? t.bearishBreakout
                          : t.imminentBreakout}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>
                      Triggered at: <strong className="text-slate-800 dark:text-slate-200">{alert.price}</strong>
                    </span>
                    <span>
                      Boundary: <strong className="text-slate-800 dark:text-slate-200">{alert.thresholdPrice}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-lg transition"
          >
            {t.closeWindow}
          </button>
        </div>

      </div>
    </div>
  );
};
