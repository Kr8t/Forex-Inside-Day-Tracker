export interface LiveRatesResponse {
  result: string;
  provider: string;
  time_last_update_utc: string;
  time_last_update_unix: number;
  rates: Record<string, number>;
}

export interface PairPriceQuote {
  symbol: string;
  price: number;
  pipSize: number;
}

/**
 * Fetch real live spot foreign exchange rates from open.er-api.com
 */
export async function fetchLiveExchangeRates(): Promise<{
  success: boolean;
  quotes: Record<string, number>;
  lastUpdateUtc: string;
  error?: string;
}> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data: LiveRatesResponse = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Malformed live exchange rate response');
    }

    const r = data.rates;
    const quotes: Record<string, number> = {};

    // Direct and cross calculations against USD
    if (r.EUR) quotes['EUR/USD'] = Number((1 / r.EUR).toFixed(4));
    if (r.GBP) quotes['GBP/USD'] = Number((1 / r.GBP).toFixed(4));
    if (r.JPY) quotes['USD/JPY'] = Number(r.JPY.toFixed(2));
    if (r.CAD) quotes['USD/CAD'] = Number(r.CAD.toFixed(4));
    if (r.CHF) quotes['USD/CHF'] = Number(r.CHF.toFixed(4));
    if (r.AUD) quotes['AUD/USD'] = Number((1 / r.AUD).toFixed(4));
    if (r.NZD) quotes['NZD/USD'] = Number((1 / r.NZD).toFixed(4));
    if (r.MXN) quotes['USD/MXN'] = Number(r.MXN.toFixed(4));
    if (r.ZAR) quotes['USD/ZAR'] = Number(r.ZAR.toFixed(4));
    if (r.SGD) quotes['USD/SGD'] = Number(r.SGD.toFixed(4));

    // Crosses
    if (r.EUR && r.GBP) quotes['EUR/GBP'] = Number((r.GBP / r.EUR).toFixed(4));
    if (r.EUR && r.JPY) quotes['EUR/JPY'] = Number((r.JPY / r.EUR).toFixed(2));
    if (r.EUR && r.AUD) quotes['EUR/AUD'] = Number((r.AUD / r.EUR).toFixed(4));
    if (r.EUR && r.CHF) quotes['EUR/CHF'] = Number((r.CHF / r.EUR).toFixed(4));
    if (r.GBP && r.JPY) quotes['GBP/JPY'] = Number((r.JPY / r.GBP).toFixed(2));
    if (r.GBP && r.CAD) quotes['GBP/CAD'] = Number((r.CAD / r.GBP).toFixed(4));
    if (r.AUD && r.JPY) quotes['AUD/JPY'] = Number((r.JPY / r.AUD).toFixed(2));
    if (r.CAD && r.JPY) quotes['CAD/JPY'] = Number((r.JPY / r.CAD).toFixed(2));

    return {
      success: true,
      quotes,
      lastUpdateUtc: data.time_last_update_utc,
    };
  } catch (error) {
    return {
      success: false,
      quotes: {},
      lastUpdateUtc: '',
      error: error instanceof Error ? error.message : 'Failed to fetch live rates',
    };
  }
}
