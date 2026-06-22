import MetaTrader5 as mt5
from mt5client import to_dict
from constants import TIMEFRAME_MAP


def get_symbol_info(symbol):
    info = mt5.symbol_info(symbol)
    if info is None:
        return {"error": f"Symbol '{symbol}' not found"}
    return to_dict(info)


def get_rates(symbol, timeframe="M1", count=100):
    tf_str = timeframe.upper()
    tf = TIMEFRAME_MAP.get(tf_str)
    if tf is None:
        return {"error": f"Invalid timeframe: {tf_str}"}

    count = max(1, min(count, 10000))
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
    if rates is None or len(rates) == 0:
        return []

    return [{
        "time": int(r[0]),
        "open": float(r[1]),
        "high": float(r[2]),
        "low": float(r[3]),
        "close": float(r[4]),
        "tick_volume": int(r[5]),
        "spread": int(r[6]),
        "real_volume": int(r[7]),
    } for r in rates]


def get_last_price(symbol):
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return {"error": f"Cannot get price for {symbol}"}
    return to_dict(tick)


def find_symbols(query=""):
    if query:
        results = mt5.symbols_get(query)
    else:
        results = mt5.symbols_get()
    if results is None:
        return []
    return [
        {
            "name": s.name,
            "path": s.path,
            "description": s.description,
            "trade_mode": s.trade_mode,
        }
        for s in results[:50]
    ]


def get_ticks(symbol, count=1000, flags=mt5.COPY_TICKS_ALL):
    """Get recent ticks for a symbol from the last N ticks."""
    import datetime
    mt5.symbol_select(symbol, True)
    now = datetime.datetime.now()
    from_dt = now - datetime.timedelta(hours=1)
    ticks = mt5.copy_ticks_from(symbol, from_dt, count, flags)
    if ticks is None or len(ticks) == 0:
        from_dt = now - datetime.timedelta(days=1)
        ticks = mt5.copy_ticks_from(symbol, from_dt, count, flags)
    if ticks is None:
        return []
    return [{
        "time": int(t[0]),
        "bid": float(t[1]),
        "ask": float(t[2]),
        "last": float(t[3]),
        "volume": int(t[4]),
        "time_msc": int(t[5]),
        "flags": int(t[6]),
        "volume_real": float(t[7]),
    } for t in ticks]


def get_ticks_range(symbol, from_date, to_date, flags=mt5.COPY_TICKS_ALL):
    """Get ticks within a date range. Dates as Unix timestamps."""
    import datetime
    from_dt = datetime.datetime.fromtimestamp(from_date) if isinstance(from_date, (int, float)) else from_date
    to_dt = datetime.datetime.fromtimestamp(to_date) if isinstance(to_date, (int, float)) else to_date
    mt5.symbol_select(symbol, True)
    ticks = mt5.copy_ticks_range(symbol, from_dt, to_dt, flags)
    if ticks is None:
        return []
    return [{
        "time": int(t[0]),
        "bid": float(t[1]),
        "ask": float(t[2]),
        "last": float(t[3]),
        "volume": int(t[4]),
        "time_msc": int(t[5]),
        "flags": int(t[6]),
        "volume_real": float(t[7]),
    } for t in ticks]


def get_symbol_snapshot(symbol, timeframe="H1"):
    info = get_symbol_info(symbol)
    if isinstance(info, dict) and "error" in info:
        return info
    price = get_last_price(symbol)
    rates = get_rates(symbol, timeframe, count=5)
    return {
        "symbol": symbol,
        "info": info,
        "last_price": price,
        "recent_candles": rates,
    }
