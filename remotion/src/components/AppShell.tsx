import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

const Sidebar: React.FC<{ active: string }> = ({ active }) => {
  const items = ["Dashboard", "Students", "Teachers", "Attendance", "Fees", "Exams", "Reports", "Settings"];
  return (
    <div style={{ width: 220, background: "#0f172a", color: "white", padding: "24px 14px", height: "100%", fontFamily: theme.font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#6366f1)" }} />
        <div style={{ fontWeight: 700, fontSize: 18 }}>EDISMS</div>
      </div>
      {items.map((it) => (
        <div
          key={it}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 4,
            background: it === active ? "rgba(37,99,235,0.25)" : "transparent",
            color: it === active ? "#bfdbfe" : "rgba(255,255,255,0.7)",
          }}
        >
          {it}
        </div>
      ))}
    </div>
  );
};

export const AppShell: React.FC<{ active: string; title: string; children: React.ReactNode }> = ({ active, title, children }) => {
  return (
    <div style={{ display: "flex", height: "100%", background: theme.bg, fontFamily: theme.font }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, padding: 32, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: theme.textMuted }}>Grace International Academy</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{title}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: 10, fontSize: 13, color: theme.textMuted }}>2025/2026 · Term 2</div>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg,#2563eb,#6366f1)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export const useStagger = (i: number, delay = 6) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - i * delay, fps, config: { damping: 18, stiffness: 120 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)` };
};
