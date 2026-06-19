import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const OPTIONS = [
  "x = (-b ± √(b² - 4ac)) / 2a",
  "x = (-b ± √(b² + 4ac)) / 2a",
  "x = (b ± √(b² - 4ac)) / 2a",
  "x = (-b ± √(4ac - b²)) / 2a",
];
const CORRECT = 0;

export const ExamScene: React.FC = () => {
  const f = useCurrentFrame();
  const selectAt = 40;
  const submitAt = 75;
  const selected = f >= selectAt ? CORRECT : -1;
  const submitted = f >= submitAt;
  return (
    <AppShell active="Exams" title="Mathematics · Mid-Term CBT">
      <div style={{ ...useStagger(0), display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, color: theme.text }}>⏱ Time left: <b style={{ color: theme.primary }}>24:18</b></div>
        <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px", fontSize: 13 }}>Question 7 of 25</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: i < 6 ? theme.success : i === 6 ? theme.primary : theme.bgSoft, color: i <= 6 ? "white" : theme.textMuted, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
          ))}
        </div>
      </div>
      <div style={{ ...useStagger(1), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12, fontWeight: 600, letterSpacing: 0.5 }}>QUESTION 7 · 4 MARKS</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: theme.text, marginBottom: 28, lineHeight: 1.4 }}>
          What is the quadratic formula used to solve equations of the form <span style={{ fontFamily: "monospace", background: theme.bgSoft, padding: "2px 8px", borderRadius: 6 }}>ax² + bx + c = 0</span>?
        </div>
        {OPTIONS.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = submitted && i === CORRECT;
          const st = useStagger(2 + i, 4);
          return (
            <div key={i} style={{
              ...st,
              display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
              borderRadius: 12, marginBottom: 12,
              border: `2px solid ${isCorrect ? theme.success : isSelected ? theme.primary : theme.border}`,
              background: isCorrect ? theme.successSoft : isSelected ? "#eff6ff" : theme.panel,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                border: `2px solid ${isCorrect ? theme.success : isSelected ? theme.primary : theme.border}`,
                background: isSelected || isCorrect ? (isCorrect ? theme.success : theme.primary) : "transparent",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700,
              }}>
                {isCorrect ? "✓" : isSelected ? "●" : String.fromCharCode(65 + i)}
              </div>
              <div style={{ fontSize: 16, fontFamily: "monospace", color: theme.text }}>{opt}</div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};
