import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const SUBJECTS = [
  { n: "Mathematics", ca: 28, ex: 56, g: "A", p: "Excellent" },
  { n: "English Language", ca: 25, ex: 50, g: "B", p: "Very Good" },
  { n: "Physics", ca: 27, ex: 58, g: "A", p: "Excellent" },
  { n: "Chemistry", ca: 24, ex: 48, g: "B", p: "Good" },
  { n: "Biology", ca: 29, ex: 60, g: "A", p: "Outstanding" },
  { n: "Civic Education", ca: 22, ex: 45, g: "B", p: "Good" },
];

const gradeColor = (g: string) => g === "A" ? theme.success : g === "B" ? theme.primary : theme.warning;

export const ReportScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AppShell active="Reports" title="Report Card · Sarah Adebayo · JSS 2A">
      <div style={{ ...useStagger(0), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 18, borderBottom: `2px solid ${theme.border}` }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 20 }}>GA</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>Grace International Academy</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>Term 2 · 2025/2026 Academic Session</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: theme.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Class Position</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.primary }}>3<span style={{ fontSize: 18 }}>rd</span></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 2fr", padding: "12px 16px", background: theme.panelMuted, borderRadius: 8, fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          <div>Subject</div><div>C.A. (30)</div><div>Exam (70)</div><div>Total</div><div>Grade</div><div>Remark</div>
        </div>
        {SUBJECTS.map((s, i) => {
          const total = s.ca + s.ex;
          const animTotal = Math.round(interpolate(f, [15 + i * 4, 45 + i * 4], [0, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
          const st = useStagger(1 + i, 4);
          return (
            <div key={s.n} style={{ ...st, display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 2fr", padding: "12px 16px", alignItems: "center", fontSize: 14, borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ fontWeight: 600, color: theme.text }}>{s.n}</div>
              <div style={{ color: theme.text }}>{s.ca}</div>
              <div style={{ color: theme.text }}>{s.ex}</div>
              <div style={{ fontWeight: 700, color: theme.text }}>{animTotal}</div>
              <div><span style={{ background: `${gradeColor(s.g)}20`, color: gradeColor(s.g), fontWeight: 700, padding: "3px 10px", borderRadius: 999, fontSize: 13 }}>{s.g}</span></div>
              <div style={{ color: theme.textMuted, fontSize: 13 }}>{s.p}</div>
            </div>
          );
        })}
        <div style={{ ...useStagger(8), marginTop: 20, padding: 18, background: theme.successSoft, borderRadius: 12, borderLeft: `4px solid ${theme.success}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.success, textTransform: "uppercase", marginBottom: 6 }}>Average · 85.5% · Grade A</div>
          <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.5 }}>Sarah has shown remarkable improvement this term. Excellent performance — keep it up!</div>
        </div>
      </div>
    </AppShell>
  );
};
