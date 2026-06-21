import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const HiddenBullishScene: React.FC = () => {
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
    { x: 100, y: 280 },
    { x: 200, y: 220 },
    { x: 300, y: 260 },
    { x: 400, y: 190 },
    { x: 500, y: 230 },
    { x: 600, y: 160 },
    { x: 700, y: 200 },
    { x: 800, y: 140 },
  ];

  const oscillatorPoints = [
    { x: 100, y: 520 },
    { x: 200, y: 560 },
    { x: 300, y: 530 },
    { x: 400, y: 590 },
    { x: 500, y: 550 },
    { x: 600, y: 620 },
    { x: 700, y: 580 },
    { x: 800, y: 650 },
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
              backgroundColor: "#06b6d4",
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
            Hidden Bullish Divergence
          </h2>
        </div>
      </div>

      <svg
        width={900}
        height={700}
        style={{ position: "absolute", top: 150, left: 80 }}
      >
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
              stroke="#10b981"
              strokeWidth={3}
              opacity={chartProgress > i / pricePoints.length ? 1 : 0}
            />
          );
        })}

        {visiblePricePoints >= 4 && (
          <>
            <circle
              cx={400}
              cy={190}
              r={8}
              fill="#10b981"
              opacity={labelOpacity}
            />
            <text
              x={380}
              y={170}
              fill="#10b981"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HL
            </text>
            <circle
              cx={600}
              cy={160}
              r={8}
              fill="#10b981"
              opacity={labelOpacity}
            />
            <text
              x={580}
              y={140}
              fill="#10b981"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HL
            </text>
            <line
              x1={400}
              y1={190}
              x2={600}
              y2={160}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={labelOpacity}
            />
          </>
        )}

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
                stroke="#06b6d4"
                strokeWidth={3}
                opacity={
                  chartProgress > i / oscillatorPoints.length ? 1 : 0
                }
              />
            );
          })}

        {visibleOscillatorPoints >= 4 && (
          <>
            <circle
              cx={400}
              cy={590}
              r={8}
              fill="#06b6d4"
              opacity={labelOpacity}
            />
            <text
              x={380}
              y={620}
              fill="#06b6d4"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LL
            </text>
            <circle
              cx={600}
              cy={620}
              r={8}
              fill="#06b6d4"
              opacity={labelOpacity}
            />
            <text
              x={580}
              y={650}
              fill="#06b6d4"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LL
            </text>
            <line
              x1={400}
              y1={590}
              x2={600}
              y2={620}
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={labelOpacity}
            />
          </>
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          right: 80,
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          border: "1px solid rgba(6, 182, 212, 0.3)",
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
          Price makes{" "}
          <strong style={{ color: "#10b981" }}>Higher Lows</strong> while MACD
          makes <strong style={{ color: "#06b6d4" }}>Lower Lows</strong> — The
          uptrend is resuming. Expect{" "}
          <strong style={{ color: "#06b6d4" }}>continuation higher</strong>.
        </p>
      </div>
    </AbsoluteFill>
  );
};
