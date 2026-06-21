import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const PAIR_TICKERS: Record<string, string> = {
  "AUD/USD": "AUDUSD=X",
  "XAU/USD": "GC=F",
  "ETH/USD": "ETH-USD",
  "BTC/USD": "BTC-USD",
  "BOLD/USD": "BOLD-USD",
};

const TIMEFRAME_CONFIG: Record<string, { period1: string; period2: string }> = {
  "4H / Daily": { period1: "2024-06-01", period2: "2026-06-20" },
  "1H / 4H": { period1: "2025-01-01", period2: "2026-06-20" },
};

interface BoldPerformance {
  date: string;
  value: number;
}

let boldCache: { data: BoldPerformance[]; fetchedAt: number } | null = null;

async function fetchBoldHistory(): Promise<BoldPerformance[]> {
  if (boldCache && Date.now() - boldCache.fetchedAt < 3600000) {
    return boldCache.data;
  }
  const res = await fetch("https://bold.report/api/v1/bold/performance.json");
  if (!res.ok) throw new Error("Failed to fetch BOLD data");
  const data = await res.json();
  boldCache = { data, fetchedAt: Date.now() };
  return data;
}

export async function fetchOHLCV(
  pair: string,
  timeframe: string
): Promise<OHLCV[]> {
  if (pair === "BOLD") {
    const history = await fetchBoldHistory();
    if (!history || history.length === 0) {
      throw new Error("No BOLD data returned");
    }
    return history.map((q) => {
      const date = new Date(q.date);
      const close = q.value;
      return {
        date,
        open: close,
        high: close,
        low: close,
        close,
        volume: 0,
      };
    });
  }

  const ticker = PAIR_TICKERS[pair];
  if (!ticker) throw new Error(`Unknown pair: ${pair}`);

  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG["4H / Daily"];

  const result = await yahooFinance.historical(ticker, {
    period1: config.period1,
    period2: config.period2,
  });

  if (!result || result.length === 0) {
    throw new Error(`No data returned for ${ticker}`);
  }

  return result.map((q) => ({
    date: q.date,
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume || 0,
  }));
}

export async function fetchCurrentPrice(pair: string): Promise<number> {
  if (pair === "BOLD") {
    const res = await fetch("https://bold.report/api/v1/bold/performance-latest.json");
    if (!res.ok) throw new Error("Failed to fetch BOLD price");
    const data = await res.json();
    return data.value ?? 0;
  }

  const ticker = PAIR_TICKERS[pair];
  if (!ticker) throw new Error(`Unknown pair: ${pair}`);

  const quote = await yahooFinance.quote(ticker);
  return quote.regularMarketPrice ?? 0;
}
