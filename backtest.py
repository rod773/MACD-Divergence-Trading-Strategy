"""
MACD Divergence Strategy — Backtest
Uses divergence signals from macd_divergences.py to simulate trades.

Strategy:
  - Regular Bullish / Hidden Bullish  → Long entry
  - Regular Bearish / Hidden Bearish  → Short entry
  - Exit: fixed hold bars, or SL/TP whichever hits first
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.lines import Line2D
import yfinance as yf
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from macd_divergences import calc_macd, detect_divergences, Divergence


# ---------------------------------------------------------------------------
# Trade Model
# ---------------------------------------------------------------------------

class Side(Enum):
    LONG = "LONG"
    SHORT = "SHORT"


@dataclass
class Trade:
    entry_bar: int
    entry_price: float
    side: Side
    div_type: str
    exit_bar: int = -1
    exit_price: float = 0.0
    exit_reason: str = ""
    pnl: float = 0.0
    pnl_pct: float = 0.0
    bars_held: int = 0


# ---------------------------------------------------------------------------
# Backtest Engine
# ---------------------------------------------------------------------------

@dataclass
class BacktestConfig:
    initial_capital: float = 100_000.0
    position_size_pct: float = 1.0       # fraction of capital per trade
    sl_pct: float = 0.03                 # stop-loss 3 %
    tp_pct: float = 0.06                 # take-profit 6 %
    max_hold_bars: int = 20              # exit after N bars if neither SL/TP hit
    allow_short: bool = True             # allow short trades from bearish divs
    commission_pct: float = 0.001        # round-trip commission 0.1 %


@dataclass
class BacktestResult:
    trades: list[Trade] = field(default_factory=list)
    equity_curve: np.ndarray = field(default_factory=lambda: np.array([]))
    dates: np.ndarray = field(default_factory=lambda: np.array([]))
    total_pnl: float = 0.0
    total_return_pct: float = 0.0
    num_trades: int = 0
    win_count: int = 0
    loss_count: int = 0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    max_drawdown_pct: float = 0.0
    sharpe_ratio: float = 0.0
    avg_bars_held: float = 0.0
    expectancy: float = 0.0


def run_backtest(close: np.ndarray, macd: np.ndarray,
                 divergences: list[Divergence],
                 dates: Optional[np.ndarray] = None,
                 cfg: Optional[BacktestConfig] = None) -> BacktestResult:
    """
    Simulate the MACD divergence strategy on historical close prices.
    """
    if cfg is None:
        cfg = BacktestConfig()

    n = len(close)
    capital = cfg.initial_capital
    equity = np.full(n, capital)
    trades: list[Trade] = []

    # Sort divergences by the bar they fire on (curr index)
    divs_sorted = sorted(divergences, key=lambda d: d.macd_curr.index)

    # Build signal map: bar_index -> list of divergences
    signals: dict[int, list[Divergence]] = {}
    for d in divs_sorted:
        bar = d.macd_curr.index
        signals.setdefault(bar, []).append(d)

    active_trade: Optional[Trade] = None

    for i in range(n):
        # --- Check active trade exit ---
        if active_trade is not None:
            bars_held = i - active_trade.entry_bar
            exit_reason = ""

            if active_trade.side == Side.LONG:
                pnl_pct_raw = (close[i] - active_trade.entry_price) / active_trade.entry_price
                if pnl_pct_raw <= -cfg.sl_pct:
                    exit_reason = "SL"
                elif pnl_pct_raw >= cfg.tp_pct:
                    exit_reason = "TP"
                elif bars_held >= cfg.max_hold_bars:
                    exit_reason = "TIME"
            else:  # SHORT
                pnl_pct_raw = (active_trade.entry_price - close[i]) / active_trade.entry_price
                if pnl_pct_raw <= -cfg.sl_pct:
                    exit_reason = "SL"
                elif pnl_pct_raw >= cfg.tp_pct:
                    exit_reason = "TP"
                elif bars_held >= cfg.max_hold_bars:
                    exit_reason = "TIME"

            if exit_reason:
                active_trade.exit_bar = i
                active_trade.exit_price = close[i]
                active_trade.exit_reason = exit_reason
                active_trade.bars_held = bars_held

                if active_trade.side == Side.LONG:
                    gross = (close[i] - active_trade.entry_price) / active_trade.entry_price
                else:
                    gross = (active_trade.entry_price - close[i]) / active_trade.entry_price

                active_trade.pnl_pct = gross - cfg.commission_pct
                trade_value = capital * cfg.position_size_pct
                active_trade.pnl = trade_value * active_trade.pnl_pct
                capital += active_trade.pnl

                trades.append(active_trade)
                active_trade = None

        # --- Check for new signal (only if no active trade) ---
        if active_trade is None and i in signals:
            for div in signals[i]:
                if div.type_ in ("Regular Bullish", "Hidden Bullish"):
                    active_trade = Trade(
                        entry_bar=i,
                        entry_price=close[i],
                        side=Side.LONG,
                        div_type=div.type_,
                    )
                    break
                elif div.type_ in ("Regular Bearish", "Hidden Bearish") and cfg.allow_short:
                    active_trade = Trade(
                        entry_bar=i,
                        entry_price=close[i],
                        side=Side.SHORT,
                        div_type=div.type_,
                    )
                    break

        equity[i] = capital

    # --- Force-close any open trade at end ---
    if active_trade is not None:
        active_trade.exit_bar = n - 1
        active_trade.exit_price = close[-1]
        active_trade.exit_reason = "END"
        active_trade.bars_held = n - 1 - active_trade.entry_bar
        if active_trade.side == Side.LONG:
            gross = (close[-1] - active_trade.entry_price) / active_trade.entry_price
        else:
            gross = (active_trade.entry_price - close[-1]) / active_trade.entry_price
        active_trade.pnl_pct = gross - cfg.commission_pct
        trade_value = capital * cfg.position_size_pct
        active_trade.pnl = trade_value * active_trade.pnl_pct
        capital += active_trade.pnl
        equity[-1] = capital
        trades.append(active_trade)

    # --- Compute stats ---
    result = BacktestResult()
    result.trades = trades
    result.equity_curve = equity
    result.dates = dates if dates is not None else np.arange(n)
    result.num_trades = len(trades)
    result.total_pnl = capital - cfg.initial_capital
    result.total_return_pct = (capital / cfg.initial_capital - 1.0) * 100

    if trades:
        wins = [t for t in trades if t.pnl > 0]
        losses = [t for t in trades if t.pnl <= 0]
        result.win_count = len(wins)
        result.loss_count = len(losses)
        result.win_rate = len(wins) / len(trades) * 100

        gross_wins = sum(t.pnl for t in wins) if wins else 0
        gross_losses = abs(sum(t.pnl for t in losses)) if losses else 0
        result.profit_factor = gross_wins / gross_losses if gross_losses > 0 else float("inf")
        result.avg_win = np.mean([t.pnl_pct for t in wins]) * 100 if wins else 0
        result.avg_loss = np.mean([t.pnl_pct for t in losses]) * 100 if losses else 0
        result.avg_bars_held = np.mean([t.bars_held for t in trades])
        result.expectancy = np.mean([t.pnl_pct for t in trades]) * 100

    # Max drawdown
    peak = np.maximum.accumulate(equity)
    dd = (peak - equity) / peak * 100
    result.max_drawdown_pct = np.max(dd) if len(dd) > 0 else 0

    # Sharpe ratio (daily returns)
    if len(equity) > 1:
        daily_ret = np.diff(equity) / equity[:-1]
        if np.std(daily_ret) > 0:
            result.sharpe_ratio = np.mean(daily_ret) / np.std(daily_ret) * np.sqrt(252)
        else:
            result.sharpe_ratio = 0.0

    return result


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_report(result: BacktestResult, ticker: str, cfg: BacktestConfig):
    sep = "=" * 55
    print(f"\n{sep}")
    print(f"  MACD Divergence Strategy — Backtest Report")
    print(f"  Ticker: {ticker}")
    print(f"{sep}")
    print(f"  Initial Capital:     ${cfg.initial_capital:>12,.2f}")
    print(f"  Final Capital:       ${result.equity_curve[-1]:>12,.2f}" if len(result.equity_curve) else "")
    print(f"  Net P&L:             ${result.total_pnl:>12,.2f}")
    print(f"  Total Return:        {result.total_return_pct:>11.2f}%")
    print(f"  Max Drawdown:        {result.max_drawdown_pct:>11.2f}%")
    print(f"  Sharpe Ratio:        {result.sharpe_ratio:>11.2f}")
    print(f"{sep}")
    print(f"  Total Trades:        {result.num_trades:>8d}")
    print(f"  Winners:             {result.win_count:>8d}")
    print(f"  Losers:              {result.loss_count:>8d}")
    print(f"  Win Rate:            {result.win_rate:>10.1f}%")
    print(f"  Profit Factor:       {result.profit_factor:>11.2f}")
    print(f"  Avg Win:             {result.avg_win:>10.2f}%")
    print(f"  Avg Loss:            {result.avg_loss:>10.2f}%")
    print(f"  Expectancy:          {result.expectancy:>10.2f}% per trade")
    print(f"  Avg Bars Held:       {result.avg_bars_held:>11.1f}")
    print(f"{sep}")

    # Exit reason breakdown
    reasons = {}
    for t in result.trades:
        reasons[t.exit_reason] = reasons.get(t.exit_reason, 0) + 1
    if reasons:
        print("  Exit Reasons:")
        for r, c in sorted(reasons.items()):
            print(f"    {r:>6s}: {c:>5d}")
    print(sep)

    # Per-type breakdown
    types = {}
    for t in result.trades:
        types.setdefault(t.div_type, []).append(t)
    if types:
        print("  Per Divergence Type:")
        for tp, ts in sorted(types.items()):
            w = sum(1 for t in ts if t.pnl > 0)
            print(f"    {tp:>22s}: {len(ts):>3d} trades, {w}/{len(ts)} wins ({w/len(ts)*100:.0f}%)")
        print(sep)


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------

def plot_backtest(close: np.ndarray, result: BacktestResult,
                  title: str = "MACD Divergence Backtest"):
    fig, (ax_eq, ax_px) = plt.subplots(
        2, 1, figsize=(16, 9), height_ratios=[1, 1.5],
        sharex=True, gridspec_kw={"hspace": 0.05},
    )

    x = np.arange(len(close))
    dates = result.dates

    # --- Equity curve ---
    ax_eq.plot(dates, result.equity_curve, color="#2962FF", linewidth=1.5, label="Equity")
    ax_eq.fill_between(dates, result.equity_curve[0], result.equity_curve,
                        where=result.equity_curve >= result.equity_curve[0],
                        alpha=0.1, color="#00C853")
    ax_eq.fill_between(dates, result.equity_curve[0], result.equity_curve,
                        where=result.equity_curve < result.equity_curve[0],
                        alpha=0.1, color="#FF1744")
    ax_eq.set_ylabel("Equity ($)", fontsize=10)
    ax_eq.legend(loc="upper left", fontsize=9)
    ax_eq.grid(True, alpha=0.3)
    ax_eq.set_title(title, fontsize=13, fontweight="bold")

    # --- Price chart with trade markers ---
    ax_px.plot(dates, close, color="#555555", linewidth=0.8, label="Close")

    buy_dates, buy_prices = [], []
    sell_dates, sell_prices = [], []
    win_dates, win_prices = [], []
    loss_dates, loss_prices = [], []

    for t in result.trades:
        ed = dates[t.entry_bar]
        xd = dates[t.exit_bar] if t.exit_bar < len(dates) else dates[-1]
        color = "#00C853" if t.side == Side.LONG else "#FF1744"

        # Entry marker
        marker = "^" if t.side == Side.LONG else "v"
        ax_px.scatter(ed, t.entry_price, marker=marker, color=color,
                      s=80, zorder=5, edgecolors="black", linewidths=0.5)

        # Exit marker
        ax_px.scatter(xd, t.exit_price, marker="x", color=color,
                      s=60, zorder=5, linewidths=1.5)

        # Exit reason label
        ax_px.annotate(
            t.exit_reason, xy=(xd, t.exit_price),
            fontsize=6, color=color, ha="center",
            xytext=(0, 10 if t.side == Side.LONG else -10),
            textcoords="offset points",
        )

        if t.pnl > 0:
            win_dates.append(ed)
            win_prices.append(t.entry_price)
        else:
            loss_dates.append(ed)
            loss_prices.append(t.entry_price)

    ax_px.set_ylabel("Price", fontsize=10)
    ax_px.legend(loc="upper left", fontsize=9)
    ax_px.grid(True, alpha=0.3)

    if isinstance(dates[0], (np.datetime64, pd.Timestamp)):
        ax_px.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
        fig.autofmt_xdate()

    plt.tight_layout()
    plt.show()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ticker = "AAPL"
    period = "2y"
    interval = "1d"

    cfg = BacktestConfig(
        initial_capital=100_000,
        position_size_pct=1.0,
        sl_pct=0.03,
        tp_pct=0.06,
        max_hold_bars=20,
        allow_short=True,
        commission_pct=0.001,
    )

    # Fetch data
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    if df.empty:
        print(f"No data for {ticker}")
        return

    close = df["Close"].to_numpy().flatten()
    dates = df.index.to_numpy()
    macd, sig, hist = calc_macd(close)
    divs = detect_divergences(close, macd, lb=5)

    print(f"{ticker}: {len(close)} bars, {len(divs)} divergences detected")

    # Run backtest
    result = run_backtest(close, macd, divs, dates=dates, cfg=cfg)
    print_report(result, ticker, cfg)
    plot_backtest(close, result, title=f"{ticker} — MACD Divergence Strategy Backtest")


if __name__ == "__main__":
    main()
