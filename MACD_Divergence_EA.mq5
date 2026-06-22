//+------------------------------------------------------------------+
//|                                        MACD_Divergence_EA.mq5    |
//|                        MACD Divergence Strategy — Expert Advisor  |
//|                        Port of backtest.py trading logic          |
//+------------------------------------------------------------------+
#property copyright "MiMoCode"
#property link      ""
#property version   "1.00"

#include <Trade\Trade.mqh>

//--- Input Parameters
input int    InpFastLen       = 12;          // Fast EMA Length
input int    InpSlowLen       = 26;          // Slow EMA Length
input int    InpSignalLen     = 9;           // Signal Smoothing
input int    InpSwingLookback = 5;           // Swing Lookback

//--- Risk / Trade Management
input double InpRiskPct       = 1.0;         // Risk % of Balance per Trade
input double InpSLPct         = 3.0;         // Stop Loss % (from entry)
input double InpTPPct         = 6.0;         // Take Profit % (from entry)
input int    InpMaxHoldBars   = 20;          // Max Hold Bars (time exit)
input bool   InpAllowShort    = true;        // Allow Short Trades
input int    InpMaxSlippage   = 3;           // Max Slippage (points)
input int    InpMagicNumber   = 20260621;    // Magic Number


//--- Swing Point Structure
struct SwingPoint {
   double value;
   int    index;
   bool   valid;
};

//--- Trade tracking
int       g_handleMACD;
datetime  g_lastBarTime;
int       g_tradeEntryBar;
double    g_tradeEntryPrice;
int       g_tradeSide;   // 1=long, -1=short, 0=none

//--- Swing trackers
SwingPoint g_priceHPrev, g_priceHCurr;
SwingPoint g_priceLPrev, g_priceLCurr;
SwingPoint g_macdHPrev,  g_macdHCurr;
SwingPoint g_macdLPrev,  g_macdLCurr;

CTrade trade;

//+------------------------------------------------------------------+
//| Initialization                                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   g_handleMACD = iMACD(_Symbol, PERIOD_CURRENT, InpFastLen, InpSlowLen, InpSignalLen, PRICE_CLOSE);
   if(g_handleMACD == INVALID_HANDLE)
   {
      Print("Failed to create MACD indicator");
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpMaxSlippage);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   g_lastBarTime = 0;
   g_tradeEntryBar = 0;
   g_tradeEntryPrice = 0;
   g_tradeSide = 0;

   ResetSwingPoints();

   Print("MACD Divergence EA initialized. Magic=", InpMagicNumber);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Deinitialization                                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(g_handleMACD != INVALID_HANDLE)
      IndicatorRelease(g_handleMACD);
}

//+------------------------------------------------------------------+
//| Reset swing point trackers                                        |
//+------------------------------------------------------------------+
void ResetSwingPoints()
{
   ZeroMemory(g_priceHPrev);
   ZeroMemory(g_priceHCurr);
   ZeroMemory(g_priceLPrev);
   ZeroMemory(g_priceLCurr);
   ZeroMemory(g_macdHPrev);
   ZeroMemory(g_macdHCurr);
   ZeroMemory(g_macdLPrev);
   ZeroMemory(g_macdLCurr);
}

//+------------------------------------------------------------------+
//| Check if position is a swing high                                 |
//+------------------------------------------------------------------+
bool IsSwingHigh(const double &data[], int pos, int lb, int total)
{
   if(pos - lb < 0 || pos + lb >= total)
      return false;
   for(int j = 1; j <= lb; j++)
   {
      if(data[pos] <= data[pos - j] || data[pos] <= data[pos + j])
         return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Check if position is a swing low                                  |
//+------------------------------------------------------------------+
bool IsSwingLow(const double &data[], int pos, int lb, int total)
{
   if(pos - lb < 0 || pos + lb >= total)
      return false;
   for(int j = 1; j <= lb; j++)
   {
      if(data[pos] >= data[pos - j] || data[pos] >= data[pos + j])
         return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Update swing high                                                 |
//+------------------------------------------------------------------+
void UpdateSwingHigh(SwingPoint &prev, SwingPoint &curr, double value, int index)
{
   prev = curr;
   curr.value = value;
   curr.index = index;
   curr.valid = true;
}

//+------------------------------------------------------------------+
//| Update swing low                                                  |
//+------------------------------------------------------------------+
void UpdateSwingLow(SwingPoint &prev, SwingPoint &curr, double value, int index)
{
   prev = curr;
   curr.value = value;
   curr.index = index;
   curr.valid = true;
}

//+------------------------------------------------------------------+
//| Check for open positions managed by this EA                       |
//+------------------------------------------------------------------+
bool HasOpenPosition()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Get current position side (1=long, -1=short, 0=none)              |
//+------------------------------------------------------------------+
int GetPositionSide()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         return (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? 1 : -1;
      }
   }
   return 0;
}

//+------------------------------------------------------------------+
//| Get entry price of open position                                  |
//+------------------------------------------------------------------+
double GetEntryPrice()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         return PositionGetDouble(POSITION_PRICE_OPEN);
   }
   return 0;
}

//+------------------------------------------------------------------+
//| Count bars held since entry                                       |
//+------------------------------------------------------------------+
int BarsSinceEntry()
{
   datetime entryTime = (datetime)PositionGetInteger(POSITION_TIME);
   datetime now = TimeCurrent();
   int tfSeconds = PeriodSeconds(Period());
   if(tfSeconds == 0) return 0;
   return (int)((now - entryTime) / tfSeconds);
}

//+------------------------------------------------------------------+
//| Close all positions for this EA                                   |
//+------------------------------------------------------------------+
void CloseAllPositions(string reason)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol
         && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         trade.PositionClose(ticket);
         Print("Closed position: ", reason);
      }
   }
   g_tradeSide = 0;
}

//+------------------------------------------------------------------+
//| Calculate lot size from risk %                                    |
//+------------------------------------------------------------------+
double CalcLotSize(double entryPrice, double slPrice)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * InpRiskPct / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double lots = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);

   if(tickValue > 0 && tickSize > 0)
   {
      double slDistance = MathAbs(entryPrice - slPrice);
      double slTicks = slDistance / tickSize;
      double slValue = slTicks * tickValue;
      if(slValue > 0)
         lots = riskAmount / slValue;
   }

   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   if(stepLot > 0)
      lots = MathFloor(lots / stepLot) * stepLot;
   lots = MathMax(minLot, MathMin(maxLot, lots));

   return NormalizeDouble(lots, 2);
}

//+------------------------------------------------------------------+
//| Open a trade                                                      |
//+------------------------------------------------------------------+
bool OpenTrade(int side, double entryPrice)
{
   double sl = (side == 1)
      ? entryPrice * (1.0 - InpSLPct / 100.0)
      : entryPrice * (1.0 + InpSLPct / 100.0);

   double tp = (side == 1)
      ? entryPrice * (1.0 + InpTPPct / 100.0)
      : entryPrice * (1.0 - InpTPPct / 100.0);

   double lots = CalcLotSize(entryPrice, sl);

   sl = NormalizeDouble(sl, _Digits);
   tp = NormalizeDouble(tp, _Digits);

   bool ok;
   if(side == 1)
      ok = trade.Buy(lots, _Symbol, 0, sl, tp, "MACD Div Long");
   else
      ok = trade.Sell(lots, _Symbol, 0, sl, tp, "MACD Div Short");

   if(ok)
   {
      g_tradeEntryBar = Bars(_Symbol, PERIOD_CURRENT);
      g_tradeEntryPrice = entryPrice;
      g_tradeSide = side;
      Print("Opened ", (side == 1 ? "LONG" : "SHORT"),
            " @ ", entryPrice, " SL=", sl, " TP=", tp, " lots=", lots);
   }
   else
   {
      Print("Trade open failed: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
   }

   return ok;
}

//+------------------------------------------------------------------+
//| Detect divergences at the current bar                             |
//| Returns: 1=bullish signal, -1=bearish signal, 0=none             |
//+------------------------------------------------------------------+
int DetectSignal(const double &close[], const double &macd[], int total, int bar)
{
   if(bar < InpSwingLookback)
      return 0;

   bool ph = IsSwingHigh(close, bar, InpSwingLookback, total);
   bool pl = IsSwingLow(close, bar, InpSwingLookback, total);
   bool mh = IsSwingHigh(macd, bar, InpSwingLookback, total);
   bool ml = IsSwingLow(macd, bar, InpSwingLookback, total);

   if(ph) UpdateSwingHigh(g_priceHPrev, g_priceHCurr, close[bar], bar);
   if(pl) UpdateSwingLow(g_priceLPrev, g_priceLCurr, close[bar], bar);
   if(mh) UpdateSwingHigh(g_macdHPrev, g_macdHCurr, macd[bar], bar);
   if(ml) UpdateSwingLow(g_macdLPrev, g_macdLCurr, macd[bar], bar);

   // --- Bullish: Regular (Price LL + MACD HL) or Hidden (Price HL + MACD LL) ---
   if(g_priceLPrev.valid && g_priceLCurr.valid && g_macdLPrev.valid && g_macdLCurr.valid)
   {
      // Regular Bullish
      if(g_priceLCurr.value < g_priceLPrev.value &&
         g_macdLCurr.value > g_macdLPrev.value &&
         g_macdLCurr.index > g_macdLPrev.index)
      {
         Print("Regular Bullish divergence at bar ", bar);
         return 1;
      }
      // Hidden Bullish
      if(g_priceLCurr.value > g_priceLPrev.value &&
         g_macdLCurr.value < g_macdLPrev.value &&
         g_macdLCurr.index > g_macdLPrev.index)
      {
         Print("Hidden Bullish divergence at bar ", bar);
         return 1;
      }
   }

   if(!InpAllowShort)
      return 0;

   // --- Bearish: Regular (Price HH + MACD LH) or Hidden (Price LH + MACD HH) ---
   if(g_priceHPrev.valid && g_priceHCurr.valid && g_macdHPrev.valid && g_macdHCurr.valid)
   {
      // Regular Bearish
      if(g_priceHCurr.value > g_priceHPrev.value &&
         g_macdHCurr.value < g_macdHPrev.value &&
         g_macdHCurr.index > g_macdHPrev.index)
      {
         Print("Regular Bearish divergence at bar ", bar);
         return -1;
      }
      // Hidden Bearish
      if(g_priceHCurr.value < g_priceHPrev.value &&
         g_macdHCurr.value > g_macdHPrev.value &&
         g_macdHCurr.index > g_macdHPrev.index)
      {
         Print("Hidden Bearish divergence at bar ", bar);
         return -1;
      }
   }

   return 0;
}

//+------------------------------------------------------------------+
//| Main tick handler                                                 |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- Only process on new bar
   datetime currentBarTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(currentBarTime == g_lastBarTime)
      return;
   g_lastBarTime = currentBarTime;

   //--- Determine scan window (enough bars to reliably find swing pairs)
    int scanBars = InpSwingLookback * 6 + 10;

    //--- Get MACD data
    double macdMain[], macdSignal[];
    if(CopyBuffer(g_handleMACD, 0, 0, scanBars, macdMain) <= 0) return;
    if(CopyBuffer(g_handleMACD, 1, 0, scanBars, macdSignal) <= 0) return;

    //--- Get close prices
    double close[];
    int copied = CopyClose(_Symbol, PERIOD_CURRENT, 0, scanBars, close);
    if(copied <= 0) return;

    //--- MACD line = main - signal
    double macdLine[];
    int total = ArraySize(macdMain);
    ArrayResize(macdLine, total);
    for(int i = 0; i < total; i++)
       macdLine[i] = macdMain[i] - macdSignal[i];

    //--- Check exit conditions for open position
    if(HasOpenPosition())
    {
       int barsHeld = BarsSinceEntry();
       int posSide = GetPositionSide();
       double entryP = GetEntryPrice();
       double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
       double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

       bool hitSL = false, hitTP = false, hitTime = false;

       if(posSide == 1)
       {
          double ret = (bid - entryP) / entryP * 100.0;
          hitSL = (ret <= -InpSLPct);
          hitTP = (ret >= InpTPPct);
       }
       else
       {
          double ret = (entryP - ask) / entryP * 100.0;
          hitSL = (ret <= -InpSLPct);
          hitTP = (ret >= InpTPPct);
       }
       hitTime = (barsHeld >= InpMaxHoldBars);

       if(hitSL || hitTP || hitTime)
       {
          string reason = hitSL ? "SL" : (hitTP ? "TP" : "TIME");
          CloseAllPositions(reason);
       }
       return;
    }

    //--- No open position — scan all bars for swing points and divergences
    ResetSwingPoints();
    int signal = 0;
    int lastBar = total - InpSwingLookback - 1;
    for(int bar = InpSwingLookback; bar <= lastBar; bar++)
    {
       signal = DetectSignal(close, macdLine, total, bar);
       if(signal != 0)
          break;
    }

    if(signal == 0) return;

    double price = (signal == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                                  : SymbolInfoDouble(_Symbol, SYMBOL_BID);

    OpenTrade(signal, price);
}
//+------------------------------------------------------------------+
