import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const ROSTER = ["Sarah A.", "Daniel O.", "Aisha I.", "Kwame M.", "Chioma C.", "Ahmed B.", "Tunde A.", "Grace E.", "Femi O.", "Zainab Y."];

export const AttendanceScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AppShell active="Attendance" title="Mark Attendance — JSS 2A">
      <div style={{ ...useStagger(0), display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 14 }}>📅 Today · Mon, Mar 17</div>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 14 }}>Morning Session</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 14, color: theme.textMuted }}>Present: <b style={{ color: theme.success }}>{Math.min(10, Math.max(0, Math.floor(interpolate(f, [10, 90], [0, 10]))))}/10</b></div>
      </div>
      <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20 }}>
        {ROSTER.map((name, i) => {
          const checkAt = 12 + i * 7;
          const checked = f >= checkAt;
          const pulse = interpolate(f, [checkAt, checkAt + 8], [1.3, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const st = useStagger(i, 3);
          return (
            <div key={name} style={{ ...st, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderBottom: i < ROSTER.length - 1 ? `1px solid ${theme.border}` : "none" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: "#dbeafe", color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{name[0]}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{name}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  transform: checked ? `scale(${pulse})` : "scale(1)",
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: checked ? theme.success : theme.successSoft, color: checked ? "white" : theme.success, fontSize: 18, fontWeight: 700,
                  transition: "all 0.2s",
                }}>✓</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: 0.5 }}>✕</div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};
