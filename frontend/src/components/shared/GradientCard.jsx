export default function GradientCard({ variant = "default", children, ...props }) {
  const barClass = variant === "cool" ? "card-gradient-bar-cool"
    : variant === "warm" ? "card-gradient-bar-warm"
    : "card-gradient-bar";

  return (
    <div className="card" {...props}>
      <div className={barClass} />
      <div className="card-body">{children}</div>
    </div>
  );
}
