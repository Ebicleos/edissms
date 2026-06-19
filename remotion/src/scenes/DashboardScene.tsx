import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const STATS = [
  { label: "Total Students", value: 1247, icon: "👨‍🎓", color: "#2563eb", bg: "#dbeafe" },
  { label: "Active Teachers", value: 48, icon: "👩‍🏫", color: "#10b981", bg: "#d1fae5" },
  { label: "Fees Collected", value: "₦4.2M", icon: "💰", color: "#f59e0b", bg: "#fef3c7" },
  { label: "Attendance", value: "94.7%", icon: "✅", color: "#8b5cf6", bg: "#ede9fe" },
];

const Counter: React.FC<{ to: number; suffix?: string; prefix?: string }> = ({ to, suffix = "", prefix = "" }) => {
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [0, 50], [0, to], { extrapolateRight: "clamp" }));
  return <>{prefix}{v.toLocaleString()}{suffix}</>;
};

export const DashboardScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AppShell active="Dashboard" title="Dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {STATS.map((s, i) => {
          const st = useStagger(i);
          return (
            <div key={s.label} style={{ ...st, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.success, background: theme.successSoft, padding: "3px 8px", borderRadius: 6 }}>+12%</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>
                {typeof s.value === "number" ? <Counter to={s.value} /> : s.value}
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ ...useStagger(4), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, height: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontWeight: 600, color: theme.text, fontSize: 16 }}>Enrollment Overview</div>
            <div style={{ fontSize: 13, color: theme.textMuted }}>Last 12 months</div>
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 12, height: 220 }}>
            {[55, 68, 62, 78, 70, 85, 72, 90, 82, 95, 88, 100].map((h, i) => {
              const grow = interpolate(f, [10 + i * 2, 35 + i * 2], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "end", height: "100%" }}>
                  <div style={{ height: `${grow}%`, background: "linear-gradient(180deg,#3b82f6,#2563eb)", borderRadius: "6px 6px 0 0" }} />
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...useStagger(5), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, height: 320 }}>
          <div style={{ fontWeight: 600, color: theme.text, fontSize: 16, marginBottom: 16 }}>Recent Activity</div>
          {[
            { icon: "💳", t: "Fee payment received", s: "₦45,000 · 2m ago", c: "#10b981" },
            { icon: "✅", t: "Attendance marked", s: "JSS 2A · 5m ago", c: "#2563eb" },
            { icon: "📝", t: "Exam published", s: "Mathematics · 12m ago", c: "#f59e0b" },
            { icon: "👨‍🎓", t: "New student enrolled", s: "Sarah Adebayo · 1h ago", c: "#8b5cf6" },
          ].map((a, i) => {
            const st = useStagger(6 + i, 5);
            return (
              <div key={i} style={{ ...st, display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? `1px solid ${theme.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{a.t}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{a.s}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};
