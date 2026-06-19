import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "./theme";
import { IntroScene } from "./scenes/IntroScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { StudentsScene } from "./scenes/StudentsScene";
import { AttendanceScene } from "./scenes/AttendanceScene";
import { FeesScene } from "./scenes/FeesScene";
import { ExamScene } from "./scenes/ExamScene";
import { ReportScene } from "./scenes/ReportScene";
import { OutroScene } from "./scenes/OutroScene";

loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

const SCENES: { c: React.FC; d: number; caption: string }[] = [
  { c: IntroScene, d: 75, caption: "" },
  { c: DashboardScene, d: 120, caption: "Real-time school dashboard" },
  { c: StudentsScene, d: 110, caption: "Manage student records" },
  { c: AttendanceScene, d: 110, caption: "Mark attendance in seconds" },
  { c: FeesScene, d: 110, caption: "Track fees & payments" },
  { c: ExamScene, d: 110, caption: "CBT exams & auto-grading" },
  { c: ReportScene, d: 110, caption: "Generate report cards" },
  { c: OutroScene, d: 90, caption: "" },
];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

const BrowserFrame: React.FC<{ children: React.ReactNode; url: string }> = ({ children, url }) => (
  <div
    style={{
      width: 1640,
      height: 920,
      borderRadius: 20,
      overflow: "hidden",
      background: theme.panel,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18), 0 8px 20px rgba(15, 23, 42, 0.08)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        height: 48,
        background: theme.panelMuted,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 13, height: 13, borderRadius: 999, background: "#ff5f57" }} />
        <div style={{ width: 13, height: 13, borderRadius: 999, background: "#febc2e" }} />
        <div style={{ width: 13, height: 13, borderRadius: 999, background: "#28c840" }} />
      </div>
      <div
        style={{
          marginLeft: 20,
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: "5px 14px",
          fontFamily: theme.font,
          fontSize: 13,
          color: theme.textMuted,
          minWidth: 380,
        }}
      >
        🔒 {url}
      </div>
    </div>
    <div style={{ flex: 1, overflow: "hidden", background: theme.panel }}>{children}</div>
  </div>
);

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = spring({ frame: f, fps, config: { damping: 200 } });
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: theme.font,
        fontWeight: 600,
        fontSize: 28,
        color: theme.text,
        letterSpacing: -0.3,
        opacity: o,
        transform: `translateY(${interpolate(o, [0, 1], [12, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const MainVideo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: theme.font }}>
      <BackgroundDecor />
      {SCENES.map((s, i) => {
        const seq = (
          <Sequence key={i} from={from} durationInFrames={s.d}>
            {i === 0 || i === SCENES.length - 1 ? (
              <s.c />
            ) : (
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
                <BrowserFrame url={`app.edissms.com${urlForScene(i)}`}>
                  <s.c />
                </BrowserFrame>
                <Caption text={s.caption} />
              </AbsoluteFill>
            )}
          </Sequence>
        );
        from += s.d;
        return seq;
      })}
    </AbsoluteFill>
  );
};

function urlForScene(i: number) {
  return ["", "/dashboard", "/students", "/attendance", "/fees", "/exams", "/reports", ""][i] || "/";
}

const BackgroundDecor: React.FC = () => {
  const f = useCurrentFrame();
  const y1 = Math.sin(f / 60) * 20;
  const y2 = Math.cos(f / 80) * 25;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: -200 + y1,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(37,99,235,0.10), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -250 + y2,
          right: -200,
          width: 900,
          height: 900,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
    </AbsoluteFill>
  );
};
