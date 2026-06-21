import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const IntroScene: React.FC = () => {
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

  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [0, 90], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0e1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "white",
            fontFamily: "Arial, sans-serif",
            opacity: titleOpacity,
            transform: `translateY(${(1 - titleY) * 50}px)`,
            margin: 0,
          }}
        >
          MACD Divergence
        </h1>
        <div
          style={{
            width: `${lineWidth}%`,
            height: 4,
            background: "linear-gradient(90deg, #10b981, #06b6d4)",
            margin: "20px auto",
            borderRadius: 2,
          }}
        />
        <p
          style={{
            fontSize: 32,
            color: "#94a3b8",
            fontFamily: "Arial, sans-serif",
            opacity: subtitleOpacity,
            margin: 0,
          }}
        >
          A Complete Guide to Reversal & Continuation Signals
        </p>
      </div>
    </AbsoluteFill>
  );
};
