import React from 'react';
import { Bell, Moon, Sun, Globe, BookOpen } from 'lucide-react';
import { LanguageCode } from '../types/forex';
import { translations } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  onOpenStrategy: () => void;
  onOpenSettings: () => void;
}

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'US' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'ja', label: '日本語', flag: 'JP' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'zh', label: '中文', flag: 'CN' },
  { code: 'ar', label: 'العربية', flag: 'AE' },
];

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  isDarkMode,
  onToggleTheme,
  unreadAlertCount,
  onOpenAlerts,
  onOpenStrategy,
}) => {
  const t = translations[currentLang];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Single text element wordmark with brand icon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {/* Outer Mother Candle */}
              <line x1="7" y1="2" x2="7" y2="22" strokeWidth="1.75" strokeLinecap="round" />
              <rect x="5" y="6" width="4" height="12" rx="0.5" fill="currentColor" fillOpacity="0.2" strokeWidth="1.75" />
              {/* Inner Inside Candle (Green) */}
              <line x1="17" y1="7" x2="17" y2="17" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round" />
              <rect x="15" y="9" width="4" height="6" rx="0.5" fill="#10B981" stroke="#10B981" strokeWidth="1.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap leading-none">
              {t.appName}
            </h1>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Strategy Guide Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onOpenStrategy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{t.strategyGuide}</span>
          </button>
        </div>

        {/* Zone 3: Primary actions (Language, Alerts, Theme, PWA Install) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Selector */}
          <div className="relative group">
            <label htmlFor="language-select" className="sr-only">Language</label>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                id="language-select"
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent border-none outline-hidden text-xs font-medium cursor-pointer pr-1"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breakout Alerts Notification Center Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition"
            title={t.pushNotifications}
            aria-label="Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </button>

          {/* Theme Dark/Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition"
            title={isDarkMode ? t.lightMode : t.darkMode}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton installLabel={t.installApp} />
        </div>

      </div>
    </header>
  );
};
