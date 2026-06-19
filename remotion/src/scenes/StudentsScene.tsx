import React from "react";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const STUDENTS = [
  { n: "Adebayo, Sarah", c: "JSS 2A", g: "F", a: "EDIS/2024/0142", avg: 87 },
  { n: "Okonkwo, Daniel", c: "SSS 1B", g: "M", a: "EDIS/2024/0099", avg: 78 },
  { n: "Ibrahim, Aisha", c: "JSS 3A", g: "F", a: "EDIS/2024/0210", avg: 92 },
  { n: "Mensah, Kwame", c: "SSS 2A", g: "M", a: "EDIS/2024/0058", avg: 84 },
  { n: "Chukwu, Chioma", c: "JSS 1B", g: "F", a: "EDIS/2024/0301", avg: 90 },
  { n: "Bello, Ahmed", c: "SSS 3A", g: "M", a: "EDIS/2024/0011", avg: 81 },
];

const avatarColors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export const StudentsScene: React.FC = () => {
  return (
    <AppShell active="Students" title="Students">
      <div style={{ ...useStagger(0), display: "flex", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 14, color: theme.textMuted }}>🔍 Search students by name or admission number…</div>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 14, color: theme.text, fontWeight: 500 }}>All Classes ▾</div>
        <div style={{ background: theme.primary, color: "white", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600 }}>+ Add Student</div>
      </div>
      <div style={{ ...useStagger(1), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.5fr 1fr 1fr", padding: "14px 20px", background: theme.panelMuted, borderBottom: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Student</div><div>Class</div><div>Gender</div><div>Admission No.</div><div>Average</div><div>Status</div>
        </div>
        {STUDENTS.map((s, i) => {
          const st = useStagger(2 + i, 5);
          return (
            <div key={s.a} style={{ ...st, display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.5fr 1fr 1fr", padding: "16px 20px", borderBottom: i < STUDENTS.length - 1 ? `1px solid ${theme.border}` : "none", alignItems: "center", fontSize: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: avatarColors[i], color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{s.n[0]}</div>
                <div style={{ fontWeight: 600, color: theme.text }}>{s.n}</div>
              </div>
              <div style={{ color: theme.text }}>{s.c}</div>
              <div style={{ color: theme.textMuted }}>{s.g}</div>
              <div style={{ color: theme.textMuted, fontFamily: "monospace", fontSize: 13 }}>{s.a}</div>
              <div style={{ fontWeight: 600, color: s.avg >= 85 ? theme.success : theme.text }}>{s.avg}%</div>
              <div><span style={{ background: theme.successSoft, color: theme.success, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999 }}>Active</span></div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};
