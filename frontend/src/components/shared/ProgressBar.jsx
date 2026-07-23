export default function ProgressBar({ percent, height = "6px", gradient, className = "" }) {
  const bg = gradient || (percent >= 70
    ? "linear-gradient(90deg, var(--ctp-green), var(--ctp-teal))"
    : percent >= 40
      ? "linear-gradient(90deg, var(--ctp-peach), var(--ctp-gold))"
      : "linear-gradient(90deg, var(--ctp-peach), var(--ctp-red))");

  return (
    <div className={`progress-track ${className}`} style={{ height }}>
      <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: bg }} />
    </div>
  );
}
