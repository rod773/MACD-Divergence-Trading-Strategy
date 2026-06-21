import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const rulesOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rules = [
    { title: "Regular = Reversal", color: "#10b981" },
    { title: "Hidden = Continuation", color: "#06b6d4" },
    { title: "Higher Timeframe = Stronger", color: "#f59e0b" },
    { title: "Wait for MACD Crossover", color: "#8b5cf6" },
    { title: "Minimum R:R 1:2", color: "#ec4899" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0e1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        <h2
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "white",
            fontFamily: "Arial, sans-serif",
            opacity: titleOpacity,
            transform: `translateY(${(1 - titleY) * 50}px)`,
            margin: 0,
            marginBottom: 60,
          }}
        >
          Key Trading Rules
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 24,
            opacity: rulesOpacity,
          }}
        >
          {rules.map((rule, i) => {
            const ruleSpring = spring({
              frame: frame - 40 - i * 10,
              fps,
              config: { damping: 100, stiffness: 200 },
            });
            return (
              <div
                key={rule.title}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: `1px solid ${rule.color}33`,
                  borderRadius: 12,
                  padding: "20px 32px",
                  opacity: ruleSpring,
                  transform: `translateY(${(1 - ruleSpring) * 30}px)`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: rule.color,
                    margin: "0 auto 12px",
                  }}
                />
                <p
                  style={{
                    fontSize: 22,
                    color: "#e2e8f0",
                    fontFamily: "Arial, sans-serif",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {rule.title}
                </p>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontSize: 20,
            color: "#64748b",
            fontFamily: "Arial, sans-serif",
            marginTop: 60,
            opacity: interpolate(frame, [100, 130], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          Educational purposes only. Trading involves substantial risk.
        </p>
      </div>
    </AbsoluteFill>
  );
};
