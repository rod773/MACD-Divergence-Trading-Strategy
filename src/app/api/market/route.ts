import { NextRequest, NextResponse } from "next/server";
import { fetchOHLCV, fetchCurrentPrice } from "@/lib/market-data";
import { calculateMACD, detectDivergences, DetectedDivergence } from "@/lib/divergence-detector";

interface MarketResponse {
  pair: string;
  currentPrice: number;
  divergences: DetectedDivergence[];
  lastUpdated: string;
  error?: string;
}

async function processPair(pair: string): Promise<MarketResponse> {
  try {
    const currentPrice = await fetchCurrentPrice(pair);

    let divergences: DetectedDivergence[] = [];
    try {
      // Fetch data for both timeframes
      const dailyData = await fetchOHLCV(pair, "4H / Daily");
      const hourlyData = await fetchOHLCV(pair, "1H / 4H");

      // Calculate MACD for both
      const dailyCloses = dailyData.map((d) => d.close);
      const hourlyCloses = hourlyData.map((d) => d.close);

      const dailyMACD = calculateMACD(dailyCloses);
      const hourlyMACD = calculateMACD(hourlyCloses);

      // Detect divergences on both timeframes
      const dailyDivergences = detectDivergences(dailyData, dailyMACD, pair, "4H / Daily");
      const hourlyDivergences = detectDivergences(hourlyData, hourlyMACD, pair, "1H / 4H");

      // Combine and take only the most recent divergences
      divergences = [...dailyDivergences, ...hourlyDivergences]
        .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
        .slice(0, 4);
    } catch {
      // OHLCV/divergence failure is non-fatal — still return the price
    }

    return {
      pair,
      currentPrice,
      divergences,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      pair,
      currentPrice: 0,
      divergences: [],
      lastUpdated: new Date().toISOString(),
      error: message,
    };
  }
}

export async function GET(_request: NextRequest) {
  try {
    const pairs = ["AUD/USD", "XAU/USD", "ETH/USD", "BTC/USD", "BOLD"];

    // Fetch all pairs in parallel
    const results = await Promise.all(pairs.map(processPair));

    const response: Record<string, MarketResponse> = {};
    for (const result of results) {
      response[result.pair] = result;
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
