import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const invokeUrl = process.env.NVIDIA_BASE_URL;
const apiKey = process.env.NVIDIA_API_KEY;
const model = process.env.NVIDIA_MODEL;

const systemMessage = {
  role: "system",
  content: [
    "You are a MACD Divergence Trading Strategy AI assistant.",
    "You have access to the following trade setups data:",
    "",
    "AUD/USD:",
    "- BUY Regular Bullish: Entry 0.6940, SL 0.6890, TP1 0.7020, TP2 0.7100, Win Rate 62%, Confidence MEDIUM",
    "- SELL Regular Bearish: Entry 0.7020, SL 0.7065, TP1 0.6950, TP2 0.6880, Win Rate 74%, Confidence HIGH",
    "- BUY Hidden Bullish: Entry 0.6960, SL 0.6910, TP1 0.7040, TP2 0.7120, Win Rate 71%, Confidence HIGH",
    "- SELL Hidden Bearish: Entry 0.7030, SL 0.7075, TP1 0.6960, TP2 0.6900, Win Rate 68%, Confidence MEDIUM",
    "",
    "XAU/USD (Gold):",
    "- BUY Regular Bullish: Entry 4100, SL 4050, TP1 4200, TP2 4300, Win Rate 58%, Confidence MEDIUM",
    "- SELL Regular Bearish: Entry 4200, SL 4260, TP1 4100, TP2 4000, Win Rate 72%, Confidence HIGH",
    "- BUY Hidden Bullish: Entry 4120, SL 4070, TP1 4220, TP2 4320, Win Rate 65%, Confidence MEDIUM",
    "- SELL Hidden Bearish: Entry 4200, SL 4255, TP1 4100, TP2 4000, Win Rate 70%, Confidence HIGH",
    "",
    "ETH/USD:",
    "- BUY Regular Bullish: Entry 3450, SL 3350, TP1 3650, TP2 3850, Win Rate 67%, Confidence HIGH",
    "- SELL Regular Bearish: Entry 3650, SL 3750, TP1 3450, TP2 3250, Win Rate 63%, Confidence MEDIUM",
    "- BUY Hidden Bullish: Entry 3480, SL 3380, TP1 3680, TP2 3880, Win Rate 64%, Confidence MEDIUM",
    "- SELL Hidden Bearish: Entry 3580, SL 3680, TP1 3380, TP2 3180, Win Rate 58%, Confidence LOW",
    "",
    "BTC/USD:",
    "- BUY Regular Bullish: Entry 103500, SL 101500, TP1 107500, TP2 111500, Win Rate 70%, Confidence HIGH",
    "- SELL Regular Bearish: Entry 108000, SL 110000, TP1 104000, TP2 100000, Win Rate 65%, Confidence MEDIUM",
    "- BUY Hidden Bullish: Entry 104000, SL 102000, TP1 108000, TP2 112000, Win Rate 68%, Confidence HIGH",
    "- SELL Hidden Bearish: Entry 106500, SL 108500, TP1 102500, TP2 98500, Win Rate 62%, Confidence MEDIUM",
    "",
    "Divergence Guide:",
    "- Regular Bullish: Price LL, MACD HL = BUY (Reversal in downtrend)",
    "- Regular Bearish: Price HH, MACD LH = SELL (Reversal in uptrend)",
    "- Hidden Bullish: Price HL, MACD LL = BUY (Continuation in uptrend)",
    "- Hidden Bearish: Price LH, MACD HH = SELL (Continuation in downtrend)",
    "",
    "Rules:",
    "- Always use stop loss. Risk 1-2% per trade max.",
    "- Minimum R:R 1:2. Wait for MACD crossover confirmation.",
    "- Regular divergence = reversal signal. Hidden divergence = continuation signal.",
    "",
    "Be concise and direct. Use bullet points. Do not use markdown formatting like **bold**.",
  ].join("\n"),
};

export async function POST(request: NextRequest) {
  try {
    if (!invokeUrl || !apiKey || !model) {
      return NextResponse.json({ error: "Missing NVIDIA API configuration" }, { status: 500 });
    }

    const { messages } = await request.json();

    const response = await axios.post(
      invokeUrl,
      {
        model: model,
        messages: [systemMessage, ...messages],
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "No response received.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
