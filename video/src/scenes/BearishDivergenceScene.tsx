import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const BearishDivergenceScene: React.FC = () => {
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
    { x: 100, y: 300 },
    { x: 200, y: 220 },
    { x: 300, y: 260 },
    { x: 400, y: 180 },
    { x: 500, y: 230 },
    { x: 600, y: 150 },
    { x: 700, y: 210 },
    { x: 800, y: 280 },
  ];

  const oscillatorPoints = [
    { x: 100, y: 550 },
    { x: 200, y: 500 },
    { x: 300, y: 530 },
    { x: 400, y: 480 },
    { x: 500, y: 510 },
    { x: 600, y: 540 },
    { x: 700, y: 570 },
    { x: 800, y: 610 },
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
              backgroundColor: "#ef4444",
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
              SELL
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
            Bearish Divergence
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
              cy={180}
              r={8}
              fill="#10b981"
              opacity={labelOpacity}
            />
            <text
              x={380}
              y={160}
              fill="#10b981"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HH
            </text>
            <circle
              cx={600}
              cy={150}
              r={8}
              fill="#10b981"
              opacity={labelOpacity}
            />
            <text
              x={580}
              y={130}
              fill="#10b981"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              HH
            </text>
            <line
              x1={400}
              y1={180}
              x2={600}
              y2={150}
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
                stroke="#3b82f6"
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
              cy={480}
              r={8}
              fill="#3b82f6"
              opacity={labelOpacity}
            />
            <text
              x={380}
              y={460}
              fill="#3b82f6"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LH
            </text>
            <circle
              cx={600}
              cy={540}
              r={8}
              fill="#3b82f6"
              opacity={labelOpacity}
            />
            <text
              x={580}
              y={560}
              fill="#3b82f6"
              fontSize={16}
              fontFamily="monospace"
              opacity={labelOpacity}
            >
              LH
            </text>
            <line
              x1={400}
              y1={480}
              x2={600}
              y2={540}
              stroke="#3b82f6"
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
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
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
          <strong style={{ color: "#10b981" }}>Higher Highs</strong> while MACD
          makes <strong style={{ color: "#3b82f6" }}>Lower Highs</strong> —
          Buyers are losing momentum. Expect a{" "}
          <strong style={{ color: "#ef4444" }}>reversal to the downside</strong>.
        </p>
      </div>
    </AbsoluteFill>
  );
};
