import asyncio
import edge_tts
import os

VOICES = [
    "en-US-GuyNeural",
    "en-US-AriaNeural",
]

VOICE = VOICES[0]

scenes = [
    ("intro", "Welcome to this complete guide on MACD Divergence, a powerful technical analysis tool used to identify potential reversals and continuations in financial markets."),
    ("what_is", "MACD Divergence occurs when price and the MACD oscillator move in opposite directions. There are two main types. Regular Divergence, which signals a potential reversal. And Hidden Divergence, which signals trend continuation."),
    ("bullish", "Bullish Divergence appears in downtrends. When price makes lower lows but the MACD oscillator makes higher lows, it means sellers are losing momentum. This is a BUY signal. Expect a reversal to the upside."),
    ("bearish", "Bearish Divergence appears in uptrends. When price makes higher highs but the MACD oscillator makes lower highs, it means buyers are losing momentum. This is a SELL signal. Expect a reversal to the downside."),
    ("hidden_bullish", "Hidden Bullish Divergence appears during uptrend pullbacks. When price makes higher lows but the MACD makes lower lows, it signals the uptrend is resuming. This is a continuation BUY signal."),
    ("hidden_bearish", "Hidden Bearish Divergence appears during downtrend bounces. When price makes lower highs but the MACD makes higher highs, it signals the downtrend is resuming. This is a continuation SELL signal."),
    ("outro", "Remember these key rules. Regular divergence means reversal, hidden means continuation. Higher timeframes are stronger. Always wait for MACD crossover confirmation, and maintain a minimum risk-reward ratio of one to two."),
]

async def generate_audio():
    os.makedirs("public", exist_ok=True)
    
    for name, text in scenes:
        print(f"Generating {name}...")
        output_file = f"public/{name}.mp3"
        
        communicate = edge_tts.Communicate(text, VOICE, rate="-5%")
        await communicate.save(output_file)
        print(f"  Saved {output_file}")

asyncio.run(generate_audio())
print("All audio files generated!")
