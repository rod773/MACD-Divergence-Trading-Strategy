import MetaTrader5 as mt5
from mt5client import to_dict


def get_positions(symbol=None):
    if symbol:
        positions = mt5.positions_get(symbol=symbol)
    else:
        positions = mt5.positions_get()

    if positions is None:
        return []
    return [to_dict(p) for p in positions]


def close_position(ticket, volume=None, deviation=20):
    positions = mt5.positions_get(ticket=ticket)
    if not positions:
        return {"error": f"Position {ticket} not found"}
    pos = positions[0]

    close_volume = float(volume) if volume is not None else pos.volume
    close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    tick = mt5.symbol_info_tick(pos.symbol)
    if tick is None:
        return {"error": f"Cannot get price for {pos.symbol}"}
    price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask

    req = {
        "action": mt5.TRADE_ACTION_DEAL,
        "position": ticket,
        "symbol": pos.symbol,
        "volume": close_volume,
        "type": close_type,
        "price": price,
        "type_filling": mt5.ORDER_FILLING_IOC,
        "deviation": int(deviation),
    }

    result = mt5.order_send(req)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        err = result.comment if result else str(mt5.last_error())
        return {"error": f"Failed to close position: {err}"}
    return to_dict(result)


def modify_position(ticket, sl=None, tp=None):
    positions = mt5.positions_get(ticket=ticket)
    if not positions:
        return {"error": f"Position {ticket} not found"}
    pos = positions[0]

    req = {
        "action": mt5.TRADE_ACTION_SLTP,
        "position": ticket,
        "symbol": pos.symbol,
        "volume": pos.volume,
        "type": pos.type,
        "price": pos.price_open,
    }
    if sl is not None:
        req["sl"] = float(sl)
    if tp is not None:
        req["tp"] = float(tp)

    result = mt5.order_send(req)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        err = result.comment if result else str(mt5.last_error())
        return {"error": f"Failed to modify position: {err}"}
    return to_dict(result)
