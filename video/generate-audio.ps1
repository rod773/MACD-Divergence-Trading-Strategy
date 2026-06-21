Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = -1

$scenes = @(
    @{ Name = "intro"; Text = "Welcome to this complete guide on MACD Divergence, a powerful technical analysis tool used to identify potential reversals and continuations in financial markets." },
    @{ Name = "what_is"; Text = "MACD Divergence occurs when price and the MACD oscillator move in opposite directions. There are two main types. Regular Divergence, which signals a potential reversal. And Hidden Divergence, which signals trend continuation." },
    @{ Name = "bullish"; Text = "Bullish Divergence appears in downtrends. When price makes lower lows but the MACD oscillator makes higher lows, it means sellers are losing momentum. This is a BUY signal. Expect a reversal to the upside." },
    @{ Name = "bearish"; Text = "Bearish Divergence appears in uptrends. When price makes higher highs but the MACD oscillator makes lower highs, it means buyers are losing momentum. This is a SELL signal. Expect a reversal to the downside." },
    @{ Name = "hidden_bullish"; Text = "Hidden Bullish Divergence appears during uptrend pullbacks. When price makes higher lows but the MACD makes lower lows, it signals the uptrend is resuming. This is a continuation BUY signal." },
    @{ Name = "hidden_bearish"; Text = "Hidden Bearish Divergence appears during downtrend bounces. When price makes lower highs but the MACD makes higher highs, it signals the downtrend is resuming. This is a continuation SELL signal." },
    @{ Name = "outro"; Text = "Remember these key rules. Regular divergence means reversal, hidden means continuation. Higher timeframes are stronger. Always wait for MACD crossover confirmation, and maintain a minimum risk-reward ratio of one to two." }
)

New-Item -ItemType Directory -Force -Path "public" | Out-Null

foreach ($scene in $scenes) {
    $wavPath = "public\$($scene.Name).wav"
    Write-Host "Generating $($scene.Name)..."
    $synth.SetOutputToWaveFile($wavPath)
    $synth.Speak($scene.Text)
    $synth.SetOutputToNull()
    Write-Host "  Saved $wavPath"
}

$synth.Dispose()
Write-Host "All WAV files generated!"
