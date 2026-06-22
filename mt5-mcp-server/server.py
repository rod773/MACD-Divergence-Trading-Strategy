import logging
import os
import sys
from pathlib import Path

from fastmcp import FastMCP

sys.path.insert(0, str(Path(__file__).parent))

from mt5client import ensure_initialized
from handlers import account, symbols, positions, orders, history

logging.basicConfig(level=logging.WARNING)
log = logging.getLogger("mt5mcp")

mcp = FastMCP(
    "MT5 Trading Server",
    instructions=(
        "You have access to a live MetaTrader 5 terminal. "
        "Always call get_account before placing trades to verify margin. "
        "Always call get_symbol_info before placing orders to get volume "
        "constraints (volume_min, volume_max, volume_step, trade_stops_level). "
        "Use get_positions to find ticket numbers before modifying or closing."
    ),
)


def _ensure():
    if not ensure_initialized():
        return {"error": "MT5 terminal not connected"}
    return None


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"readOnlyHint": True})
def get_account() -> dict:
    """Get current trading account information including balance, equity,
    margin, free margin, leverage, and whether trading is allowed. Call
    this before placing trades to verify account state."""
    err = _ensure()
    if err:
        return err
    return account.get_account()


# ---------------------------------------------------------------------------
# Market data
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"readOnlyHint": True})
def get_symbol_info(symbol: str) -> dict:
    """Get detailed information about a trading symbol including spread,
    volume constraints, tick size, tick value, and trading hours.
    Call this before placing orders to check trade_stops_level."""
    err = _ensure()
    if err:
        return err
    return symbols.get_symbol_info(symbol)


@mcp.tool(annotations={"readOnlyHint": True})
def get_rates(symbol: str, timeframe: str = "H1", count: int = 100) -> list:
    """Get OHLCV rates for a symbol. Timeframes: M1, M5, M15, M30, H1, H4, D1, W1, MN1.
    count: number of candles (max 10000)."""
    err = _ensure()
    if err:
        return err
    return symbols.get_rates(symbol, timeframe, count)


@mcp.tool(annotations={"readOnlyHint": True})
def get_last_price(symbol: str) -> dict:
    """Get the latest tick for a symbol including bid, ask, spread, and last time."""
    err = _ensure()
    if err:
        return err
    return symbols.get_last_price(symbol)


@mcp.tool(annotations={"readOnlyHint": True})
def find_symbols(query: str = "") -> list:
    """Search for tradable symbols. Returns up to 50 matches.
    Example: EUR, USD, BTC, #IBM."""
    err = _ensure()
    if err:
        return err
    return symbols.find_symbols(query)


@mcp.tool(annotations={"readOnlyHint": True})
def get_ticks(symbol: str, count: int = 1000) -> list:
    """Get recent tick data (bid, ask, last) for a symbol.
    Useful for spread analysis, market depth, and high-frequency data.
    Returns up to count ticks from the last hour. flags=ALL includes info + trade ticks."""
    err = _ensure()
    if err:
        return err
    return symbols.get_ticks(symbol, min(count, 10000))


@mcp.tool(annotations={"readOnlyHint": True})
def get_ticks_range(symbol: str, from_timestamp: int, to_timestamp: int) -> list:
    """Get tick data within a specific Unix timestamp range (seconds).
    Example: from_timestamp=1719000000, to_timestamp=1719086400.
    Useful for analyzing tick activity during specific events."""
    err = _ensure()
    if err:
        return err
    return symbols.get_ticks_range(symbol, from_timestamp, to_timestamp)


@mcp.tool(annotations={"readOnlyHint": True})
def get_symbol_snapshot(symbol: str, timeframe: str = "H1") -> dict:
    """Get a snapshot of a symbol including info, last price, and recent candles.
    Useful for AI analysis."""
    err = _ensure()
    if err:
        return err
    return symbols.get_symbol_snapshot(symbol, timeframe)


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"readOnlyHint": True})
def get_positions(symbol: str = "") -> list:
    """Get all open positions, optionally filtered by symbol.
    Returns: ticket, symbol, type, volume, price_open, sl, tp, profit, etc."""
    err = _ensure()
    if err:
        return err
    return positions.get_positions(symbol)


@mcp.tool(annotations={"destructiveHint": True})
def close_position(ticket: int, volume: float | None = None,
                   deviation: int = 20) -> dict:
    """Close an open position entirely (default) or partially.
    Use get_positions first to get the ticket number.
    retcode 10009 = success."""
    err = _ensure()
    if err:
        return err
    return positions.close_position(ticket, volume, deviation)


@mcp.tool(annotations={"destructiveHint": True})
def modify_position(ticket: int, sl: float | None = None,
                    tp: float | None = None) -> dict:
    """Modify stop loss and/or take profit on an open position.
    Use get_positions first to get the ticket number."""
    err = _ensure()
    if err:
        return err
    return positions.modify_position(ticket, sl, tp)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"destructiveHint": True})
def create_order(symbol: str, type: str, volume: float,
                 price: float | None = None, sl: float | None = None,
                 tp: float | None = None, deviation: int = 20,
                 magic: int = 0, comment: str = "",
                 type_filling: str = "IOC") -> dict:
    """Place a trade order. type: BUY, SELL, BUY_LIMIT, SELL_LIMIT, etc.
    For market orders (BUY/SELL), price is auto-filled if not specified.
    For pending orders (LIMIT/STOP), price is required.
    Set magic to identify orders from this AI agent.
    retcode 10009 = success."""
    err = _ensure()
    if err:
        return err
    return orders.create_order(symbol, type, volume, price, sl, tp,
                               deviation, magic, comment, type_filling)


@mcp.tool(annotations={"readOnlyHint": True})
def get_pending_orders(symbol: str = "") -> list:
    """Get all pending orders, optionally filtered by symbol."""
    err = _ensure()
    if err:
        return err
    return orders.get_pending_orders(symbol)


@mcp.tool(annotations={"destructiveHint": True})
def cancel_order(ticket: int) -> dict:
    """Cancel/delete a pending order by ticket number."""
    err = _ensure()
    if err:
        return err
    return orders.cancel_order(ticket)


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"readOnlyHint": True})
def get_trade_history(days: int = 30) -> list:
    """Get recent trade history for the last N days.
    Returns closed deals with ticket, symbol, type, volume, price, profit, etc."""
    err = _ensure()
    if err:
        return err
    import datetime
    to_date = datetime.datetime.now()
    from_date = to_date - datetime.timedelta(days=days)
    return history.get_trade_history(from_date, to_date)


# ---------------------------------------------------------------------------
# MACD Divergence backtest
# ---------------------------------------------------------------------------

@mcp.tool(annotations={"readOnlyHint": True})
def backtest_macd_divergence(symbol: str, timeframe: str = "D1",
                             lookback_bars: int = 500,
                             fast_len: int = 12, slow_len: int = 26,
                             signal_len: int = 9,
                             swing_lookback: int = 5,
                             sl_pct: float = 3.0, tp_pct: float = 6.0) -> dict:
    """Run the MACD divergence strategy backtest using standard OHLCV data.
    Returns trade report with win rate, profit factor, etc."""
    err = _ensure()
    if err:
        return err

    sys.path.insert(0, str(Path(__file__).parent.parent))
    from macd_divergences import calc_macd, detect_divergences
    from backtest import run_backtest, BacktestConfig
    import numpy as np

    rates = symbols.get_rates(symbol, timeframe, lookback_bars)
    if isinstance(rates, dict) and "error" in rates:
        return rates
    if not rates:
        return {"error": "No rate data returned"}

    close = np.array([r["close"] for r in rates], dtype=np.float64)
    macd, sig, hist = calc_macd(close, fast_len, slow_len, signal_len)
    divs = detect_divergences(close, macd, lb=swing_lookback)

    cfg = BacktestConfig(
        initial_capital=100_000,
        position_size_pct=1.0,
        sl_pct=sl_pct / 100.0,
        tp_pct=tp_pct / 100.0,
        max_hold_bars=20,
        allow_short=True,
        commission_pct=0.001,
    )

    result = run_backtest(close, macd, divs, cfg=cfg)

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "bars": len(close),
        "divergences_detected": len(divs),
        "trades": result.num_trades,
        "total_return_pct": round(result.total_return_pct, 2),
        "win_rate": round(result.win_rate, 1),
        "profit_factor": round(result.profit_factor, 2),
        "max_drawdown_pct": round(result.max_drawdown_pct, 2),
        "sharpe_ratio": round(result.sharpe_ratio, 2),
        "avg_bars_held": round(result.avg_bars_held, 1),
        "win_count": result.win_count,
        "loss_count": result.loss_count,
        "total_pnl": round(result.total_pnl, 2),
        "divergence_types": _count_div_types(divs),
    }


@mcp.tool(annotations={"readOnlyHint": True})
def backtest_macd_divergence_ticks(symbol: str, bar_minutes: int = 60,
                                   days_back: int = 30,
                                   fast_len: int = 12, slow_len: int = 26,
                                   signal_len: int = 9,
                                   swing_lookback: int = 5,
                                   sl_pct: float = 3.0, tp_pct: float = 6.0) -> dict:
    """Run MACD divergence backtest using tick-resampled candles.
    Downloads raw tick data and builds OHLCV candles at bar_minutes resolution.
    Useful for custom timeframes and more precise price data."""
    err = _ensure()
    if err:
        return err

    sys.path.insert(0, str(Path(__file__).parent.parent))
    from macd_divergences import calc_macd, detect_divergences
    from backtest import run_backtest, BacktestConfig
    import numpy as np
    import pandas as pd
    import MetaTrader5 as mt5
    import datetime

    import handlers.symbols as sym

    # Download ticks
    now = datetime.datetime.now()
    from_dt = now - datetime.timedelta(days=days_back)

    raw_ticks = mt5.copy_ticks_range(symbol, from_dt, now, mt5.COPY_TICKS_ALL)
    if raw_ticks is None or len(raw_ticks) < 100:
        return {"error": f"Insufficient tick data: {len(raw_ticks) if raw_ticks is not None else 0}"}

    # Build DataFrame
    df = pd.DataFrame({
        "time": pd.to_datetime(raw_ticks["time"].astype("int64"), unit="s"),
        "price": np.where(raw_ticks["flags"] & 2, raw_ticks["bid"], raw_ticks["ask"]),
    })
    df = df.set_index("time").sort_index()

    # Resample to OHLCV
    ohlc = df["price"].resample(f"{bar_minutes}min").ohlc()
    ohlc.dropna(inplace=True)

    close = ohlc["close"].to_numpy(dtype=np.float64)
    if len(close) < 30:
        return {"error": f"Too few bars ({len(close)}) after resampling. Try fewer days or shorter bar_minutes."}

    macd, sig, hist = calc_macd(close, fast_len, slow_len, signal_len)
    divs = detect_divergences(close, macd, lb=swing_lookback)

    cfg = BacktestConfig(
        initial_capital=100_000,
        position_size_pct=1.0,
        sl_pct=sl_pct / 100.0,
        tp_pct=tp_pct / 100.0,
        max_hold_bars=20,
        allow_short=True,
        commission_pct=0.001,
    )

    result = run_backtest(close, macd, divs, cfg=cfg)

    return {
        "symbol": symbol,
        "bar_minutes": bar_minutes,
        "days_back": days_back,
        "bars": len(close),
        "divergences_detected": len(divs),
        "trades": result.num_trades,
        "total_return_pct": round(result.total_return_pct, 2),
        "win_rate": round(result.win_rate, 1),
        "profit_factor": round(result.profit_factor, 2),
        "max_drawdown_pct": round(result.max_drawdown_pct, 2),
        "sharpe_ratio": round(result.sharpe_ratio, 2),
        "avg_bars_held": round(result.avg_bars_held, 1),
        "win_count": result.win_count,
        "loss_count": result.loss_count,
        "total_pnl": round(result.total_pnl, 2),
        "divergence_types": _count_div_types(divs),
        "tick_count": len(raw_ticks),
    }


def _count_div_types(divs):
    counts = {}
    for d in divs:
        counts[d.type_] = counts.get(d.type_, 0) + 1
    return counts


if __name__ == "__main__":
    mcp.run()
