import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const WhatIsDivergenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const contentOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const bullet1 = spring({
    frame: frame - 40,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const bullet2 = spring({
    frame: frame - 55,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const bullet3 = spring({
    frame: frame - 70,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0e1a",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div style={{ maxWidth: 1200, width: "100%" }}>
        <h2
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "white",
            fontFamily: "Arial, sans-serif",
            opacity: titleOpacity,
            margin: 0,
            marginBottom: 60,
          }}
        >
          What is MACD Divergence?
        </h2>

        <div style={{ opacity: contentOpacity }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: 40,
              transform: `translateX(${(1 - bullet1) * 100}px)`,
              opacity: bullet1,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                marginTop: 12,
                marginRight: 24,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: 28,
                color: "#e2e8f0",
                fontFamily: "Arial, sans-serif",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#10b981" }}>Regular Divergence</strong>{" "}
              signals a potential <strong>REVERSAL</strong> — the current trend
              may be ending
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: 40,
              transform: `translateX(${(1 - bullet2) * 100}px)`,
              opacity: bullet2,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#06b6d4",
                marginTop: 12,
                marginRight: 24,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: 28,
                color: "#e2e8f0",
                fontFamily: "Arial, sans-serif",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#06b6d4" }}>Hidden Divergence</strong>{" "}
              signals a <strong>CONTINUATION</strong> — the trend is resuming
              after a pullback
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: 40,
              transform: `translateX(${(1 - bullet3) * 100}px)`,
              opacity: bullet3,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#f59e0b",
                marginTop: 12,
                marginRight: 24,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: 28,
                color: "#e2e8f0",
                fontFamily: "Arial, sans-serif",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#f59e0b" }}>MACD</strong> (Moving
              Average Convergence Divergence) is the oscillator used to detect
              these patterns
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
