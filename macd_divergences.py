"""
MACD Divergence Detection — Swing Point Method
Python port of MACD Divergences_lines.pine (Pine Script v6)

Detects Regular and Hidden divergences between price and MACD
using local swing highs/lows, then plots lines + labels.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D
import yfinance as yf
from typing import Optional


# ---------------------------------------------------------------------------
# Core: MACD Calculation
# ---------------------------------------------------------------------------

def ema(series: np.ndarray, length: int) -> np.ndarray:
    """Exponential moving average."""
    alpha = 2.0 / (length + 1.0)
    out = np.empty_like(series, dtype=np.float64)
    out[0] = series[0]
    for i in range(1, len(series)):
        out[i] = series[i] * alpha + out[i - 1] * (1.0 - alpha)
    return out


def calc_macd(close: np.ndarray, fast: int = 12, slow: int = 26,
              signal: int = 9) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (macd_line, signal_line, histogram)."""
    macd = ema(close, fast) - ema(close, slow)
    sig = ema(macd, signal)
    hist = macd - sig
    return macd, sig, hist


# ---------------------------------------------------------------------------
# Swing Point Detection
# ---------------------------------------------------------------------------

def is_swing_high(data: np.ndarray, idx: int, lb: int) -> bool:
    """True if data[idx] is strictly greater than all neighbors within lb bars."""
    for j in range(1, lb + 1):
        if data[idx] <= data[idx - j] or data[idx] <= data[idx + j]:
            return False
    return True


def is_swing_low(data: np.ndarray, idx: int, lb: int) -> bool:
    """True if data[idx] is strictly less than all neighbors within lb bars."""
    for j in range(1, lb + 1):
        if data[idx] >= data[idx - j] or data[idx] >= data[idx + j]:
            return False
    return True


# ---------------------------------------------------------------------------
# Divergence Detection
# ---------------------------------------------------------------------------

class SwingPoint:
    __slots__ = ("value", "index")

    def __init__(self, value: float = np.nan, index: int = -1):
        self.value = value
        self.index = index

    @property
    def valid(self) -> bool:
        return not np.isnan(self.value) and self.index >= 0


class Divergence:
    __slots__ = ("type_", "style", "macd_prev", "macd_curr")

    def __init__(self, type_: str, style: str,
                 macd_prev: SwingPoint, macd_curr: SwingPoint):
        self.type_ = type_          # "Regular Bullish", etc.
        self.style = style          # "solid" or "dashed"
        self.macd_prev = macd_prev
        self.macd_curr = macd_curr


def detect_divergences(close: np.ndarray, macd: np.ndarray,
                       lb: int = 5) -> list[Divergence]:
    """
    Scan every bar and collect divergences.
    Returns a list of Divergence objects with MACD swing coordinates.
    """
    n = len(close)
    results: list[Divergence] = []

    # swing trackers — last two highs / lows for price and MACD
    price_h_prev, price_h_curr = SwingPoint(), SwingPoint()
    price_l_prev, price_l_curr = SwingPoint(), SwingPoint()
    macd_h_prev, macd_h_curr = SwingPoint(), SwingPoint()
    macd_l_prev, macd_l_curr = SwingPoint(), SwingPoint()

    for i in range(lb, n - lb):
        ph = is_swing_high(close, i, lb)
        pl = is_swing_low(close, i, lb)
        mh = is_swing_high(macd, i, lb)
        ml = is_swing_low(macd, i, lb)

        if ph:
            price_h_prev = price_h_curr
            price_h_curr = SwingPoint(close[i], i)
        if pl:
            price_l_prev = price_l_curr
            price_l_curr = SwingPoint(close[i], i)
        if mh:
            macd_h_prev = macd_h_curr
            macd_h_curr = SwingPoint(macd[i], i)
        if ml:
            macd_l_prev = macd_l_curr
            macd_l_curr = SwingPoint(macd[i], i)

        # --- Regular Bullish: Price LL + MACD HL ---
        if (price_l_prev.valid and price_l_curr.valid and
                macd_l_prev.valid and macd_l_curr.valid):
            if (price_l_curr.value < price_l_prev.value and
                    macd_l_curr.value > macd_l_prev.value and
                    macd_l_curr.index > macd_l_prev.index):
                results.append(Divergence("Regular Bullish", "solid",
                                          macd_l_prev, macd_l_curr))

        # --- Regular Bearish: Price HH + MACD LH ---
        if (price_h_prev.valid and price_h_curr.valid and
                macd_h_prev.valid and macd_h_curr.valid):
            if (price_h_curr.value > price_h_prev.value and
                    macd_h_curr.value < macd_h_prev.value and
                    macd_h_curr.index > macd_h_prev.index):
                results.append(Divergence("Regular Bearish", "solid",
                                          macd_h_prev, macd_h_curr))

        # --- Hidden Bullish: Price HL + MACD LL ---
        if (price_l_prev.valid and price_l_curr.valid and
                macd_l_prev.valid and macd_l_curr.valid):
            if (price_l_curr.value > price_l_prev.value and
                    macd_l_curr.value < macd_l_prev.value and
                    macd_l_curr.index > macd_l_prev.index):
                results.append(Divergence("Hidden Bullish", "dashed",
                                          macd_l_prev, macd_l_curr))

        # --- Hidden Bearish: Price LH + MACD HH ---
        if (price_h_prev.valid and price_h_curr.valid and
                macd_h_prev.valid and macd_h_curr.valid):
            if (price_h_curr.value < price_h_prev.value and
                    macd_h_curr.value > macd_h_prev.value and
                    macd_h_curr.index > macd_h_prev.index):
                results.append(Divergence("Hidden Bearish", "dashed",
                                          macd_h_prev, macd_h_curr))

    return results


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------

COLORS = {
    "Regular Bullish":  ("#00C853", "solid"),
    "Regular Bearish":  ("#FF1744", "solid"),
    "Hidden Bullish":   ("#FF9100", "dashed"),
    "Hidden Bearish":   ("#AA00FF", "dashed"),
}


def plot_macd_divergences(close: np.ndarray, macd: np.ndarray,
                          signal: np.ndarray, hist: np.ndarray,
                          divergences: list[Divergence],
                          title: str = "MACD Divergences",
                          figsize: tuple = (16, 9)):
    """Plot MACD panel with divergence lines and labels."""

    fig, (ax_price, ax_macd) = plt.subplots(
        2, 1, figsize=figsize, height_ratios=[2, 1],
        sharex=True, gridspec_kw={"hspace": 0.05},
    )

    n = len(close)
    x = np.arange(n)

    # --- Price chart ---
    ax_price.plot(x, close, color="#2962FF", linewidth=1, label="Close")
    ax_price.set_ylabel("Price", fontsize=10)
    ax_price.legend(loc="upper left", fontsize=9)
    ax_price.grid(True, alpha=0.3)

    # --- MACD panel ---
    # Histogram colors
    hist_colors = np.where(
        hist >= 0,
        np.where(np.roll(hist, 1) < hist, "#26A69A", "#B2DFDB"),
        np.where(np.roll(hist, 1) < hist, "#FFCDD2", "#FF5252"),
    )
    hist_colors[0] = "#888888"

    ax_macd.bar(x, hist, color=hist_colors, width=0.8, label="Histogram")
    ax_macd.plot(x, macd, color="#2962FF", linewidth=1.2, label="MACD")
    ax_macd.plot(x, signal, color="#FF6D00", linewidth=1.2, label="Signal")
    ax_macd.axhline(0, color="gray", linewidth=0.5, linestyle="--")
    ax_macd.set_ylabel("MACD", fontsize=10)
    ax_macd.legend(loc="upper left", fontsize=9)
    ax_macd.grid(True, alpha=0.3)

    # --- Draw divergences ---
    legend_handles = {}
    for div in divergences:
        clr, style = COLORS[div.type_]
        ls = "-" if style == "solid" else "--"

        # Line on MACD panel
        ax_macd.plot(
            [div.macd_prev.index, div.macd_curr.index],
            [div.macd_prev.value, div.macd_curr.value],
            color=clr, linewidth=2, linestyle=ls, zorder=5,
        )

        # Label at midpoint
        mx = (div.macd_prev.index + div.macd_curr.index) / 2
        my = max(div.macd_prev.value, div.macd_curr.value)
        ax_macd.annotate(
            div.type_,
            xy=(mx, my), fontsize=7, fontweight="bold",
            color=clr, ha="center",
            xytext=(0, 8), textcoords="offset points",
            bbox=dict(boxstyle="round,pad=0.2", fc="white", ec=clr, alpha=0.85),
        )

        # Collect for legend
        if div.type_ not in legend_handles:
            legend_handles[div.type_] = Line2D(
                [0], [0], color=clr, linewidth=2, linestyle=ls, label=div.type_
            )

    if legend_handles:
        ax_macd.legend(
            handles=list(legend_handles.values()),
            loc="upper left", fontsize=8,
        )

    ax_macd.set_xlabel("Bar Index", fontsize=10)
    fig.suptitle(title, fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.show()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(ticker: str = "AAPL", period: str = "6mo", interval: str = "1d",
        fast: int = 12, slow: int = 26, signal: int = 9,
        swing_lookback: int = 5):
    """Fetch data, compute divergences, and plot."""

    df = yf.download(ticker, period=period, interval=interval, progress=False)
    if df.empty:
        print(f"No data for {ticker}")
        return

    close = df["Close"].to_numpy().flatten()
    macd, sig, hist = calc_macd(close, fast, slow, signal)
    divs = detect_divergences(close, macd, lb=swing_lookback)

    print(f"{ticker}: {len(close)} bars, {len(divs)} divergences detected")
    for d in divs:
        print(f"  {d.type_:20s}  bar {d.macd_prev.index:>5d} -> {d.macd_curr.index:>5d}")

    plot_macd_divergences(close, macd, sig, hist, divs,
                          title=f"{ticker} — MACD Divergences")


if __name__ == "__main__":
    run()
