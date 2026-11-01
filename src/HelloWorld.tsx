import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelloWorldProps = {
  readonly titleText: string;
  readonly titleColor: string;
};

const AUDIO_SRC =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const TITLE = "云端大片";

const PIGMENTS = [
  "#4f8fd8",
  "#e86a92",
  "#f3b64b",
  "#5cc6b4",
  "#8a6fd1",
  "#ef7e56",
  "#6fb3e8",
  "#c96fb8",
];

const BLOB_COUNT = 14;

const WatercolorBlobs: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        {/* Wet edges: turbulence displaces the pigment, seed drifts over time */}
        <filter id="watercolor" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.006 + Math.sin(t * 0.4) * 0.0015}
            numOctaves={4}
            seed={Math.floor(frame / 6)}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={140 + Math.sin(t * 0.7) * 30}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation={18} result="soft" />
          <feComposite in="soft" in2="displaced" operator="arithmetic" k1={0} k2={0.6} k3={0.5} k4={0} />
        </filter>
        {/* Paper grain */}
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={3} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.35  0 0 0 0.09 0"
          />
        </filter>
        {PIGMENTS.map((c, i) => (
          <radialGradient key={c} id={`pig-${i}`}>
            <stop offset="0%" stopColor={c} stopOpacity={0.85} />
            <stop offset="60%" stopColor={c} stopOpacity={0.45} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      <g filter="url(#watercolor)" style={{ mixBlendMode: "multiply" }}>
        {new Array(BLOB_COUNT).fill(true).map((_, i) => {
          const sx = random(`x-${i}`);
          const sy = random(`y-${i}`);
          const speed = 0.15 + random(`s-${i}`) * 0.35;
          const phase = random(`p-${i}`) * Math.PI * 2;
          const baseR = 220 + random(`r-${i}`) * 260;

          // Pigment blooms in, then keeps slowly spreading
          const bloom = interpolate(frame, [i * 6, i * 6 + 60], [0.2, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const spread = 1 + frame / 900;

          const cx =
            sx * width + Math.sin(t * speed + phase) * 180 + Math.cos(t * speed * 0.6) * 60;
          const cy =
            sy * height + Math.cos(t * speed * 0.8 + phase) * 140;

          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={baseR * bloom * spread * (1 + Math.sin(t * 0.5 + phase) * 0.12)}
              ry={baseR * 0.75 * bloom * spread * (1 + Math.cos(t * 0.4 + phase) * 0.12)}
              transform={`rotate(${(phase * 57.3 + t * 8 * speed) % 360} ${cx} ${cy})`}
              fill={`url(#pig-${i % PIGMENTS.length})`}
            />
          );
        })}
      </g>

      <rect width={width} height={height} filter="url(#paper)" />
    </svg>
  );
};

const BouncingTitle: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 30;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", flexDirection: "row" }}
    >
      {TITLE.split("").map((ch, i) => {
        const delay = start + i * 8;
        const enter = spring({
          frame: frame - delay,
          fps,
          config: { damping: 7, stiffness: 120, mass: 0.8 },
        });
        // After landing, keep a gentle repeating hop
        const hopFrame = Math.max(0, frame - delay - 40);
        const hop = Math.abs(Math.sin((hopFrame / fps) * Math.PI * 1.2 - i * 0.6));
        const idle = frame > delay + 40 ? -hop * 28 : 0;

        const y = interpolate(enter, [0, 1], [-700, 0]) + idle;
        const squash = 1 + (1 - Math.min(1, enter)) * 0.25;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: 230,
              fontWeight: 900,
              fontFamily:
                '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
              color,
              margin: "0 12px",
              opacity: frame < delay ? 0 : 1,
              transform: `translateY(${y}px) scale(${1 / squash}, ${squash})`,
              textShadow:
                "0 6px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(40,30,80,0.35)",
            }}
          >
            {ch}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};

export const HelloWorld: React.FC<HelloWorldProps> = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#fbf6ec" }}>
      <Html5Audio
        src={AUDIO_SRC}
        volume={(f) =>
          interpolate(f, [0, 20, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <WatercolorBlobs />
        <BouncingTitle color="#2b2350" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
