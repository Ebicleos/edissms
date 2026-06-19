import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

export const OutroScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 100 } });
  const s2 = spring({ frame: f - 15, fps, config: { damping: 18, stiffness: 100 } });
  const s3 = spring({ frame: f - 30, fps, config: { damping: 14, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: theme.font }}>
      <div style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`, fontSize: 22, fontWeight: 600, color: theme.primary, marginBottom: 16 }}>EDISMS</div>
      <div style={{ opacity: s2, transform: `translateY(${interpolate(s2, [0, 1], [20, 0])}px)`, fontSize: 72, fontWeight: 800, color: theme.text, letterSpacing: -2, textAlign: "center", maxWidth: 1200, lineHeight: 1.1 }}>
        Modern school management,<br/>built for Nigerian schools.
      </div>
      <div style={{ opacity: s3, transform: `translateY(${interpolate(s3, [0, 1], [16, 0])}px)`, marginTop: 40, display: "flex", gap: 16 }}>
        <div style={{ background: theme.primary, color: "white", padding: "18px 36px", borderRadius: 14, fontSize: 20, fontWeight: 600, boxShadow: "0 14px 40px rgba(37,99,235,0.35)" }}>Start Free Trial →</div>
        <div style={{ background: theme.panel, color: theme.text, border: `1px solid ${theme.border}`, padding: "18px 36px", borderRadius: 14, fontSize: 20, fontWeight: 600 }}>edissms.com</div>
      </div>
    </AbsoluteFill>
  );
};
