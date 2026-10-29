import { BreakoutAlert } from '../types/forex';

const NOTIFICATIONS_STORAGE_KEY = 'forex_inside_day_notifications_history_v1';
const SETTINGS_STORAGE_KEY = 'forex_inside_day_alert_settings_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Play a clean, subtle dual-tone trading chime using Web Audio API (offline & zero network asset)
 */
export function playAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Second chime tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Audio chime play error:', err);
  }
}

export function sendPushAlert(title: string, body: string, pairSymbol?: string): void {
  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: `forex-inside-${pairSymbol || 'alert'}`,
      });
    } catch (err) {
      console.warn('Browser notification send error:', err);
    }
  }
}

export function getStoredAlerts(): BreakoutAlert[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read stored alerts:', err);
  }
  return [];
}

export function saveStoredAlerts(alerts: BreakoutAlert[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
  } catch (err) {
    console.warn('Could not save alerts history:', err);
  }
}

export function getStoredSettings() {
  const defaults = {
    browserNotificationsEnabled: false,
    soundEnabled: true,
    imminentPipsThreshold: 15,
    notifyOnInsideDayClose: true,
    notifyOnBreakout: true,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read alert settings:', err);
  }
  return defaults;
}

export function saveStoredSettings(settings: ReturnType<typeof getStoredSettings>): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save alert settings:', err);
  }
}
