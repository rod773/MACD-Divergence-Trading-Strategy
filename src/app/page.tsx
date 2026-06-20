"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
  Zap,
  BookOpen,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LineChart,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import AiChat from "@/components/ai-chat";

interface DetectedDivergence {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  divergenceType: "Regular Bullish" | "Regular Bearish" | "Hidden Bullish" | "Hidden Bearish";
  timeframe: string;
  detectedAt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

interface MarketData {
  pair: string;
  currentPrice: number;
  divergences: DetectedDivergence[];
  lastUpdated: string;
  error?: string;
}

interface DivergenceSetup {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  divergenceType: "Regular Bullish" | "Regular Bearish" | "Hidden Bullish" | "Hidden Bearish";
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  currentPrice: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  timeframe: string;
  trend: "Uptrend" | "Downtrend" | "Ranging";
  trendContext: string;
  signalMeaning: "Reversal" | "Continuation";
  probability: number;
  winRate: string;
  expectedReturn: string;
  riskAmount: string;
  analysis: string;
  priceAction: string;
  macdBehavior: string;
  confirmation: string;
}

const PAIRS = ["AUD/USD", "XAU/USD", "ETH/USD", "BTC/USD"] as const;

const divergenceSetups: DivergenceSetup[] = [
  {
    id: "audusd-bullish-reg",
    pair: "AUD/USD",
    direction: "BUY",
    divergenceType: "Regular Bullish",
    entry: 0.6940,
    stopLoss: 0.6890,
    takeProfit1: 0.7020,
    takeProfit2: 0.7100,
    currentPrice: 0.7013,
    confidence: "MEDIUM",
    timeframe: "4H / Daily",
    trend: "Downtrend",
    trendContext: "Appears in downtrends",
    signalMeaning: "Reversal",
    probability: 62,
    winRate: "62%",
    expectedReturn: "+80 pips",
    riskAmount: "50 pips (0.72%)",
    analysis:
      "Price has been making lower lows, but MACD is making higher lows. This classic bullish divergence suggests sellers are losing momentum and a reversal to the upside may occur at key support.",
    priceAction: "Price: Lower Low → Higher Low forming at 0.6940 support",
    macdBehavior: "MACD: Higher Low while price makes Lower Low = Bullish Divergence",
    confirmation: "Wait for MACD bullish crossover + bullish engulfing candle at support",
  },
  {
    id: "audusd-bearish-reg",
    pair: "AUD/USD",
    direction: "SELL",
    divergenceType: "Regular Bearish",
    entry: 0.7020,
    stopLoss: 0.7065,
    takeProfit1: 0.6950,
    takeProfit2: 0.6880,
    currentPrice: 0.7013,
    confidence: "HIGH",
    timeframe: "4H / Daily",
    trend: "Uptrend",
    trendContext: "Reversal in uptrend",
    signalMeaning: "Reversal",
    probability: 74,
    winRate: "74%",
    expectedReturn: "+70 pips",
    riskAmount: "45 pips (0.64%)",
    analysis:
      "Price making higher highs while MACD makes lower highs. Classic bearish divergence at resistance. Fed hawkish stance + RSI overbought at 72 supports further downside.",
    priceAction: "Price: Higher High → Lower High forming at 0.7030 resistance",
    macdBehavior: "MACD: Lower High while price makes Higher High = Bearish Divergence",
    confirmation: "MACD bearish crossover confirmed + bearish engulfing at resistance",
  },
  {
    id: "audusd-hidden-bullish",
    pair: "AUD/USD",
    direction: "BUY",
    divergenceType: "Hidden Bullish",
    entry: 0.6960,
    stopLoss: 0.6910,
    takeProfit1: 0.7040,
    takeProfit2: 0.7120,
    currentPrice: 0.7013,
    confidence: "HIGH",
    timeframe: "1H / 4H",
    trend: "Uptrend",
    trendContext: "Appears in uptrends (pullback)",
    signalMeaning: "Continuation",
    probability: 71,
    winRate: "71%",
    expectedReturn: "+80 pips",
    riskAmount: "50 pips (0.72%)",
    analysis:
      "Price makes higher low (above previous swing low) while MACD makes lower low. Hidden bullish divergence signals the uptrend is likely to continue after this pullback. Strong confluence with 200 EMA support.",
    priceAction: "Price: Higher Low at 0.6960 (above previous low of 0.6940)",
    macdBehavior: "MACD: Lower Low = Hidden Bullish Divergence (continuation signal)",
    confirmation: "Price holds above 200 EMA + MACD histogram turning positive",
  },
  {
    id: "audusd-hidden-bearish",
    pair: "AUD/USD",
    direction: "SELL",
    divergenceType: "Hidden Bearish",
    entry: 0.7030,
    stopLoss: 0.7075,
    takeProfit1: 0.6960,
    takeProfit2: 0.6900,
    currentPrice: 0.7013,
    confidence: "MEDIUM",
    timeframe: "1H / 4H",
    trend: "Downtrend",
    trendContext: "Appears in downtrends (bounce)",
    signalMeaning: "Continuation",
    probability: 68,
    winRate: "68%",
    expectedReturn: "+70 pips",
    riskAmount: "45 pips (0.64%)",
    analysis:
      "Price makes lower high (below previous swing high) while MACD makes higher high. Hidden bearish divergence signals the downtrend is likely to continue after this bounce. Dollar strength supports continuation.",
    priceAction: "Price: Lower High at 0.7030 (below previous high of 0.7060)",
    macdBehavior: "MACD: Higher High = Hidden Bearish Divergence (continuation signal)",
    confirmation: "Price rejected at resistance + MACD histogram turning negative",
  },
  {
    id: "gold-bullish-reg",
    pair: "XAU/USD",
    direction: "BUY",
    divergenceType: "Regular Bullish",
    entry: 4100,
    stopLoss: 4050,
    takeProfit1: 4200,
    takeProfit2: 4300,
    currentPrice: 4172.9,
    confidence: "MEDIUM",
    timeframe: "4H / Daily",
    trend: "Downtrend",
    trendContext: "Reversal in downtrend",
    signalMeaning: "Reversal",
    probability: 58,
    winRate: "58%",
    expectedReturn: "+100 pts",
    riskAmount: "50 pts (1.2%)",
    analysis:
      "Gold dropped 1.72% but MACD showing potential bullish divergence at oversold levels. If price makes another low while MACD makes higher low, expect reversal. Key support at 4100.",
    priceAction: "Price: Potential Lower Low at 4100 support zone",
    macdBehavior: "MACD: Watch for Higher Low = Regular Bullish Divergence",
    confirmation: "Wait for MACD bullish crossover + RSI divergence below 30",
  },
  {
    id: "gold-bearish-reg",
    pair: "XAU/USD",
    direction: "SELL",
    divergenceType: "Regular Bearish",
    entry: 4200,
    stopLoss: 4260,
    takeProfit1: 4100,
    takeProfit2: 4000,
    currentPrice: 4172.9,
    confidence: "HIGH",
    timeframe: "4H / Daily",
    trend: "Uptrend",
    trendContext: "Reversal in uptrend",
    signalMeaning: "Reversal",
    probability: 72,
    winRate: "72%",
    expectedReturn: "+100 pts",
    riskAmount: "60 pts (1.4%)",
    analysis:
      "Gold made recent highs with weakening MACD momentum. Bearish divergence forming at resistance. Combined with -1.72% daily drop and strong sell signals, expect continued downside.",
    priceAction: "Price: Higher High at 4233 with rejection candle",
    macdBehavior: "MACD: Lower High = Regular Bearish Divergence confirmed",
    confirmation: "MACD bearish crossover + bearish engulfing + volume spike on drop",
  },
  {
    id: "gold-hidden-bullish",
    pair: "XAU/USD",
    direction: "BUY",
    divergenceType: "Hidden Bullish",
    entry: 4120,
    stopLoss: 4070,
    takeProfit1: 4220,
    takeProfit2: 4320,
    currentPrice: 4172.9,
    confidence: "MEDIUM",
    timeframe: "1H / 4H",
    trend: "Uptrend",
    trendContext: "Continuation in uptrend",
    signalMeaning: "Continuation",
    probability: 65,
    winRate: "65%",
    expectedReturn: "+100 pts",
    riskAmount: "50 pts (1.2%)",
    analysis:
      "If gold pulls back to 4120 and makes higher low while MACD makes lower low, hidden bullish divergence confirms uptrend continuation. Gold's 1-year +22.44% trend supports this.",
    priceAction: "Price: Higher Low forming at 4120 (above 4050 previous low)",
    macdBehavior: "MACD: Lower Low = Hidden Bullish (continuation in uptrend)",
    confirmation: "Price holds above 50 EMA + MACD histogram turning positive",
  },
  {
    id: "gold-hidden-bearish",
    pair: "XAU/USD",
    direction: "SELL",
    divergenceType: "Hidden Bearish",
    entry: 4200,
    stopLoss: 4255,
    takeProfit1: 4100,
    takeProfit2: 4000,
    currentPrice: 4172.9,
    confidence: "HIGH",
    timeframe: "1H / 4H",
    trend: "Downtrend",
    trendContext: "Continuation in downtrend",
    signalMeaning: "Continuation",
    probability: 70,
    winRate: "70%",
    expectedReturn: "+100 pts",
    riskAmount: "55 pts (1.3%)",
    analysis:
      "If gold bounces to 4200 and makes lower high while MACD makes higher high, hidden bearish divergence confirms downtrend continuation. Current bearish momentum supports this scenario.",
    priceAction: "Price: Lower High at 4200 (below 4233 previous high)",
    macdBehavior: "MACD: Higher High = Hidden Bearish (continuation in downtrend)",
    confirmation: "Price rejected at 4200 + MACD histogram turning negative",
  },
  {
    id: "eth-bullish-reg",
    pair: "ETH/USD",
    direction: "BUY",
    divergenceType: "Regular Bullish",
    entry: 3450,
    stopLoss: 3350,
    takeProfit1: 3650,
    takeProfit2: 3850,
    currentPrice: 3512,
    confidence: "HIGH",
    timeframe: "4H / Daily",
    trend: "Downtrend",
    trendContext: "Appears in downtrends",
    signalMeaning: "Reversal",
    probability: 67,
    winRate: "67%",
    expectedReturn: "+200 pts",
    riskAmount: "100 pts (2.9%)",
    analysis:
      "ETH dropped to key support at 3450 while MACD is forming higher lows. Classic bullish divergence suggests sellers are exhausted. ETH's correlation with BTC and strong ecosystem growth support a reversal.",
    priceAction: "Price: Lower Low at 3450 support (below 3500 previous low)",
    macdBehavior: "MACD: Higher Low while price makes Lower Low = Bullish Divergence",
    confirmation: "Wait for MACD bullish crossover + bullish engulfing at support",
  },
  {
    id: "eth-bearish-reg",
    pair: "ETH/USD",
    direction: "SELL",
    divergenceType: "Regular Bearish",
    entry: 3650,
    stopLoss: 3750,
    takeProfit1: 3450,
    takeProfit2: 3250,
    currentPrice: 3512,
    confidence: "MEDIUM",
    timeframe: "4H / Daily",
    trend: "Uptrend",
    trendContext: "Appears in uptrends",
    signalMeaning: "Reversal",
    probability: 63,
    winRate: "63%",
    expectedReturn: "+200 pts",
    riskAmount: "100 pts (2.7%)",
    analysis:
      "If ETH rallies to 3650 resistance with weakening MACD momentum, bearish divergence forms. RSI overbought conditions combined with profit-taking pressure suggest a pullback.",
    priceAction: "Price: Higher High at 3650 resistance zone",
    macdBehavior: "MACD: Lower High while price makes Higher High = Bearish Divergence",
    confirmation: "MACD bearish crossover + rejection candle at resistance",
  },
  {
    id: "eth-hidden-bullish",
    pair: "ETH/USD",
    direction: "BUY",
    divergenceType: "Hidden Bullish",
    entry: 3480,
    stopLoss: 3380,
    takeProfit1: 3680,
    takeProfit2: 3880,
    currentPrice: 3512,
    confidence: "MEDIUM",
    timeframe: "1H / 4H",
    trend: "Uptrend",
    trendContext: "Appears in uptrends (pullback)",
    signalMeaning: "Continuation",
    probability: 64,
    winRate: "64%",
    expectedReturn: "+200 pts",
    riskAmount: "100 pts (2.9%)",
    analysis:
      "ETH pullback to 3480 creating higher low while MACD makes lower low. Hidden bullish divergence confirms uptrend continuation. Strong DeFi TVL growth supports underlying demand.",
    priceAction: "Price: Higher Low at 3480 (above 3450 previous low)",
    macdBehavior: "MACD: Lower Low = Hidden Bullish Divergence (continuation signal)",
    confirmation: "Price holds above 50 EMA + MACD histogram turning positive",
  },
  {
    id: "eth-hidden-bearish",
    pair: "ETH/USD",
    direction: "SELL",
    divergenceType: "Hidden Bearish",
    entry: 3580,
    stopLoss: 3680,
    takeProfit1: 3380,
    takeProfit2: 3180,
    currentPrice: 3512,
    confidence: "LOW",
    timeframe: "1H / 4H",
    trend: "Downtrend",
    trendContext: "Appears in downtrends (bounce)",
    signalMeaning: "Continuation",
    probability: 58,
    winRate: "58%",
    expectedReturn: "+200 pts",
    riskAmount: "100 pts (2.8%)",
    analysis:
      "ETH bounce to 3580 creating lower high while MACD makes higher high. Hidden bearish divergence signals downtrend continuation. Macro uncertainty weighing on risk assets.",
    priceAction: "Price: Lower High at 3580 (below 3650 previous high)",
    macdBehavior: "MACD: Higher High = Hidden Bearish Divergence (continuation signal)",
    confirmation: "Price rejected at resistance + MACD histogram turning negative",
  },
  {
    id: "btc-bullish-reg",
    pair: "BTC/USD",
    direction: "BUY",
    divergenceType: "Regular Bullish",
    entry: 103500,
    stopLoss: 101500,
    takeProfit1: 107500,
    takeProfit2: 111500,
    currentPrice: 104850,
    confidence: "HIGH",
    timeframe: "4H / Daily",
    trend: "Downtrend",
    trendContext: "Appears in downtrends",
    signalMeaning: "Reversal",
    probability: 70,
    winRate: "70%",
    expectedReturn: "+4000 pts",
    riskAmount: "2000 pts (1.9%)",
    analysis:
      "BTC testing 103,500 support with MACD showing bullish divergence. Strong institutional accumulation and halving cycle dynamics support a reversal. Key psychological level with high demand.",
    priceAction: "Price: Lower Low at 103,500 support zone",
    macdBehavior: "MACD: Higher Low while price makes Lower Low = Bullish Divergence",
    confirmation: "Wait for MACD bullish crossover + high volume reversal candle",
  },
  {
    id: "btc-bearish-reg",
    pair: "BTC/USD",
    direction: "SELL",
    divergenceType: "Regular Bearish",
    entry: 108000,
    stopLoss: 110000,
    takeProfit1: 104000,
    takeProfit2: 100000,
    currentPrice: 104850,
    confidence: "MEDIUM",
    timeframe: "4H / Daily",
    trend: "Uptrend",
    trendContext: "Appears in uptrends",
    signalMeaning: "Reversal",
    probability: 65,
    winRate: "65%",
    expectedReturn: "+4000 pts",
    riskAmount: "2000 pts (1.8%)",
    analysis:
      "If BTC rallies to 108,000 with weakening MACD, bearish divergence forms at resistance. Overleveraged long positions and profit-taking could trigger a pullback to key support.",
    priceAction: "Price: Higher High at 108,000 resistance",
    macdBehavior: "MACD: Lower High while price makes Higher High = Bearish Divergence",
    confirmation: "MACD bearish crossover + bearish engulfing at resistance",
  },
  {
    id: "btc-hidden-bullish",
    pair: "BTC/USD",
    direction: "BUY",
    divergenceType: "Hidden Bullish",
    entry: 104000,
    stopLoss: 102000,
    takeProfit1: 108000,
    takeProfit2: 112000,
    currentPrice: 104850,
    confidence: "HIGH",
    timeframe: "1H / 4H",
    trend: "Uptrend",
    trendContext: "Appears in uptrends (pullback)",
    signalMeaning: "Continuation",
    probability: 68,
    winRate: "68%",
    expectedReturn: "+4000 pts",
    riskAmount: "2000 pts (1.9%)",
    analysis:
      "BTC pullback to 104,000 creating higher low while MACD makes lower low. Hidden bullish divergence confirms uptrend continuation. Institutional demand remains strong at these levels.",
    priceAction: "Price: Higher Low at 104,000 (above 103,500 previous low)",
    macdBehavior: "MACD: Lower Low = Hidden Bullish Divergence (continuation signal)",
    confirmation: "Price holds above 200 EMA + MACD histogram turning positive",
  },
  {
    id: "btc-hidden-bearish",
    pair: "BTC/USD",
    direction: "SELL",
    divergenceType: "Hidden Bearish",
    entry: 106500,
    stopLoss: 108500,
    takeProfit1: 102500,
    takeProfit2: 98500,
    currentPrice: 104850,
    confidence: "MEDIUM",
    timeframe: "1H / 4H",
    trend: "Downtrend",
    trendContext: "Appears in downtrends (bounce)",
    signalMeaning: "Continuation",
    probability: 62,
    winRate: "62%",
    expectedReturn: "+4000 pts",
    riskAmount: "2000 pts (1.9%)",
    analysis:
      "BTC bounce to 106,500 creating lower high while MACD makes higher high. Hidden bearish divergence signals downtrend continuation. Regulatory concerns and whale distribution patterns.",
    priceAction: "Price: Lower High at 106,500 (below 108,000 previous high)",
    macdBehavior: "MACD: Higher High = Hidden Bearish Divergence (continuation signal)",
    confirmation: "Price rejected at resistance + MACD histogram turning negative",
  },
];

const divergenceGuide = [
  {
    type: "Regular Bullish",
    description: "Price makes lower lows, MACD makes higher lows",
    signal: "BUY",
    meaning: "Reversal",
    trendContext: "Appears in downtrends",
    reliability: "High",
    color: "emerald",
    icon: TrendingUp,
  },
  {
    type: "Regular Bearish",
    description: "Price makes higher highs, MACD makes lower highs",
    signal: "SELL",
    meaning: "Reversal",
    trendContext: "Appears in uptrends",
    reliability: "High",
    color: "rose",
    icon: TrendingDown,
  },
  {
    type: "Hidden Bullish",
    description: "Price makes higher lows, MACD makes lower lows",
    signal: "BUY",
    meaning: "Continuation",
    trendContext: "Appears in uptrends (pullback)",
    reliability: "Medium-High",
    color: "cyan",
    icon: TrendingUp,
  },
  {
    type: "Hidden Bearish",
    description: "Price makes lower highs, MACD makes higher highs",
    signal: "SELL",
    meaning: "Continuation",
    trendContext: "Appears in downtrends (bounce)",
    reliability: "Medium-High",
    color: "orange",
    icon: TrendingDown,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "trades" | "learn">(
    "dashboard"
  );
  const [selectedPair, setSelectedPair] = useState<"AUD/USD" | "XAU/USD" | "ETH/USD" | "BTC/USD">("AUD/USD");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedPrices, setAnimatedPrices] = useState<Record<string, number>>({});
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [alerts, setAlerts] = useState<{ id: string; pair: string; type: string; direction: string; time: string; dismissed: boolean; stopLoss: number; takeProfit: number }[]>([]);
  const [popupAlert, setPopupAlert] = useState<{ pair: string; type: string; direction: string; stopLoss: number; takeProfit: number } | null>(null);
  const [liveData, setLiveData] = useState<Record<string, MarketData>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");
  const knownDivergenceIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        setIsLoadingData(true);
        const res = await fetch("/api/market");
        if (!res.ok) throw new Error("Failed to fetch market data");
        const data: Record<string, MarketData> = await res.json();
        setLiveData(data);
        setLastFetchTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

        // Check for new divergences and trigger alerts
        for (const pair of PAIRS) {
          const pairData = data[pair];
          if (!pairData || pairData.error) continue;

          for (const div of pairData.divergences) {
            if (!knownDivergenceIds.current.has(div.id)) {
              knownDivergenceIds.current.add(div.id);
              const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const matchedSetup = divergenceSetups.find(
                (s) => s.pair === div.pair && s.divergenceType === div.divergenceType && s.direction === div.direction
              );
              let sl = matchedSetup?.stopLoss || 0;
              let tp = matchedSetup?.takeProfit1 || 0;
              const currentPrice = pairData.currentPrice;
              if (matchedSetup && currentPrice > 0) {
                const slDist = matchedSetup.stopLoss - matchedSetup.entry;
                const tpDist = matchedSetup.takeProfit1 - matchedSetup.entry;
                sl = currentPrice + slDist;
                tp = currentPrice + tpDist;
              }
              const newAlert = {
                id: div.id,
                pair: div.pair,
                type: div.divergenceType,
                direction: div.direction,
                time: now,
                dismissed: false,
                stopLoss: Math.round(sl * 100) / 100,
                takeProfit: Math.round(tp * 100) / 100,
              };
              setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
              setPopupAlert({ pair: div.pair, type: div.divergenceType, direction: div.direction, stopLoss: Math.round(sl * 100) / 100, takeProfit: Math.round(tp * 100) / 100 });
              setTimeout(() => setPopupAlert(null), 8000);
              break; // Only show one popup alert per fetch cycle
            }
          }
        }
      } catch (err) {
        console.error("Market data fetch error:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getInitialPrice = (pair: string): number => {
      const livePrice = liveData[pair]?.currentPrice;
      const hardcodedSetup = divergenceSetups.find((s) => s.pair === pair);
      return livePrice || hardcodedSetup?.currentPrice || 0;
    };

    const interval = setInterval(() => {
      setAnimatedPrices((prev) => {
        const next = { ...prev };
        PAIRS.forEach((pair) => {
          const livePrice = liveData[pair]?.currentPrice;
          if (livePrice && livePrice > 0) {
            next[pair] = livePrice;
          } else if (!prev[pair]) {
            next[pair] = getInitialPrice(pair);
          } else {
            const volatility = pair.includes("XAU") ? 2 : pair.includes("BTC") ? 50 : pair.includes("ETH") ? 2 : 0.0003;
            const change = (Math.random() - 0.5) * volatility;
            next[pair] = Math.max(0, (prev[pair] || 0) + change);
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [liveData]);

  const filteredSetups = divergenceSetups
    .filter((s) => {
      if (s.pair !== selectedPair) return false;
      if (selectedType !== "ALL" && s.divergenceType !== selectedType) return false;
      return true;
    })
    .map((setup) => {
      const livePrice = liveData[setup.pair]?.currentPrice;
      return livePrice ? { ...setup, currentPrice: livePrice } : setup;
    });

  const getDirectionColor = (dir: "BUY" | "SELL") =>
    dir === "BUY"
      ? "from-emerald-500 to-emerald-600"
      : "from-rose-500 to-rose-600";

  const getDivergenceColor = (type: string) => {
    if (type.includes("Regular Bullish")) return "border-emerald-500/30 bg-emerald-500/5";
    if (type.includes("Regular Bearish")) return "border-rose-500/30 bg-rose-500/5";
    if (type.includes("Hidden Bullish")) return "border-cyan-500/30 bg-cyan-500/5";
    if (type.includes("Hidden Bearish")) return "border-orange-500/30 bg-orange-500/5";
    return "border-white/5";
  };

  const getDivergenceBadge = (type: string) => {
    if (type.includes("Regular Bullish"))
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (type.includes("Regular Bearish"))
      return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (type.includes("Hidden Bullish"))
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    if (type.includes("Hidden Bearish"))
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getConfidenceColor = (c: "HIGH" | "MEDIUM" | "LOW") =>
    c === "HIGH"
      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
      : c === "MEDIUM"
      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      : "bg-gray-500/20 text-gray-400 border border-gray-500/30";

  const getPips = (entry: number, target: number, pair: string) => {
    if (pair.includes("XAU")) return Math.abs(target - entry).toFixed(0);
    return (Math.abs(target - entry) * 10000).toFixed(1);
  };

  const getRR = (entry: number, sl: number, tp: number) =>
    (Math.abs(tp - entry) / Math.abs(sl - entry)).toFixed(1);


  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4,16 8,10 12,18 16,6 20,14" />
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight hidden sm:block">
                MACD Divergence Pro
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {(
                [
                  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                  { id: "trades", label: "Trade Setups", icon: Target },
                  { id: "learn", label: "Divergence Guide", icon: BookOpen },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 rounded-md p-0.5 border border-white/5 overflow-x-auto max-w-[200px] sm:max-w-none">
                {(["AUD/USD", "XAU/USD", "ETH/USD", "BTC/USD"] as const).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-2 sm:px-2.5 py-1 rounded text-sm sm:text-xs font-medium transition-all whitespace-nowrap ${
                      selectedPair === pair
                        ? "bg-white/15 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <button className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:block">
                <Bell className="w-4 h-4" />
              </button>
              <button
                className="md:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {(
                  [
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "trades", label: "Trade Setups", icon: Target },
                    { id: "learn", label: "Divergence Guide", icon: BookOpen },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4 pb-20 md:pb-4">
        <AnimatePresence mode="wait">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Regular Bullish", type: "Regular Bullish", color: "text-emerald-400", sub: "Reversal BUY" },
                  { label: "Regular Bearish", type: "Regular Bearish", color: "text-rose-400", sub: "Reversal SELL" },
                  { label: "Hidden Bullish", type: "Hidden Bullish", color: "text-cyan-400", sub: "Continuation BUY" },
                  { label: "Hidden Bearish", type: "Hidden Bearish", color: "text-orange-400", sub: "Continuation SELL" },
                ].map((kpi, i) => {
                  // Count from live data if available, otherwise from filtered setups
                  const liveCount = Object.values(liveData).reduce((acc, pair) => {
                    return acc + (pair.divergences?.filter((d) => d.divergenceType === kpi.type).length || 0);
                  }, 0);
                  const setupCount = filteredSetups.filter((s) => s.divergenceType === kpi.type).length;
                  const count = liveCount > 0 ? liveCount : setupCount;
                  const avgProb = filteredSetups.filter((s) => s.divergenceType === kpi.type);
                  const avg = avgProb.length > 0 ? Math.round(avgProb.reduce((a, s) => a + s.probability, 0) / avgProb.length) : 0;
                  return (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#0E1223] border border-white/5 rounded-lg p-3"
                    >
                      <p className="text-sm uppercase tracking-wider text-slate-600 mb-1">{kpi.label}</p>
                      <p className={`text-2xl font-bold ${kpi.color}`}>{count}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{kpi.sub} {avg > 0 ? `• ${avg}% avg` : ""}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Popup Alert */}
              <AnimatePresence>
                {popupAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="mb-4"
                  >
                    <div className={`p-4 rounded-lg border ${
                      popupAlert.direction === "BUY"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-rose-500/10 border-rose-500/30"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          popupAlert.direction === "BUY" ? "bg-emerald-500" : "bg-rose-500"
                        }`}>
                          {popupAlert.direction === "BUY" ? (
                            <TrendingUp className="w-5 h-5 text-white" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">New Divergence Alert</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              popupAlert.direction === "BUY" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                            }`}>
                              {popupAlert.direction}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {popupAlert.pair} • {popupAlert.type}
                          </p>
                          {(popupAlert.stopLoss > 0 || popupAlert.takeProfit > 0) && (
                            <div className="flex items-center gap-3 mt-1">
                              {popupAlert.stopLoss > 0 && (
                                <span className="text-xs font-mono text-rose-400">SL: {popupAlert.stopLoss}</span>
                              )}
                              {popupAlert.takeProfit > 0 && (
                                <span className="text-xs font-mono text-emerald-400">TP: {popupAlert.takeProfit}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setPopupAlert(null)}
                          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alerts Table */}
              {alerts.length > 0 && (
                <div className="mb-4">
                  <div className="bg-[#0E1223] border border-white/5 rounded-lg">
                    <div className="flex items-center justify-between p-3 border-b border-white/5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5" />
                        Divergence Alerts
                      </h3>
                      <span className="text-xs text-slate-600">{alerts.filter((a) => !a.dismissed).length} active</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-slate-600 border-b border-white/5">
                            <th className="text-left px-3 py-2 font-medium">Time</th>
                            <th className="text-left px-3 py-2 font-medium">Pair</th>
                            <th className="text-left px-3 py-2 font-medium">Type</th>
                            <th className="text-left px-3 py-2 font-medium">Signal</th>
                            <th className="text-right px-3 py-2 font-medium">SL</th>
                            <th className="text-right px-3 py-2 font-medium">TP</th>
                            <th className="text-right px-3 py-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {alerts.map((alert) => (
                            <tr key={alert.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-3 py-2 text-xs text-slate-500 font-mono">{alert.time}</td>
                              <td className="px-3 py-2 text-xs font-semibold text-white">{alert.pair}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  alert.type.includes("Regular Bullish") ? "bg-emerald-500/20 text-emerald-400" :
                                  alert.type.includes("Regular Bearish") ? "bg-rose-500/20 text-rose-400" :
                                  alert.type.includes("Hidden Bullish") ? "bg-cyan-500/20 text-cyan-400" :
                                  "bg-orange-500/20 text-orange-400"
                                }`}>
                                  {alert.type}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                  alert.direction === "BUY" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                }`}>
                                  {alert.direction}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono tabular-nums text-rose-400">{alert.stopLoss || "—"}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-xs font-mono tabular-nums text-emerald-400">{alert.takeProfit || "—"}</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                                  className="w-6 h-6 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                  <X className="w-3 h-3 text-slate-500" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Chat Button */}
              <div className="mb-4">
                <button
                  onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:from-blue-500/15 hover:to-cyan-500/15 transition-all text-sm font-medium text-blue-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask AI Assistant about setups and strategies
                </button>
              </div>

              {/* Price Overview */}
              <div className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0E1223] border border-white/5 rounded-lg p-4"
                >
                  {selectedPair === "AUD/USD" ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5">
                            <span className="text-lg font-bold">A$</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">AUD/USD</h3>
                            <p className="text-xs text-slate-500">Australian Dollar / US Dollar</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLoadingData && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Strong Sell
                          </span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-2xl font-bold tabular-nums">{liveData["AUD/USD"]?.currentPrice?.toFixed(4) || animatedPrices["AUD/USD"]?.toFixed(4) || "0.7013"}</span>
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> -0.03%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Day Range</p>
                          <p className="text-sm font-medium tabular-nums">0.6989 - 0.7029</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">52W Range</p>
                          <p className="text-sm font-medium tabular-nums">0.6372 - 0.7279</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">RSI (14)</p>
                          <p className="text-sm font-medium text-rose-400">72 Overbought</p>
                        </div>
                      </div>
                    </>
                  ) : selectedPair === "XAU/USD" ? (
                    <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-white/5">
                              <span className="text-lg">🥇</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">XAU/USD</h3>
                              <p className="text-xs text-slate-500">Gold</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLoadingData && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Strong Sell
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <span className="text-2xl font-bold tabular-nums">${liveData["XAU/USD"]?.currentPrice?.toLocaleString() || animatedPrices["XAU/USD"]?.toLocaleString() || "4,172.90"}</span>
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> -1.72%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Day Range</p>
                          <p className="text-sm font-medium tabular-nums">4,139 - 4,233</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">52W Range</p>
                          <p className="text-sm font-medium tabular-nums">3,250 - 5,626</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Volume</p>
                          <p className="text-sm font-medium">73,110</p>
                        </div>
                      </div>
                    </>
                  ) : selectedPair === "ETH/USD" ? (
                    <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                              <span className="text-lg">⟠</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">ETH/USD</h3>
                              <p className="text-xs text-slate-500">Ethereum</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLoadingData && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Sell
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <span className="text-2xl font-bold tabular-nums">${liveData["ETH/USD"]?.currentPrice?.toLocaleString() || animatedPrices["ETH/USD"]?.toLocaleString() || "3,512.00"}</span>
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" /> -2.14%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Day Range</p>
                          <p className="text-sm font-medium tabular-nums">3,450 - 3,620</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">52W Range</p>
                          <p className="text-sm font-medium tabular-nums">2,200 - 4,100</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Volume</p>
                          <p className="text-sm font-medium">18.2B</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400/20 to-amber-500/20 flex items-center justify-center border border-white/5">
                              <span className="text-lg">₿</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">BTC/USD</h3>
                              <p className="text-xs text-slate-500">Bitcoin</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLoadingData && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Buy
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <span className="text-2xl font-bold tabular-nums">${liveData["BTC/USD"]?.currentPrice?.toLocaleString() || animatedPrices["BTC/USD"]?.toLocaleString() || "104,850"}</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> +1.32%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">Day Range</p>
                          <p className="text-sm font-medium tabular-nums">103,200 - 106,100</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">52W Range</p>
                          <p className="text-sm font-medium tabular-nums">58,800 - 112,000</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-wider text-slate-600">RSI (14)</p>
                          <p className="text-sm font-medium text-amber-400">58 Neutral</p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Divergence Signals Grid */}
              <div className="bg-[#0E1223] border border-white/5 rounded-lg">
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    All Divergence Signals
                  </h3>
                  <span className="text-xs text-slate-600">{filteredSetups.length} active</span>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredSetups.map((setup, i) => (
                    <motion.div
                      key={setup.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      onClick={() => setActiveTab("trades")}
                      className="flex items-center justify-between p-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getDirectionColor(
                            setup.direction
                          )} flex items-center justify-center`}
                        >
                          {setup.direction === "BUY" ? (
                            <TrendingUp className="w-4 h-4 text-white" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">{setup.pair}</p>
                            <span className={`px-1.5 py-0.5 rounded text-sm font-medium border ${getDivergenceBadge(setup.divergenceType)}`}>
                              {setup.divergenceType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {setup.signalMeaning} • {setup.trendContext}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-600">Probability</p>
                          <p className={`text-xs font-bold tabular-nums ${
                            setup.probability >= 70 ? "text-emerald-400" : setup.probability >= 60 ? "text-amber-400" : "text-slate-400"
                          }`}>
                            {setup.probability}%
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-600">Target</p>
                          <p className="text-xs font-mono tabular-nums text-emerald-400">
                            {setup.takeProfit1}
                          </p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TRADES TAB */}
          {activeTab === "trades" && (
            <motion.div key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <h2 className="text-lg font-bold mr-4">Trade Setups</h2>
                <div className="flex gap-1 flex-wrap">
                  {["ALL", "Regular Bullish", "Regular Bearish", "Hidden Bullish", "Hidden Bearish"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedType === t ? "bg-white/10 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {t === "ALL" ? "All Types" : t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredSetups.map((setup, index) => (
                  <motion.div
                    key={setup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className={`bg-[#0E1223] border rounded-lg overflow-hidden ${getDivergenceColor(setup.divergenceType)}`}
                  >
                    {/* Header */}
                    <div className="p-4 pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getDirectionColor(setup.direction)} flex items-center justify-center`}>
                            {setup.direction === "BUY" ? (
                              <TrendingUp className="w-5 h-5 text-white" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold">{setup.pair}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${setup.direction === "BUY" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                                {setup.direction}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-sm font-medium border ${getDivergenceBadge(setup.divergenceType)}`}>
                                {setup.divergenceType}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-sm font-medium border ${getConfidenceColor(setup.confidence)}`}>
                                {setup.confidence}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {setup.timeframe} • {setup.signalMeaning} • {setup.trendContext}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm uppercase tracking-wider text-slate-600">Current</p>
                          <p className="text-sm font-mono font-bold tabular-nums">{setup.currentPrice}</p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed mb-3">{setup.analysis}</p>

                      {/* Price Action & MACD Behavior */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <div className="bg-[#080B14] rounded-lg p-2">
                          <p className="text-sm uppercase tracking-wider text-slate-600 mb-0.5">Price Action</p>
                          <p className="text-xs text-slate-300">{setup.priceAction}</p>
                        </div>
                        <div className="bg-[#080B14] rounded-lg p-2">
                          <p className="text-sm uppercase tracking-wider text-slate-600 mb-0.5">MACD Behavior</p>
                          <p className="text-xs text-slate-300">{setup.macdBehavior}</p>
                        </div>
                        <div className="bg-[#080B14] rounded-lg p-2">
                          <p className="text-sm uppercase tracking-wider text-slate-600 mb-0.5">Confirmation</p>
                          <p className="text-xs text-slate-300">{setup.confirmation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Probability & Signal */}
                    <div className="px-4 pb-3">
                      <div className="bg-[#080B14] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-wider text-slate-500">Win Probability</span>
                          <span className={`text-lg font-bold tabular-nums ${
                            setup.probability >= 70 ? "text-emerald-400" : setup.probability >= 60 ? "text-amber-400" : "text-slate-400"
                          }`}>
                            {setup.probability}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#141824] rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              setup.probability >= 70 ? "bg-emerald-500" : setup.probability >= 60 ? "bg-amber-500" : "bg-slate-500"
                            }`}
                            style={{ width: `${setup.probability}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-sm uppercase tracking-wider text-slate-600">Win Rate</p>
                            <p className="text-xs font-bold text-emerald-400">{setup.winRate}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm uppercase tracking-wider text-slate-600">Expected</p>
                            <p className="text-xs font-bold text-cyan-400">{setup.expectedReturn}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm uppercase tracking-wider text-slate-600">Risk</p>
                            <p className="text-xs font-bold text-rose-400">{setup.riskAmount}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trade Levels */}
                    <div className="px-3 sm:px-4 pb-3">
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-[#080B14] rounded-lg p-2.5 sm:p-3">
                        <div>
                          <p className="text-sm sm:text-base uppercase tracking-wider text-slate-600 mb-1">Entry</p>
                          <p className="text-sm sm:text-base font-mono font-bold tabular-nums">{setup.entry}</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base uppercase tracking-wider text-slate-600 mb-1">Stop Loss</p>
                          <p className="text-sm sm:text-base font-mono font-bold tabular-nums text-rose-400">{setup.stopLoss}</p>
                          <p className="text-sm sm:text-base text-slate-600 tabular-nums">
                            {getPips(setup.entry, setup.stopLoss, setup.pair)} {setup.pair.includes("XAU") || setup.pair.includes("BTC") || setup.pair.includes("ETH") ? "pts" : "pips"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base uppercase tracking-wider text-slate-600 mb-1">TP1</p>
                          <p className="text-sm sm:text-base font-mono font-bold tabular-nums text-emerald-400">{setup.takeProfit1}</p>
                          <p className="text-sm sm:text-base text-slate-600 tabular-nums">
                            +{getPips(setup.entry, setup.takeProfit1, setup.pair)} {setup.pair.includes("XAU") || setup.pair.includes("BTC") || setup.pair.includes("ETH") ? "pts" : "pips"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base uppercase tracking-wider text-slate-600 mb-1">TP2</p>
                          <p className="text-sm sm:text-base font-mono font-bold tabular-nums text-emerald-400">{setup.takeProfit2}</p>
                          <p className="text-sm sm:text-base text-slate-600 tabular-nums">
                            +{getPips(setup.entry, setup.takeProfit2, setup.pair)} {setup.pair.includes("XAU") || setup.pair.includes("BTC") || setup.pair.includes("ETH") ? "pts" : "pips"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base uppercase tracking-wider text-slate-600 mb-1">R:R</p>
                          <p className="text-sm sm:text-base font-mono font-bold tabular-nums text-amber-400">
                            1:{getRR(setup.entry, setup.stopLoss, setup.takeProfit1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Bar */}
                    <div className="px-4 pb-3">
                      <div className="relative h-1.5 bg-[#080B14] rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-rose-500/60 rounded-l-full"
                          style={{
                            width: `${(Math.abs(setup.entry - setup.stopLoss) / (Math.abs(setup.takeProfit2 - setup.entry) + Math.abs(setup.entry - setup.stopLoss))) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 h-full bg-emerald-500/60 rounded-r-full"
                          style={{
                            left: `${(Math.abs(setup.entry - setup.stopLoss) / (Math.abs(setup.takeProfit2 - setup.entry) + Math.abs(setup.entry - setup.stopLoss))) * 100}%`,
                            width: `${(Math.abs(setup.takeProfit2 - setup.entry) / (Math.abs(setup.takeProfit2 - setup.entry) + Math.abs(setup.entry - setup.stopLoss))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-200 mb-0.5">Risk Disclaimer</p>
                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    Educational analysis based on MACD divergence patterns. Trading involves substantial risk of loss. Never risk more than 1-2% of your account per trade. Past performance does not guarantee future results.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* LEARN TAB */}
          {activeTab === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4">
                <h2 className="text-lg font-bold">MACD Divergence Masterclass</h2>
                <p className="text-xs text-slate-500">
                  Master Regular & Hidden divergences for reversal and continuation signals
                </p>
              </div>

              {/* Video */}
              <div className="mb-4">
                {!videoPlaying ? (
                  <div
                    className="relative group cursor-pointer bg-[#0E1223] border border-white/5 rounded-lg overflow-hidden"
                    onClick={() => {
                      setVideoPlaying(true);
                      setTimeout(() => videoRef.current?.play(), 0);
                    }}
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-[#0a0e1a] via-[#0E1223] to-[#0a0e1a] flex items-center justify-center">
                      {/* Background pattern */}
                      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="20" x2="20" y2="60" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="20" y1="60" x2="35" y2="30" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="35" y1="30" x2="50" y2="70" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="50" y1="70" x2="65" y2="25" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="65" y1="25" x2="80" y2="55" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="80" y1="55" x2="100" y2="15" stroke="#10b981" strokeWidth="0.3"/>
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.2" strokeDasharray="2"/>
                        <line x1="0" y1="80" x2="20" y2="40" stroke="#3b82f6" strokeWidth="0.3"/>
                        <line x1="20" y1="40" x2="35" y2="65" stroke="#3b82f6" strokeWidth="0.3"/>
                        <line x1="35" y1="65" x2="50" y2="35" stroke="#3b82f6" strokeWidth="0.3"/>
                        <line x1="50" y1="35" x2="65" y2="70" stroke="#3b82f6" strokeWidth="0.3"/>
                        <line x1="65" y1="70" x2="80" y2="45" stroke="#3b82f6" strokeWidth="0.3"/>
                        <line x1="80" y1="45" x2="100" y2="80" stroke="#3b82f6" strokeWidth="0.3"/>
                      </svg>

                      {/* Title text */}
                      <div className="absolute top-6 left-6 right-6 text-left z-10">
                        <p className="text-xs uppercase tracking-wider text-emerald-400 mb-1">Video Tutorial</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">MACD Divergence Masterclass</h3>
                        <p className="text-xs sm:text-sm text-slate-400">Learn all 4 divergence types in 2 minutes</p>
                      </div>

                      {/* Play button */}
                      <div className="relative z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-4 right-4 bg-black/70 px-2 py-1 rounded text-xs text-white z-10">
                        1:53
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0E1223] border border-white/5 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      className="w-full aspect-video"
                      onEnded={() => setVideoPlaying(false)}
                    >
                      <source src="/macd-divergence.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>

              {/* Key Difference */}
              <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 rounded-lg p-4 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
                  Key Difference: Regular vs Hidden
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-400 mb-1">Regular Divergence</p>
                    <p className="text-xs text-slate-400">Signals REVERSAL — Trend may be ending</p>
                    <p className="text-xs text-slate-500 mt-1">Use at support/resistance for counter-trend entries</p>
                  </div>
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-cyan-400 mb-1">Hidden Divergence</p>
                    <p className="text-xs text-slate-400">Signals CONTINUATION — Trend resuming after pullback</p>
                    <p className="text-xs text-slate-500 mt-1">Use during pullbacks for trend-following entries</p>
                  </div>
                </div>
              </div>

              {/* 4 Divergence Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {divergenceGuide.map((div, index) => {
                  const Icon = div.icon;
                  const colorMap: Record<string, string> = {
                    emerald: "bg-emerald-500/10 text-emerald-400",
                    rose: "bg-rose-500/10 text-rose-400",
                    cyan: "bg-cyan-500/10 text-cyan-400",
                    orange: "bg-orange-500/10 text-orange-400",
                  };
                  const signalColorMap: Record<string, string> = {
                    BUY: "bg-emerald-500/20 text-emerald-400",
                    SELL: "bg-rose-500/20 text-rose-400",
                  };

                  return (
                    <motion.div
                      key={div.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="bg-[#0E1223] border border-white/5 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[div.color]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{div.type} Divergence</h3>
                          <p className="text-xs text-slate-500">{div.meaning} • {div.reliability}</p>
                        </div>
                      </div>
                      {/* Mini chart */}
                      <div className="bg-[#080B14] rounded-lg p-2 mb-3">
                        <svg viewBox="0 0 280 80" className="w-full h-auto">
                          <line x1="0" y1="40" x2="280" y2="40" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3"/>
                          <text x="4" y="10" fill="#475569" fontSize="6" fontFamily="monospace">Price</text>
                          <text x="4" y="50" fill="#475569" fontSize="6" fontFamily="monospace">MACD</text>
                          {div.type === "Regular Bullish" && (
                            <>
                              <polyline points="15,18 50,22 85,15 120,28 155,18 190,32 225,22 260,35" fill="none" stroke="#f87171" strokeWidth="1.2"/>
                              <circle cx="120" cy="28" r="2.5" fill="#f87171"/>
                              <circle cx="225" cy="22" r="2.5" fill="#f87171"/>
                              <line x1="120" y1="26" x2="225" y2="20" stroke="#f87171" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="36" fill="#f87171" fontSize="5" fontFamily="monospace">LL</text>
                              <text x="220" y="30" fill="#f87171" fontSize="5" fontFamily="monospace">LL</text>
                              <polyline points="15,65 50,68 85,63 120,70 155,65 190,60 225,55 260,50" fill="none" stroke="#10b981" strokeWidth="1.2"/>
                              <circle cx="120" cy="70" r="2.5" fill="#10b981"/>
                              <circle cx="225" cy="55" r="2.5" fill="#10b981"/>
                              <line x1="120" y1="68" x2="225" y2="53" stroke="#10b981" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="78" fill="#10b981" fontSize="5" fontFamily="monospace">HL</text>
                              <text x="220" y="63" fill="#10b981" fontSize="5" fontFamily="monospace">HL</text>
                              <text x="248" y="75" fill="#10b981" fontSize="6" fontWeight="bold" fontFamily="monospace">BUY</text>
                            </>
                          )}
                          {div.type === "Regular Bearish" && (
                            <>
                              <polyline points="15,32 50,25 85,30 120,15 155,22 190,10 225,18 260,12" fill="none" stroke="#f87171" strokeWidth="1.2"/>
                              <circle cx="120" cy="15" r="2.5" fill="#f87171"/>
                              <circle cx="225" cy="18" r="2.5" fill="#f87171"/>
                              <line x1="120" y1="13" x2="225" y2="16" stroke="#f87171" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="10" fill="#f87171" fontSize="5" fontFamily="monospace">HH</text>
                              <text x="220" y="26" fill="#f87171" fontSize="5" fontFamily="monospace">HH</text>
                              <polyline points="15,55 50,52 85,56 120,48 155,54 190,50 225,60 260,65" fill="none" stroke="#10b981" strokeWidth="1.2"/>
                              <circle cx="120" cy="48" r="2.5" fill="#10b981"/>
                              <circle cx="225" cy="60" r="2.5" fill="#10b981"/>
                              <line x1="120" y1="50" x2="225" y2="58" stroke="#10b981" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="44" fill="#10b981" fontSize="5" fontFamily="monospace">LH</text>
                              <text x="220" y="68" fill="#10b981" fontSize="5" fontFamily="monospace">LH</text>
                              <text x="242" y="75" fill="#f87171" fontSize="6" fontWeight="bold" fontFamily="monospace">SELL</text>
                            </>
                          )}
                          {div.type === "Hidden Bullish" && (
                            <>
                              <polyline points="15,28 50,22 85,30 120,18 155,25 190,14 225,20 260,12" fill="none" stroke="#f87171" strokeWidth="1.2"/>
                              <circle cx="85" cy="30" r="2.5" fill="#f87171"/>
                              <circle cx="190" cy="14" r="2.5" fill="#f87171"/>
                              <line x1="85" y1="28" x2="190" y2="16" stroke="#f87171" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="80" y="38" fill="#f87171" fontSize="5" fontFamily="monospace">HL</text>
                              <text x="185" y="10" fill="#f87171" fontSize="5" fontFamily="monospace">HL</text>
                              <polyline points="15,62 50,66 85,64 120,72 155,68 190,74 225,70 260,76" fill="none" stroke="#06b6d4" strokeWidth="1.2"/>
                              <circle cx="120" cy="72" r="2.5" fill="#06b6d4"/>
                              <circle cx="260" cy="76" r="2.5" fill="#06b6d4"/>
                              <line x1="120" y1="70" x2="260" y2="74" stroke="#06b6d4" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="78" fill="#06b6d4" fontSize="5" fontFamily="monospace">LL</text>
                              <text x="248" y="78" fill="#06b6d4" fontSize="5" fontFamily="monospace">LL</text>
                              <text x="238" y="10" fill="#06b6d4" fontSize="6" fontWeight="bold" fontFamily="monospace">BUY</text>
                            </>
                          )}
                          {div.type === "Hidden Bearish" && (
                            <>
                              <polyline points="15,15 50,22 85,18 120,28 155,24 190,32 225,28 260,35" fill="none" stroke="#f87171" strokeWidth="1.2"/>
                              <circle cx="85" cy="18" r="2.5" fill="#f87171"/>
                              <circle cx="190" cy="32" r="2.5" fill="#f87171"/>
                              <line x1="85" y1="20" x2="190" y2="30" stroke="#f87171" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="80" y="12" fill="#f87171" fontSize="5" fontFamily="monospace">LH</text>
                              <text x="185" y="40" fill="#f87171" fontSize="5" fontFamily="monospace">LH</text>
                              <polyline points="15,72 50,66 85,68 120,58 155,62 190,52 225,56 260,48" fill="none" stroke="#f97316" strokeWidth="1.2"/>
                              <circle cx="120" cy="58" r="2.5" fill="#f97316"/>
                              <circle cx="260" cy="48" r="2.5" fill="#f97316"/>
                              <line x1="120" y1="60" x2="260" y2="50" stroke="#f97316" strokeWidth="0.6" strokeDasharray="2"/>
                              <text x="115" y="54" fill="#f97316" fontSize="5" fontFamily="monospace">HH</text>
                              <text x="248" y="44" fill="#f97316" fontSize="5" fontFamily="monospace">HH</text>
                              <text x="238" y="10" fill="#f97316" fontSize="6" fontWeight="bold" fontFamily="monospace">SELL</text>
                            </>
                          )}
                        </svg>
                      </div>
                      <p className="text-sm text-slate-300 font-mono mb-2">{div.description}</p>
                      <p className="text-xs text-slate-500 mb-2">{div.trendContext}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${signalColorMap[div.signal]}`}>
                        Signal: {div.signal}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Visual Examples */}
              <div className="bg-[#0E1223] border border-white/5 rounded-lg p-4 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Visual Pattern Reference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Bullish */}
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-emerald-400 mb-2">Regular Bullish Divergence</p>
                    <svg viewBox="0 0 320 140" className="w-full h-auto">
                      <defs>
                        <linearGradient id="priceGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {/* Divider */}
                      <line x1="0" y1="70" x2="320" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="4"/>
                      {/* Labels */}
                      <text x="4" y="12" fill="#64748b" fontSize="7" fontFamily="monospace">PRICE</text>
                      <text x="4" y="82" fill="#64748b" fontSize="7" fontFamily="monospace">MACD</text>
                      {/* Price: Lower Lows */}
                      <polyline points="20,20 60,28 100,18 140,35 180,22 220,42 260,28 300,48" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                      <circle cx="140" cy="35" r="3" fill="#f87171" opacity="0.6"/>
                      <circle cx="260" cy="28" r="3" fill="#f87171" opacity="0.6"/>
                      <text x="130" y="30" fill="#f87171" fontSize="6" fontFamily="monospace">LL</text>
                      <text x="250" y="24" fill="#f87171" fontSize="6" fontFamily="monospace">LL</text>
                      <line x1="140" y1="38" x2="260" y2="31" stroke="#f87171" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="185" y="40" fill="#f87171" fontSize="5" fontFamily="monospace" opacity="0.7">↘ falling</text>
                      {/* MACD: Higher Lows */}
                      <polyline points="20,110 60,115 100,108 140,120 180,112 220,100 260,95 300,88" fill="none" stroke="#10b981" strokeWidth="1.5"/>
                      <circle cx="140" cy="120" r="3" fill="#10b981" opacity="0.6"/>
                      <circle cx="260" cy="95" r="3" fill="#10b981" opacity="0.6"/>
                      <text x="130" y="130" fill="#10b981" fontSize="6" fontFamily="monospace">HL</text>
                      <text x="250" y="108" fill="#10b981" fontSize="6" fontFamily="monospace">HL</text>
                      <line x1="140" y1="117" x2="260" y2="92" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="185" y="118" fill="#10b981" fontSize="5" fontFamily="monospace" opacity="0.7">↗ rising</text>
                      {/* Signal arrow */}
                      <text x="270" y="135" fill="#10b981" fontSize="7" fontWeight="bold" fontFamily="monospace">BUY ▲</text>
                    </svg>
                    <div className="text-sm font-mono text-slate-500 mt-1 space-y-0.5">
                      <p>Price: LL → LL (Lower Lows)</p>
                      <p>MACD: HL → HL (Higher Lows)</p>
                      <p className="text-emerald-400">Signal: BUY (Reversal Up)</p>
                    </div>
                  </div>
                  {/* Regular Bearish */}
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-rose-400 mb-2">Regular Bearish Divergence</p>
                    <svg viewBox="0 0 320 140" className="w-full h-auto">
                      <line x1="0" y1="70" x2="320" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="4"/>
                      <text x="4" y="12" fill="#64748b" fontSize="7" fontFamily="monospace">PRICE</text>
                      <text x="4" y="82" fill="#64748b" fontSize="7" fontFamily="monospace">MACD</text>
                      {/* Price: Higher Highs */}
                      <polyline points="20,48 60,38 100,45 140,22 180,32 220,15 260,28 300,18" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                      <circle cx="140" cy="22" r="3" fill="#f87171" opacity="0.6"/>
                      <circle cx="260" cy="28" r="3" fill="#f87171" opacity="0.6"/>
                      <text x="130" y="16" fill="#f87171" fontSize="6" fontFamily="monospace">HH</text>
                      <text x="250" y="40" fill="#f87171" fontSize="6" fontFamily="monospace">HH</text>
                      <line x1="140" y1="19" x2="260" y2="25" stroke="#f87171" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="185" y="18" fill="#f87171" fontSize="5" fontFamily="monospace" opacity="0.7">↗ rising</text>
                      {/* MACD: Lower Highs */}
                      <polyline points="20,90 60,85 100,92 140,78 180,88 220,82 260,98 300,105" fill="none" stroke="#10b981" strokeWidth="1.5"/>
                      <circle cx="140" cy="78" r="3" fill="#10b981" opacity="0.6"/>
                      <circle cx="260" cy="98" r="3" fill="#10b981" opacity="0.6"/>
                      <text x="130" y="72" fill="#10b981" fontSize="6" fontFamily="monospace">LH</text>
                      <text x="250" y="110" fill="#10b981" fontSize="6" fontFamily="monospace">LH</text>
                      <line x1="140" y1="75" x2="260" y2="95" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="185" y="78" fill="#10b981" fontSize="5" fontFamily="monospace" opacity="0.7">↘ falling</text>
                      <text x="270" y="135" fill="#f87171" fontSize="7" fontWeight="bold" fontFamily="monospace">SELL ▼</text>
                    </svg>
                    <div className="text-sm font-mono text-slate-500 mt-1 space-y-0.5">
                      <p>Price: HH → HH (Higher Highs)</p>
                      <p>MACD: LH → LH (Lower Highs)</p>
                      <p className="text-rose-400">Signal: SELL (Reversal Down)</p>
                    </div>
                  </div>
                  {/* Hidden Bullish */}
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-cyan-400 mb-2">Hidden Bullish Divergence</p>
                    <svg viewBox="0 0 320 140" className="w-full h-auto">
                      <line x1="0" y1="70" x2="320" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="4"/>
                      <text x="4" y="12" fill="#64748b" fontSize="7" fontFamily="monospace">PRICE</text>
                      <text x="4" y="82" fill="#64748b" fontSize="7" fontFamily="monospace">MACD</text>
                      {/* Price: Higher Lows (uptrend) */}
                      <polyline points="20,40 60,30 100,42 140,28 180,38 220,22 260,32 300,20" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                      <circle cx="100" cy="42" r="3" fill="#f87171" opacity="0.6"/>
                      <circle cx="220" cy="22" r="3" fill="#f87171" opacity="0.6"/>
                      <text x="90" y="52" fill="#f87171" fontSize="6" fontFamily="monospace">HL</text>
                      <text x="210" y="16" fill="#f87171" fontSize="6" fontFamily="monospace">HL</text>
                      <line x1="100" y1="39" x2="220" y2="25" stroke="#f87171" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="150" y="36" fill="#f87171" fontSize="5" fontFamily="monospace" opacity="0.7">↗ rising</text>
                      {/* MACD: Lower Lows */}
                      <polyline points="20,105 60,112 100,108 140,120 180,115 220,125 260,118 300,130" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
                      <circle cx="140" cy="120" r="3" fill="#06b6d4" opacity="0.6"/>
                      <circle cx="300" cy="130" r="3" fill="#06b6d4" opacity="0.6"/>
                      <text x="130" y="132" fill="#06b6d4" fontSize="6" fontFamily="monospace">LL</text>
                      <text x="285" y="138" fill="#06b6d4" fontSize="6" fontFamily="monospace">LL</text>
                      <line x1="140" y1="117" x2="300" y2="127" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="210" y="128" fill="#06b6d4" fontSize="5" fontFamily="monospace" opacity="0.7">↘ falling</text>
                      <text x="270" y="135" fill="#06b6d4" fontSize="7" fontWeight="bold" fontFamily="monospace">BUY ▲</text>
                    </svg>
                    <div className="text-sm font-mono text-slate-500 mt-1 space-y-0.5">
                      <p>Price: HL → HL (Higher Lows)</p>
                      <p>MACD: LL → LL (Lower Lows)</p>
                      <p className="text-cyan-400">Signal: BUY (Uptrend Continues)</p>
                    </div>
                  </div>
                  {/* Hidden Bearish */}
                  <div className="bg-[#080B14] rounded-lg p-3">
                    <p className="text-sm font-semibold text-orange-400 mb-2">Hidden Bearish Divergence</p>
                    <svg viewBox="0 0 320 140" className="w-full h-auto">
                      <line x1="0" y1="70" x2="320" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="4"/>
                      <text x="4" y="12" fill="#64748b" fontSize="7" fontFamily="monospace">PRICE</text>
                      <text x="4" y="82" fill="#64748b" fontSize="7" fontFamily="monospace">MACD</text>
                      {/* Price: Lower Highs (downtrend) */}
                      <polyline points="20,20 60,28 100,22 140,35 180,30 220,42 260,38 300,48" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                      <circle cx="100" cy="22" r="3" fill="#f87171" opacity="0.6"/>
                      <circle cx="220" cy="42" r="3" fill="#f87171" opacity="0.6"/>
                      <text x="90" y="16" fill="#f87171" fontSize="6" fontFamily="monospace">LH</text>
                      <text x="210" y="52" fill="#f87171" fontSize="6" fontFamily="monospace">LH</text>
                      <line x1="100" y1="25" x2="220" y2="39" stroke="#f87171" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="150" y="32" fill="#f87171" fontSize="5" fontFamily="monospace" opacity="0.7">↘ falling</text>
                      {/* MACD: Higher Highs */}
                      <polyline points="20,128 60,122 100,125 140,110 180,118 220,105 260,112 300,95" fill="none" stroke="#f97316" strokeWidth="1.5"/>
                      <circle cx="140" cy="110" r="3" fill="#f97316" opacity="0.6"/>
                      <circle cx="300" cy="95" r="3" fill="#f97316" opacity="0.6"/>
                      <text x="130" y="104" fill="#f97316" fontSize="6" fontFamily="monospace">HH</text>
                      <text x="285" y="88" fill="#f97316" fontSize="6" fontFamily="monospace">HH</text>
                      <line x1="140" y1="113" x2="300" y2="98" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3" opacity="0.5"/>
                      <text x="210" y="108" fill="#f97316" fontSize="5" fontFamily="monospace" opacity="0.7">↗ rising</text>
                      <text x="270" y="135" fill="#f97316" fontSize="7" fontWeight="bold" fontFamily="monospace">SELL ▼</text>
                    </svg>
                    <div className="text-sm font-mono text-slate-500 mt-1 space-y-0.5">
                      <p>Price: LH → LH (Lower Highs)</p>
                      <p>MACD: HH → HH (Higher Highs)</p>
                      <p className="text-orange-400">Signal: SELL (Downtrend Continues)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trading Rules */}
              <div className="bg-[#0E1223] border border-white/5 rounded-lg p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Trading Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { title: "Regular = Reversal", desc: "Trade counter-trend at key support/resistance levels" },
                    { title: "Hidden = Continuation", desc: "Trade with the trend during pullbacks" },
                    { title: "Higher TF = Stronger", desc: "4H and Daily signals are more reliable" },
                    { title: "Wait for MACD Cross", desc: "Don't enter until MACD line crosses signal" },
                    { title: "Volume Confirmation", desc: "Increasing volume on reversal candle confirms" },
                    { title: "Risk:Reward 1:2+", desc: "Minimum 1:2 R:R for profitable trades" },
                  ].map((rule) => (
                    <div key={rule.title} className="bg-[#080B14] rounded-lg p-3">
                      <p className="text-sm font-semibold mb-1">{rule.title}</p>
                      <p className="text-xs text-slate-500">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 mt-8 py-4 hidden md:block">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-600">MACD Divergence Trading Strategy • Educational Only</p>
          <p className="text-xs text-slate-600">Data: Yahoo Finance{lastFetchTime ? ` • Last scan: ${lastFetchTime}` : ""}</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#020617]/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {(
            [
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "trades", label: "Trades", icon: Target },
              { id: "learn", label: "Guide", icon: BookOpen },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "text-white bg-white/10"
                  : "text-slate-500"
              }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <AiChat />
    </div>
  );
}
