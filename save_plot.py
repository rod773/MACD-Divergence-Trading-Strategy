"""Save the backtest plot to a PNG file."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf
from macd_divergences import calc_macd, detect_divergences
from backtest import run_backtest, BacktestConfig, plot_backtest, Side

ticker = "AAPL"
period = "2y"
interval = "1d"

cfg = BacktestConfig()

df = yf.download(ticker, period=period, interval=interval, progress=False)
close = df["Close"].to_numpy().flatten()
dates = df.index.to_numpy()
macd, sig, hist = calc_macd(close)
divs = detect_divergences(close, macd, lb=5)

result = run_backtest(close, macd, divs, dates=dates, cfg=cfg)

# --- Equity curve ---
fig, (ax_eq, ax_px) = plt.subplots(
    2, 1, figsize=(16, 9), height_ratios=[1, 1.5],
    sharex=True, gridspec_kw={"hspace": 0.05},
)

x = np.arange(len(close))

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
ax_eq.set_title(f"{ticker} — MACD Divergence Strategy Backtest", fontsize=13, fontweight="bold")

ax_px.plot(dates, close, color="#555555", linewidth=0.8, label="Close")

for t in result.trades:
    ed = dates[t.entry_bar]
    xd = dates[min(t.exit_bar, len(dates)-1)]
    color = "#00C853" if t.side == Side.LONG else "#FF1744"
    marker = "^" if t.side == Side.LONG else "v"
    ax_px.scatter(ed, t.entry_price, marker=marker, color=color,
                  s=80, zorder=5, edgecolors="black", linewidths=0.5)
    ax_px.scatter(xd, t.exit_price, marker="x", color=color,
                  s=60, zorder=5, linewidths=1.5)
    ax_px.annotate(
        t.exit_reason, xy=(xd, t.exit_price),
        fontsize=6, color=color, ha="center",
        xytext=(0, 10 if t.side == Side.LONG else -10),
        textcoords="offset points",
    )

ax_px.set_ylabel("Price", fontsize=10)
ax_px.legend(loc="upper left", fontsize=9)
ax_px.grid(True, alpha=0.3)

import matplotlib.dates as mdates
ax_px.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
fig.autofmt_xdate()

plt.savefig("backtest_results.png", dpi=150, bbox_inches="tight")
print("Saved backtest_results.png")
