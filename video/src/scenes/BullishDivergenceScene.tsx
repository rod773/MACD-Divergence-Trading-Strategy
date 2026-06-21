import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const BullishDivergenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const chartProgress = interpolate(frame, [20, 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pricePoints = [
    { x: 100, y: 200 },
    { x: 200, y: 280 },
    { x: 300, y: 220 },
    { x: 400, y: 320 },
    { x: 500, y: 260 },
    { x: 600, y: 350 },
    { x: 700, y: 290 },
    { x: 800, y: 200 },
  ];

  const oscillatorPoints = [
    { x: 100, y: 520 },
    { x: 200, y: 580 },
    { x: 300, y: 540 },
    { x: 400, y: 600 },
    { x: 500, y: 560 },
    { x: 600, y: 520 },
    { x: 700, y: 480 },
    { x: 800, y: 420 },
  ];

  const visiblePricePoints = Math.floor(chartProgress * pricePoints.length);
  const visibleOscillatorPoints = Math.floor(
    chartProgress * oscillatorPoints.length
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0e1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 80,
          right: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: "#10b981",
              padding: "12px 24px",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "white",
                fontFamily: "Arial, sans-serif",
              }}
            >
              BUY
            </span>
          </div>
          <h2
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              fontFamily: "Arial, sans-serif",
              margin: 0,
            }}
          >
            Bullish Divergence
          </h2>
        </div>
      </div>

      <svg
        width={900}
        height={700}
        style={{ position: "absolute", top: 150, left: 80 }}
      >
        {/* Price line */}
        <text
          x={60}
          y={180}
          fill="#94a3b8"
          fontSize={18}
          fontFamily="monospace"
        >
          Price
        </text>
        {pricePoints.slice(0, visiblePricePoints).map((point, i) => {
          if (i === 0) return null;
          const prev = pricePoints[i - 1];
          return (
            <line
              key={`price-${i}`}
              x1={prev.x}
              y1={prev.y}
              x2={point.x}
              y2={point.y}
              stroke="#ef4444"
              strokeWidth={3}
              opacity={chartProgress > i / pricePoints.length ? 1 : 0}
            />
          );
        })}

        {/* Lower Lows label */}
        {visiblePricePoints >= 4 && (
          <>
            <circle cx={400} cy={320} r={8} fill="#ef4444" opacity={labelOpacity} />
            <text
              x={380}
              y={350}
              fill="#ef4444"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LL
            </text>
            <circle cx={600} cy={350} r={8} fill="#ef4444" opacity={labelOpacity} />
            <text
              x={580}
              y={380}
              fill="#ef4444"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LL
            </text>
            <line
              x1={400}
              y1={320}
              x2={600}
              y2={350}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={labelOpacity}
            />
          </>
        )}

        {/* Oscillator line */}
        <text
          x={60}
          y={500}
          fill="#94a3b8"
          fontSize={18}
          fontFamily="monospace"
        >
          Oscillator
        </text>
        {oscillatorPoints
          .slice(0, visibleOscillatorPoints)
          .map((point, i) => {
            if (i === 0) return null;
            const prev = oscillatorPoints[i - 1];
            return (
              <line
                key={`osc-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke="#3b82f6"
                strokeWidth={3}
                opacity={
                  chartProgress > i / oscillatorPoints.length ? 1 : 0
                }
              />
            );
          })}

        {/* Higher Lows label */}
        {visibleOscillatorPoints >= 4 && (
          <>
            <circle
              cx={400}
              cy={600}
              r={8}
              fill="#3b82f6"
              opacity={labelOpacity}
            />
            <text
              x={380}
              y={630}
              fill="#3b82f6"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HL
            </text>
            <circle
              cx={600}
              cy={520}
              r={8}
              fill="#3b82f6"
              opacity={labelOpacity}
            />
            <text
              x={580}
              y={510}
              fill="#3b82f6"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HL
            </text>
            <line
              x1={400}
              y1={600}
              x2={600}
              y2={520}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={labelOpacity}
            />
          </>
        )}
      </svg>

      {/* Explanation box */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          right: 80,
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: 12,
          padding: 30,
          opacity: interpolate(frame, [90, 120], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: "#e2e8f0",
            fontFamily: "Arial, sans-serif",
            margin: 0,
            textAlign: "center",
          }}
        >
          Price makes <strong style={{ color: "#ef4444" }}>Lower Lows</strong>{" "}
          while MACD makes{" "}
          <strong style={{ color: "#3b82f6" }}>Higher Lows</strong> — Sellers
          are losing momentum. Expect a{" "}
          <strong style={{ color: "#10b981" }}>reversal to the upside</strong>.
        </p>
      </div>
    </AbsoluteFill>
  );
};
