import MetaTrader5 as mt5
from mt5client import to_dict


def get_account():
    acc = mt5.account_info()
    if acc is None:
        return {"error": "No account info available"}
    return to_dict(acc)
