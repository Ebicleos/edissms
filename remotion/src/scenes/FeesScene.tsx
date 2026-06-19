import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { AppShell, useStagger } from "../components/AppShell";

const ITEMS = [
  { n: "Tuition Fee", a: 75000, p: 75000 },
  { n: "Development Levy", a: 15000, p: 15000 },
  { n: "Examination Fee", a: 8000, p: 8000 },
  { n: "Boarding Fee", a: 45000, p: 22500 },
  { n: "Books & Uniform", a: 18000, p: 0 },
];

export const FeesScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = ITEMS.reduce((a, x) => a + x.a, 0);
  const paid = ITEMS.reduce((a, x) => a + x.p, 0);
  const animPaid = interpolate(f, [10, 70], [0, paid], { extrapolateRight: "clamp" });
  const pct = (animPaid / total) * 100;
  return (
    <AppShell active="Fees" title="Fee Management — Sarah Adebayo">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { l: "Total Billed", v: total, c: theme.text },
          { l: "Paid", v: Math.round(animPaid), c: theme.success },
          { l: "Outstanding", v: total - Math.round(animPaid), c: theme.warning },
        ].map((s, i) => {
          const st = useStagger(i);
          return (
            <div key={s.l} style={{ ...st, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>{s.l}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: s.c, letterSpacing: -0.5 }}>₦{s.v.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ ...useStagger(3), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Term Progress</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.primary }}>{pct.toFixed(0)}%</div>
        </div>
        <div style={{ height: 10, background: theme.bgSoft, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#3b82f6,#2563eb)", borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ ...useStagger(4), background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "14px 20px", background: theme.panelMuted, borderBottom: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <div>Item</div><div>Billed</div><div>Paid</div><div>Status</div>
        </div>
        {ITEMS.map((it, i) => {
          const full = it.p === it.a;
          const partial = it.p > 0 && it.p < it.a;
          const st = useStagger(5 + i, 4);
          return (
            <div key={it.n} style={{ ...st, display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < ITEMS.length - 1 ? `1px solid ${theme.border}` : "none", fontSize: 14, alignItems: "center" }}>
              <div style={{ fontWeight: 500, color: theme.text }}>{it.n}</div>
              <div style={{ color: theme.text }}>₦{it.a.toLocaleString()}</div>
              <div style={{ color: full ? theme.success : theme.text, fontWeight: 600 }}>₦{it.p.toLocaleString()}</div>
              <div>
                <span style={{
                  background: full ? theme.successSoft : partial ? "#fef3c7" : "#fee2e2",
                  color: full ? theme.success : partial ? theme.warning : theme.danger,
                  fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                }}>{full ? "Paid" : partial ? "Partial" : "Unpaid"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};
