# MACD Divergence Trading Strategy

A Next.js web application that identifies and displays MACD (Moving Average Convergence Divergence) divergence patterns across multiple financial instruments, with an AI-powered chat assistant for trade analysis.

## Features

### Dashboard
- Real-time overview of all active divergence signals
- Summary cards showing signal counts by type (Regular Bullish, Regular Bearish, Hidden Bullish, Hidden Bearish)
- Price overview for the selected pair with market data (day range, 52W range, RSI)
- Animated price ticker with live price simulation
- Quick navigation to detailed trade setups

### Trade Setups
- 16 divergence setups across 4 pairs: AUD/USD, XAU/USD (Gold), ETH/USD, BTC/USD
- 4 divergence types per pair: Regular Bullish, Regular Bearish, Hidden Bullish, Hidden Bearish
- Each setup includes:
  - Entry, Stop Loss, Take Profit 1 & 2 levels
  - Win probability and risk-reward ratio
  - Price action analysis and MACD behavior description
  - Confirmation criteria
  - Confidence level (HIGH / MEDIUM / LOW)
- Filter by divergence type
- Visual risk bar showing SL vs TP distance

### Divergence Guide
- Educational content explaining all 4 divergence types
- SVG visual pattern references for each type
- Regular vs Hidden divergence comparison
- Trading rules and best practices

### AI Chat Assistant
- Floating chat widget accessible from the dashboard
- Powered by NVIDIA Kimi K2.6 model via API
- Can answer questions about:
  - Current trade setups and recommendations
  - MACD divergence patterns (Regular vs Hidden)
  - Risk management strategies
  - Entry/exit timing
  - Pair-specific analysis (BTC, ETH, Gold, AUD)
- Quick-action buttons for common questions
- Full conversation history within the session

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI Backend:** NVIDIA API (Kimi K2.6 model)
- **HTTP Client:** Axios

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # AI chat API endpoint (NVIDIA proxy)
│   ├── globals.css               # Global styles and Tailwind config
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
├── components/
│   ├── ai-chat.tsx               # AI chat widget component
│   └── ui/
│       └── button.tsx            # Base button component
└── lib/
    └── utils.ts                  # Utility functions
```

## Setup

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- NVIDIA API key (get one at [build.nvidia.com](https://build.nvidia.com))

### Installation

```bash
git clone <repository-url>
cd macd-divergence-trading-strategy
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then fill in your NVIDIA API key:

```
NVIDIA_API_KEY=your_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1/chat/completions
NVIDIA_MODEL=moonshotai/kimi-k2.6
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## Divergence Types Explained

| Type | Pattern | Signal | Context |
|------|---------|--------|---------|
| Regular Bullish | Price LL, MACD HL | BUY | Reversal in downtrend |
| Regular Bearish | Price HH, MACD LH | SELL | Reversal in uptrend |
| Hidden Bullish | Price HL, MACD LL | BUY | Continuation in uptrend |
| Hidden Bearish | Price LH, MACD HH | SELL | Continuation in downtrend |

## API Endpoints

### POST /api/chat

Sends messages to the AI assistant and returns a response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What is the best BTC setup?" }
  ]
}
```

**Response:**
```json
{
  "reply": "The best BTC setup is..."
}
```

## Disclaimer

This application is for **educational purposes only**. Trading involves substantial risk of loss. Never risk more than 1-2% of your account per trade. Past performance does not guarantee future results.

## License

MIT
