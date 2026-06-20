import { OHLCV } from "./market-data";

export interface MACDPoint {
  date: Date;
  macd: number;
  signal: number;
  histogram: number;
}

export interface SwingPoint {
  index: number;
  date: Date;
  value: number;
}

export interface DetectedDivergence {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  divergenceType: "Regular Bullish" | "Regular Bearish" | "Hidden Bullish" | "Hidden Bearish";
  timeframe: string;
  detectedAt: Date;
  priceSwing1: SwingPoint;
  priceSwing2: SwingPoint;
  macdSwing1: SwingPoint;
  macdSwing2: SwingPoint;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);

  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDPoint[] {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);

  return macdLine.map((macd, i) => ({
    date: new Date(),
    macd,
    signal: signalLine[i],
    histogram: histogram[i],
  }));
}

function findSwingPoints(
  data: number[],
  lookback = 5
): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let i = lookback; i < data.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (data[i] <= data[i - j] || data[i] <= data[i + j]) {
        isHigh = false;
      }
      if (data[i] >= data[i - j] || data[i] >= data[i + j]) {
        isLow = false;
      }
    }

    if (isHigh) {
      swings.push({ index: i, date: new Date(), value: data[i] });
    }
    if (isLow) {
      swings.push({ index: i, date: new Date(), value: data[i] });
    }
  }

  return swings;
}

function findSwingHighs(points: SwingPoint[]): SwingPoint[] {
  return points.filter((p, i) => {
    if (i === 0) return true;
    const prev = points[i - 1];
    return p.value > prev.value;
  });
}

function findSwingLows(points: SwingPoint[]): SwingPoint[] {
  return points.filter((p, i) => {
    if (i === 0) return true;
    const prev = points[i - 1];
    return p.value < prev.value;
  });
}

export function detectDivergences(
  prices: OHLCV[],
  macdData: MACDPoint[],
  pair: string,
  timeframe: string
): DetectedDivergence[] {
  const divergences: DetectedDivergence[] = [];
  const closes = prices.map((p) => p.close);
  const macdValues = macdData.map((m) => m.macd);

  const priceSwings = findSwingPoints(closes);
  const macdSwings = findSwingPoints(macdValues);

  const priceHighs = findSwingHighs(priceSwings);
  const priceLows = findSwingLows(priceSwings);
  const macdHighs = findSwingHighs(macdSwings);
  const macdLows = findSwingLows(macdSwings);

  // Regular Bearish: Price HH + MACD LH (reversal in uptrend)
  for (let i = 1; i < Math.min(priceHighs.length, 5); i++) {
    const prev = priceHighs[i - 1];
    const curr = priceHighs[i];

    if (curr.value > prev.value) {
      const macdBetween = macdHighs.filter(
        (m) => m.index > prev.index && m.index <= curr.index
      );
      if (macdBetween.length >= 1) {
        const lastMacdHigh = macdBetween[macdBetween.length - 1];
        const prevMacdHigh = macdHighs.find((m) => m.index === prev.index) || macdBetween[0];

        if (lastMacdHigh.value < prevMacdHigh.value) {
          divergences.push({
            id: `${pair.replace("/", "")}-bearish-reg-${Date.now()}-${i}`,
            pair,
            direction: "SELL",
            divergenceType: "Regular Bearish",
            timeframe,
            detectedAt: new Date(),
            priceSwing1: { ...prev, date: prices[prev.index]?.date || new Date() },
            priceSwing2: { ...curr, date: prices[curr.index]?.date || new Date() },
            macdSwing1: { ...prevMacdHigh, date: macdData[prevMacdHigh.index]?.date || new Date() },
            macdSwing2: { ...lastMacdHigh, date: macdData[lastMacdHigh.index]?.date || new Date() },
            confidence: lastMacdHigh.value < prevMacdHigh.value * 0.7 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }
  }

  // Regular Bullish: Price LL + MACD HL (reversal in downtrend)
  for (let i = 1; i < Math.min(priceLows.length, 5); i++) {
    const prev = priceLows[i - 1];
    const curr = priceLows[i];

    if (curr.value < prev.value) {
      const macdBetween = macdLows.filter(
        (m) => m.index > prev.index && m.index <= curr.index
      );
      if (macdBetween.length >= 1) {
        const lastMacdLow = macdBetween[macdBetween.length - 1];
        const prevMacdLow = macdLows.find((m) => m.index === prev.index) || macdBetween[0];

        if (lastMacdLow.value > prevMacdLow.value) {
          divergences.push({
            id: `${pair.replace("/", "")}-bullish-reg-${Date.now()}-${i}`,
            pair,
            direction: "BUY",
            divergenceType: "Regular Bullish",
            timeframe,
            detectedAt: new Date(),
            priceSwing1: { ...prev, date: prices[prev.index]?.date || new Date() },
            priceSwing2: { ...curr, date: prices[curr.index]?.date || new Date() },
            macdSwing1: { ...prevMacdLow, date: macdData[prevMacdLow.index]?.date || new Date() },
            macdSwing2: { ...lastMacdLow, date: macdData[lastMacdLow.index]?.date || new Date() },
            confidence: lastMacdLow.value > prevMacdLow.value * 1.3 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }
  }

  // Hidden Bearish: Price LH + MACD HH (continuation in downtrend)
  for (let i = 1; i < Math.min(priceHighs.length, 5); i++) {
    const prev = priceHighs[i - 1];
    const curr = priceHighs[i];

    if (curr.value < prev.value) {
      const macdBetween = macdHighs.filter(
        (m) => m.index > prev.index && m.index <= curr.index
      );
      if (macdBetween.length >= 1) {
        const lastMacdHigh = macdBetween[macdBetween.length - 1];
        const prevMacdHigh = macdHighs.find((m) => m.index === prev.index) || macdBetween[0];

        if (lastMacdHigh.value > prevMacdHigh.value) {
          divergences.push({
            id: `${pair.replace("/", "")}-bearish-hidden-${Date.now()}-${i}`,
            pair,
            direction: "SELL",
            divergenceType: "Hidden Bearish",
            timeframe,
            detectedAt: new Date(),
            priceSwing1: { ...prev, date: prices[prev.index]?.date || new Date() },
            priceSwing2: { ...curr, date: prices[curr.index]?.date || new Date() },
            macdSwing1: { ...prevMacdHigh, date: macdData[prevMacdHigh.index]?.date || new Date() },
            macdSwing2: { ...lastMacdHigh, date: macdData[lastMacdHigh.index]?.date || new Date() },
            confidence: lastMacdHigh.value > prevMacdHigh.value * 1.2 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }
  }

  // Hidden Bullish: Price HL + MACD LL (continuation in uptrend)
  for (let i = 1; i < Math.min(priceLows.length, 5); i++) {
    const prev = priceLows[i - 1];
    const curr = priceLows[i];

    if (curr.value > prev.value) {
      const macdBetween = macdLows.filter(
        (m) => m.index > prev.index && m.index <= curr.index
      );
      if (macdBetween.length >= 1) {
        const lastMacdLow = macdBetween[macdBetween.length - 1];
        const prevMacdLow = macdLows.find((m) => m.index === prev.index) || macdBetween[0];

        if (lastMacdLow.value < prevMacdLow.value) {
          divergences.push({
            id: `${pair.replace("/", "")}-bullish-hidden-${Date.now()}-${i}`,
            pair,
            direction: "BUY",
            divergenceType: "Hidden Bullish",
            timeframe,
            detectedAt: new Date(),
            priceSwing1: { ...prev, date: prices[prev.index]?.date || new Date() },
            priceSwing2: { ...curr, date: prices[curr.index]?.date || new Date() },
            macdSwing1: { ...prevMacdLow, date: macdData[prevMacdLow.index]?.date || new Date() },
            macdSwing2: { ...lastMacdLow, date: macdData[lastMacdLow.index]?.date || new Date() },
            confidence: lastMacdLow.value < prevMacdLow.value * 0.8 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }
  }

  return divergences;
}
