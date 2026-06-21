//+------------------------------------------------------------------+
//|                                      MACD_Divergences.mq5        |
//|                        MACD Divergence Detection — Swing Point   |
//|                        Method (MQ5 Port of Pine Script v6)       |
//|                        Matches divergence-detector.ts logic      |
//+------------------------------------------------------------------+
#property copyright "MiMoCode"
#property link      ""
#property version   "1.00"
#property indicator_separate_window
#property indicator_buffers 3
#property indicator_plots   3

//--- MACD Line
#property indicator_label1  "MACD"
#property indicator_type1   DRAW_LINE
#property indicator_color1  clrDodgerBlue
#property indicator_style1  STYLE_SOLID
#property indicator_width1  1

//--- Signal Line
#property indicator_label2  "Signal"
#property indicator_type2   DRAW_LINE
#property indicator_color2  clrOrange
#property indicator_style2  STYLE_SOLID
#property indicator_width2  1

//--- Histogram
#property indicator_label3  "Histogram"
#property indicator_type3   DRAW_COLOR_HISTOGRAM
#property indicator_color3  clrDarkGray,clrSeaGreen,clrPaleGreen,clrPink,clrRed
#property indicator_style3  STYLE_SOLID
#property indicator_width3  2

//--- Input Parameters
input int    InpFastLen       = 12;          // Fast Length
input int    InpSlowLen       = 26;          // Slow Length
input int    InpSignalLen     = 9;           // Signal Smoothing
input int    InpSwingLookback = 5;           // Swing Lookback

//--- Color Inputs
input color  InpColorMACD     = clrDodgerBlue;   // MACD Line Color
input color  InpColorSignal   = clrOrange;        // Signal Line Color
input color  InpColorGrowAbove = clrSeaGreen;     // Histogram Above Grow
input color  InpColorFallAbove = clrPaleGreen;    // Histogram Above Fall
input color  InpColorGrowBelow = clrPink;         // Histogram Below Grow
input color  InpColorFallBelow = clrRed;          // Histogram Below Fall

//--- Alert Inputs
input bool   InpAlertRegularBull  = true;   // Alert on Regular Bullish
input bool   InpAlertRegularBear  = true;   // Alert on Regular Bearish
input bool   InpAlertHiddenBull   = true;   // Alert on Hidden Bullish
input bool   InpAlertHiddenBear   = true;   // Alert on Hidden Bearish

//--- Indicator Buffers
double MACDBuffer[];
double SignalBuffer[];
double HistBuffer[];
double HistColorBuffer[];

//--- Global MACD values for current bar
double g_macd, g_signal, g_hist;

//--- Swing tracking variables
struct SwingPoint {
   double value;
   int    index;
   bool   valid;
};

//--- Price swing highs/lows (last two)
SwingPoint g_priceHighPrev, g_priceHighCurr;
SwingPoint g_priceLowPrev,  g_priceLowCurr;

//--- MACD swing highs/lows (last two)
SwingPoint g_macdHighPrev, g_macdHighCurr;
SwingPoint g_macdLowPrev,  g_macdLowCurr;

//+------------------------------------------------------------------+
//| Custom indicator initialization function                         |
//+------------------------------------------------------------------+
int OnInit()
{
   SetIndexBuffer(0, MACDBuffer, INDICATOR_DATA);
   SetIndexBuffer(1, SignalBuffer, INDICATOR_DATA);
   SetIndexBuffer(2, HistBuffer, INDICATOR_DATA);
   SetIndexBuffer(3, HistColorBuffer, INDICATOR_COLOR_INDEX);

   IndicatorSetString(INDICATOR_SHORTNAME, "MACD Divergences");
   IndicatorSetInteger(INDICATOR_DIGITS, _Digits + 1);

   IndicatorSetInteger(INDICATOR_MAXIMUMBarsShift, 0);

   // Initialize swing points
   g_priceHighPrev = {0, 0, false};
   g_priceHighCurr = {0, 0, false};
   g_priceLowPrev  = {0, 0, false};
   g_priceLowCurr  = {0, 0, false};
   g_macdHighPrev  = {0, 0, false};
   g_macdHighCurr  = {0, 0, false};
   g_macdLowPrev   = {0, 0, false};
   g_macdLowCurr   = {0, 0, false};

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Deinitialization                                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   ObjectsDeleteAll(0, "MACDDiv_");
   Comment("");
}

//+------------------------------------------------------------------+
//| Check if a point is a swing high                                  |
//+------------------------------------------------------------------+
bool IsSwingHigh(const double &data[], int pos, int lb)
{
   for(int j = 1; j <= lb; j++)
   {
      if(data[pos] <= data[pos - j] || data[pos] <= data[pos + j])
         return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Check if a point is a swing low                                   |
//+------------------------------------------------------------------+
bool IsSwingLow(const double &data[], int pos, int lb)
{
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
//| Draw divergence line between two MACD swing points                |
//+------------------------------------------------------------------+
void DrawDivLine(int x1, double y1, int x2, double y2, color clr, bool dashed, string label)
{
   string name = "MACDDiv_Line_" + label + "_" + IntegerToString(x1) + "_" + IntegerToString(x2);
   ObjectCreate(0, name, OBJ_TREND, IndicatorWindow(0), x1, y1, x2, y2);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, false);
   ObjectSetInteger(0, name, OBJPROP_BACK, false);
   if(dashed)
      ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_DASH);
   else
      ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID);
}

//+------------------------------------------------------------------+
//| Draw divergence label                                             |
//+------------------------------------------------------------------+
void DrawDivLabel(int x1, int x2, double y1, double y2, color clr, string text, bool above)
{
   int xMid = (x1 + x2) / 2;
   double yMid = above ? MathMax(y1, y2) : MathMin(y1, y2);

   string name = "MACDDiv_Label_" + text + "_" + IntegerToString(x1) + "_" + IntegerToString(x2);
   ObjectCreate(0, name, OBJ_TEXT, IndicatorWindow(0), xMid, yMid);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 8);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, above ? ANCHOR_LOWER : ANCHOR_UPPER);
}

//+------------------------------------------------------------------+
//| Send alert                                                        |
//+------------------------------------------------------------------+
void SendDivAlert(string type, string desc)
{
   Alert(type, " MACD divergence detected — ", desc);
}

//+------------------------------------------------------------------+
//| Check and detect divergences at current bar                       |
//+------------------------------------------------------------------+
void DetectDivergences(int bar, const double &price[], const double &macd[], int total)
{
   if(bar < InpSwingLookback)
      return;

   bool isPriceHigh = IsSwingHigh(price, bar, InpSwingLookback);
   bool isPriceLow  = IsSwingLow(price, bar, InpSwingLookback);
   bool isMacdHigh  = IsSwingHigh(macd, bar, InpSwingLookback);
   bool isMacdLow   = IsSwingLow(macd, bar, InpSwingLookback);

   // --- Update price swing points ---
   if(isPriceHigh)
      UpdateSwingHigh(g_priceHighPrev, g_priceHighCurr, price[bar], bar);

   if(isPriceLow)
      UpdateSwingLow(g_priceLowPrev, g_priceLowCurr, price[bar], bar);

   // --- Update MACD swing points ---
   if(isMacdHigh)
      UpdateSwingHigh(g_macdHighPrev, g_macdHighCurr, macd[bar], bar);

   if(isMacdLow)
      UpdateSwingLow(g_macdLowPrev, g_macdLowCurr, macd[bar], bar);

   // --- Check Regular Bullish: Price LL + MACD HL ---
   if(g_priceLowPrev.valid && g_priceLowCurr.valid && g_macdLowPrev.valid && g_macdLowCurr.valid)
   {
      if(g_priceLowCurr.value < g_priceLowPrev.value &&
         g_macdLowCurr.value > g_macdLowPrev.value &&
         g_macdLowCurr.index > g_macdLowPrev.index)
      {
         color clr = clrGreen;
         DrawDivLine(g_macdLowPrev.index, g_macdLowPrev.value,
                     g_macdLowCurr.index, g_macdLowCurr.value, clr, false, "RegBull");
         DrawDivLabel(g_macdLowPrev.index, g_macdLowCurr.index,
                      g_macdLowPrev.value, g_macdLowCurr.value, clr, "Regular Bullish", true);
         if(InpAlertRegularBull && bar == 0)
            SendDivAlert("Regular Bullish", "Price LL + MACD HL");
      }
   }

   // --- Check Regular Bearish: Price HH + MACD LH ---
   if(g_priceHighPrev.valid && g_priceHighCurr.valid && g_macdHighPrev.valid && g_macdHighCurr.valid)
   {
      if(g_priceHighCurr.value > g_priceHighPrev.value &&
         g_macdHighCurr.value < g_macdHighPrev.value &&
         g_macdHighCurr.index > g_macdHighPrev.index)
      {
         color clr = clrRed;
         DrawDivLine(g_macdHighPrev.index, g_macdHighPrev.value,
                     g_macdHighCurr.index, g_macdHighCurr.value, clr, false, "RegBear");
         DrawDivLabel(g_macdHighPrev.index, g_macdHighCurr.index,
                      g_macdHighPrev.value, g_macdHighCurr.value, clr, "Regular Bearish", false);
         if(InpAlertRegularBear && bar == 0)
            SendDivAlert("Regular Bearish", "Price HH + MACD LH");
      }
   }

   // --- Check Hidden Bullish: Price HL + MACD LL ---
   if(g_priceLowPrev.valid && g_priceLowCurr.valid && g_macdLowPrev.valid && g_macdLowCurr.valid)
   {
      if(g_priceLowCurr.value > g_priceLowPrev.value &&
         g_macdLowCurr.value < g_macdLowPrev.value &&
         g_macdLowCurr.index > g_macdLowPrev.index)
      {
         color clr = clrOrange;
         DrawDivLine(g_macdLowPrev.index, g_macdLowPrev.value,
                     g_macdLowCurr.index, g_macdLowCurr.value, clr, true, "HideBull");
         DrawDivLabel(g_macdLowPrev.index, g_macdLowCurr.index,
                      g_macdLowPrev.value, g_macdLowCurr.value, clr, "Hidden Bullish", true);
         if(InpAlertHiddenBull && bar == 0)
            SendDivAlert("Hidden Bullish", "Price HL + MACD LL");
      }
   }

   // --- Check Hidden Bearish: Price LH + MACD HH ---
   if(g_priceHighPrev.valid && g_priceHighCurr.valid && g_macdHighPrev.valid && g_macdHighCurr.valid)
   {
      if(g_priceHighCurr.value < g_priceHighPrev.value &&
         g_macdHighCurr.value > g_macdHighPrev.value &&
         g_macdHighCurr.index > g_macdHighPrev.index)
      {
         color clr = clrPurple;
         DrawDivLine(g_macdHighPrev.index, g_macdHighPrev.value,
                     g_macdHighCurr.index, g_macdHighCurr.value, clr, true, "HideBear");
         DrawDivLabel(g_macdHighPrev.index, g_macdHighCurr.index,
                      g_macdHighPrev.value, g_macdHighCurr.value, clr, "Hidden Bearish", false);
         if(InpAlertHiddenBear && bar == 0)
            SendDivAlert("Hidden Bearish", "Price LH + MACD HH");
      }
   }
}

//+------------------------------------------------------------------+
//| Custom indicator iteration function                               |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   if(rates_total < InpSlowLen + InpSignalLen)
      return(0);

   //--- Calculate MACD using EMA
   double fastEMA[], slowEMA[], signalEMA[];
   ArrayResize(fastEMA, rates_total);
   ArrayResize(slowEMA, rates_total);
   ArrayResize(signalEMA, rates_total);

   double fastAlpha = 2.0 / (InpFastLen + 1.0);
   double slowAlpha = 2.0 / (InpSlowLen + 1.0);
   double sigAlpha  = 2.0 / (InpSignalLen + 1.0);

   //--- Compute MACD, Signal, Histogram
   double macdArr[];
   ArrayResize(macdArr, rates_total);

   int start = 0;
   if(prev_calculated == 0)
   {
      fastEMA[0] = close[0];
      slowEMA[0] = close[0];
      macdArr[0] = 0;
      MACDBuffer[0] = 0;
      SignalBuffer[0] = 0;
      HistBuffer[0] = 0;
      HistColorBuffer[0] = 0;
      start = 1;
   }
   else
   {
      start = prev_calculated - 1;
   }

   for(int i = start; i < rates_total; i++)
   {
      //--- Fast EMA
      fastEMA[i] = close[i] * fastAlpha + fastEMA[i-1] * (1.0 - fastAlpha);
      //--- Slow EMA
      slowEMA[i] = close[i] * slowAlpha + slowEMA[i-1] * (1.0 - slowAlpha);
      //--- MACD line
      macdArr[i] = fastEMA[i] - slowEMA[i];

      //--- Signal EMA (on MACD)
      if(i == 0)
         signalEMA[i] = macdArr[i];
      else
         signalEMA[i] = macdArr[i] * sigAlpha + signalEMA[i-1] * (1.0 - sigAlpha);

      //--- Histogram
      double hist = macdArr[i] - signalEMA[i];

      MACDBuffer[i]   = macdArr[i];
      SignalBuffer[i] = signalEMA[i];
      HistBuffer[i]   = hist;

      //--- Histogram color
      // 0=gray(base), 1=grow above, 2=fall above, 3=grow below, 4=fall below
      if(hist >= 0)
      {
         if(i > 0 && HistBuffer[i-1] < hist)
            HistColorBuffer[i] = 1; // grow above
         else
            HistColorBuffer[i] = 2; // fall above
      }
      else
      {
         if(i > 0 && HistBuffer[i-1] < hist)
            HistColorBuffer[i] = 3; // grow below
         else
            HistColorBuffer[i] = 4; // fall below
      }
   }

   //--- Detect divergences (iterate over visible bars)
   // Reset swing state for fresh detection on recalculation
   if(prev_calculated == 0)
   {
      g_priceHighPrev = {0, 0, false};
      g_priceHighCurr = {0, 0, false};
      g_priceLowPrev  = {0, 0, false};
      g_priceLowCurr  = {0, 0, false};
      g_macdHighPrev  = {0, 0, false};
      g_macdHighCurr  = {0, 0, false};
      g_macdLowPrev   = {0, 0, false};
      g_macdLowCurr   = {0, 0, false};
      ObjectsDeleteAll(0, "MACDDiv_");
   }

   int divStart = MathMax(InpSwingLookback + 1, (prev_calculated == 0) ? 0 : prev_calculated - 1);
   for(int i = divStart; i < rates_total; i++)
   {
      DetectDivergences(i, close, macdArr, rates_total);
   }

   return(rates_total);
}
//+------------------------------------------------------------------+
