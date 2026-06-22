import json
import logging
import os
import threading

import MetaTrader5 as mt5

log = logging.getLogger("mt5mcp")
INIT_TIMEOUT = 60

_CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "config.json"
)


def load_config():
    if not os.path.exists(_CONFIG_PATH):
        return {}
    with open(_CONFIG_PATH, "r") as f:
        return json.load(f)


def _run_with_timeout(fn, timeout=INIT_TIMEOUT):
    result = [None]

    def _worker():
        result[0] = fn()

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    t.join(timeout=timeout)

    if t.is_alive():
        log.warning("MT5 call timed out after %ds", timeout)
        return None
    return result[0]


def init_mt5():
    config = load_config()
    path = config.get("mt5_path")
    if path:
        if not _run_with_timeout(lambda: mt5.initialize(path=path), timeout=INIT_TIMEOUT):
            log.warning("MT5 init failed with path, trying default")
            return _run_with_timeout(mt5.initialize, timeout=INIT_TIMEOUT)
        return True
    return _run_with_timeout(mt5.initialize, timeout=INIT_TIMEOUT)


def ensure_initialized():
    info = _run_with_timeout(mt5.terminal_info, timeout=15)
    if info is None:
        log.warning("Terminal not responding, attempting full init...")
        return init_mt5()

    acc = _run_with_timeout(mt5.account_info, timeout=15)
    if acc is not None and acc.login != 0:
        return True

    log.warning("Not logged in, attempting login...")
    config = load_config()
    if not config.get("login"):
        return True
    return _run_with_timeout(
        lambda: mt5.login(
            login=int(config["login"]),
            password=config["password"],
            server=config["server"],
        ),
        timeout=INIT_TIMEOUT,
    )


def to_dict(named_tuple):
    if named_tuple is None:
        return None
    return named_tuple._asdict()


def build_order_request(body):
    from constants import FILLING_MAP, ORDER_TYPE_MAP, TIME_MAP

    req = {}

    action = body.get("action", "DEAL")
    req["action"] = mt5.TRADE_ACTION_DEAL if action == "DEAL" else mt5.TRADE_ACTION_PENDING

    order_type = body.get("type", "").upper()
    if order_type not in ORDER_TYPE_MAP:
        return None, f"Invalid type: {order_type}"
    req["type"] = ORDER_TYPE_MAP[order_type]
    req["symbol"] = body.get("symbol", "")
    req["volume"] = float(body.get("volume", 0))
    req["price"] = float(body.get("price", 0))
    req["deviation"] = int(body.get("deviation", 20))
    req["magic"] = int(body.get("magic", 0))
    req["comment"] = str(body.get("comment", ""))

    filling = body.get("type_filling", "IOC").upper()
    req["type_filling"] = FILLING_MAP.get(filling, mt5.ORDER_FILLING_IOC)

    ttime = body.get("type_time", "GTC").upper()
    req["type_time"] = TIME_MAP.get(ttime, mt5.ORDER_TIME_GTC)

    if "position" in body:
        req["position"] = int(body["position"])
    if "sl" in body and body["sl"] is not None:
        req["sl"] = float(body["sl"])
    if "tp" in body and body["tp"] is not None:
        req["tp"] = float(body["tp"])
    if "expiration" in body and body["expiration"] is not None:
        req["expiration"] = int(body["expiration"])

    return req, None
