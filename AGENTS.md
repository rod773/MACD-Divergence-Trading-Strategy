<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:mt5-mcp-server -->
# MetaTrader 5 MCP Server

`mt5-mcp-server/` contains an MCP server that bridges AI agents to the local MT5 terminal.

## Account
- **Demo**: CapitalPointTrading-Demo, login `52912186`, balance ~$1,537
- **MT5 path**: `C:\Program Files\MetaTrader 5\terminal64.exe`

## Python access (direct)
```python
import sys; sys.path.insert(0, 'mt5-mcp-server')
from mt5client import ensure_initialized
ensure_initialized()
from handlers.symbols import get_rates
rates = get_rates('EURUSD', 'D1', 100)  # list of dicts
```

## Tools (16 total)
| Tool | Description |
|---|---|
| `get_account` | Balance, equity, margin, leverage |
| `get_symbol_info` | Spread, volume constraints, trading hours |
| `get_rates` | OHLCV candles (M1-MN1, up to 10000) |
| `get_ticks` | Recent tick data (bid/ask/last) |
| `get_ticks_range` | Ticks within a Unix timestamp range |
| `get_last_price` | Latest bid/ask tick |
| `find_symbols` | Search for symbols |
| `get_symbol_snapshot` | Combined info + price + recent candles |
| `get_positions` | Open positions |
| `close_position` | Close a position by ticket |
| `modify_position` | Modify SL/TP on a position |
| `create_order` | Place BUY/SELL or pending orders |
| `get_pending_orders` | Pending orders |
| `cancel_order` | Cancel a pending order |
| `get_trade_history` | Recent closed deals |
| `backtest_macd_divergence` | Run MACD divergence backtest on standard OHLCV data |
| `backtest_macd_divergence_ticks` | Run MACD divergence backtest on tick-resampled candles (any timeframe) |

## Strategy Tester limitation
The MQL5 Strategy Tester (for `.mq5` EA files) is GUI-only and cannot be automated via the Python API. Use `backtest_macd_divergence` tool to run the Python backtest engine on any symbol/timeframe instead.
<!-- END:mt5-mcp-server -->
