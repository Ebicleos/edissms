import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

export const IntroScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 100 } });
  const titleY = interpolate(s, [0, 1], [30, 0]);
  const fade = interpolate(f, [55, 75], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: s, transform: `translateY(${titleY}px)` }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(135deg, #2563eb, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 50px rgba(37,99,235,0.35)",
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, color: theme.text, letterSpacing: -2 }}>EDISMS</div>
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 32,
          fontWeight: 500,
          color: theme.textMuted,
          opacity: interpolate(f, [15, 35], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        School Management, Simplified.
      </div>
    </AbsoluteFill>
  );
};
