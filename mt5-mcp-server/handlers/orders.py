import MetaTrader5 as mt5
from mt5client import to_dict, build_order_request
from constants import ORDER_TYPE_MAP


def create_order(symbol, type, volume, price=None, sl=None, tp=None,
                 deviation=20, magic=0, comment="", type_filling="IOC",
                 type_time="GTC"):
    order_type = type.upper()
    if order_type not in ORDER_TYPE_MAP:
        return {"error": f"Invalid type: {order_type}"}

    is_market = order_type in ("BUY", "SELL")

    if is_market and price is None:
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"error": f"Cannot get price for {symbol}"}
        price = tick.ask if order_type == "BUY" else tick.bid

    body = {
        "action": "DEAL" if is_market else "PENDING",
        "symbol": symbol,
        "type": order_type,
        "volume": volume,
        "price": price,
        "deviation": deviation,
        "magic": magic,
        "comment": comment,
        "type_filling": type_filling,
        "type_time": type_time,
    }
    if sl is not None:
        body["sl"] = sl
    if tp is not None:
        body["tp"] = tp

    req, err = build_order_request(body)
    if err:
        return {"error": err}

    result = mt5.order_send(req)
    if result is None:
        return {"error": f"order_send failed: {mt5.last_error()}"}
    return to_dict(result)


def get_pending_orders(symbol=None):
    if symbol:
        orders = mt5.orders_get(symbol=symbol)
    else:
        orders = mt5.orders_get()
    if orders is None:
        return []
    return [to_dict(o) for o in orders]


def cancel_order(ticket):
    result = mt5.order_delete(ticket)
    if not result or result.retcode != mt5.TRADE_RETCODE_DONE:
        err = result.comment if result else str(mt5.last_error())
        return {"error": f"Failed to cancel order: {err}"}
    return to_dict(result)


def modify_order(ticket, price=None, sl=None, tp=None, volume=None,
                 expiration=None, stoplimit=None):
    order = mt5.order_select(ticket)
    if order is None:
        return {"error": f"Order {ticket} not found"}
    order = mt5.order_get(ticket=ticket)
    if not order:
        return {"error": f"Order {ticket} not found"}
    order = order[0]

    req = {
        "action": mt5.TRADE_ACTION_MODIFY,
        "order": ticket,
        "symbol": order.symbol,
        "type": order.type,
        "price": float(price or order.price),
        "volume": float(volume or order.volume_initial),
        "type_time": order.type_time,
        "type_filling": order.type_filling,
    }
    if sl is not None:
        req["sl"] = float(sl)
    if tp is not None:
        req["tp"] = float(tp)
    if expiration is not None:
        req["expiration"] = int(expiration)
    if stoplimit is not None:
        req["stoplimit"] = float(stoplimit)

    result = mt5.order_send(req)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        err = result.comment if result else str(mt5.last_error())
        return {"error": f"Failed to modify order: {err}"}
    return to_dict(result)
