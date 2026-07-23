const DIFF_COLORS = {
  easy:   { color: "var(--ctp-green)",  bg: "rgba(166, 227, 161, 0.12)", border: "rgba(166, 227, 161, 0.25)" },
  medium: { color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.12)", border: "rgba(250, 179, 135, 0.25)" },
  hard:   { color: "var(--ctp-red)",   bg: "rgba(243, 139, 168, 0.12)", border: "rgba(243, 139, 168, 0.25)" },
  easy_cap:   { color: "var(--ctp-green)",  bg: "rgba(166, 227, 161, 0.12)", border: "rgba(166, 227, 161, 0.25)" },
  medium_cap: { color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.12)", border: "rgba(250, 179, 135, 0.25)" },
  hard_cap:   { color: "var(--ctp-red)",   bg: "rgba(243, 139, 168, 0.12)", border: "rgba(243, 139, 168, 0.25)" },
  Easy:   { color: "var(--ctp-green)",  bg: "rgba(166, 227, 161, 0.12)", border: "rgba(166, 227, 161, 0.25)" },
  Medium: { color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.12)", border: "rgba(250, 179, 135, 0.25)" },
  Hard:   { color: "var(--ctp-red)",   bg: "rgba(243, 139, 168, 0.12)", border: "rgba(243, 139, 168, 0.25)" },
};

export { DIFF_COLORS };

export default function DifficultyBadge({ difficulty, fontSize = "10px" }) {
  const s = DIFF_COLORS[difficulty] || DIFF_COLORS.medium;
  return (
    <span className="pill" style={{
      fontSize, padding: "2px 10px", borderRadius: "999px",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: "var(--font-mono)", fontWeight: 600,
    }}>
      {difficulty}
    </span>
  );
}
