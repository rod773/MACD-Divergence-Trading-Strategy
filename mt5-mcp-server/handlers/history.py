import MetaTrader5 as mt5
from mt5client import to_dict


def get_trade_history(from_date=None, to_date=None):
    import datetime

    if to_date is None:
        to_date = datetime.datetime.now()
    else:
        if isinstance(to_date, (int, float)):
            to_date = datetime.datetime.fromtimestamp(to_date)

    if from_date is None:
        from_date = to_date - datetime.timedelta(days=30)
    else:
        if isinstance(from_date, (int, float)):
            from_date = datetime.datetime.fromtimestamp(from_date)

    deals = mt5.history_deals_get(from_date, to_date)
    if deals is None:
        return []
    return [to_dict(d) for d in deals]
