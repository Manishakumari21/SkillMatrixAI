import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import Layout from "../components/Layout";
import client from "../api/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const catppuccin = {
  mauve: "#cba6f7",
  blue: "#89b4fa",
  green: "#a6e3a1",
  peach: "#fab387",
  red: "#f38ba8",
  sky: "#89dceb",
  teal: "#94e2d5",
  yellow: "#f9e2af",
  surface0: "#313244",
  surface1: "#45475a",
  overlay0: "#6c7086",
  overlay1: "#7f849c",
  text: "#cdd6f4",
  subtext0: "#a6adc8",
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: catppuccin.subtext0,
        font: { family: "'JetBrains Mono', monospace", size: 11 },
      },
    },
    tooltip: {
      backgroundColor: catppuccin.surface0,
      titleColor: catppuccin.text,
      bodyColor: catppuccin.subtext0,
      borderColor: catppuccin.surface1,
      borderWidth: 1,
      titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, color, cardClass }) {
  return (
    <div className={`stat-card ${cardClass}`}>
      <div className="label">{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "30px",
          fontWeight: 700,
          color,
          marginTop: "4px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ProgressTracker() {
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/progress/skill-trend")
      .then((r) => setTrend(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const matchChartData = trend?.match_trend?.length
    ? {
        labels: trend.match_trend.map((e) => formatDate(e.timestamp)),
        datasets: [
          {
            label: "Match %",
            data: trend.match_trend.map((e) => e.match_percentage),
            borderColor: catppuccin.mauve,
            backgroundColor: "rgba(203, 166, 247, 0.1)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: catppuccin.mauve,
            pointBorderColor: catppuccin.mauve,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null;

  const matchChartOptions = {
    ...chartDefaults,
    scales: {
      x: {
        ticks: { color: catppuccin.overlay0, font: { family: "'JetBrains Mono', monospace", size: 10 } },
        grid: { color: "rgba(205, 214, 244, 0.04)" },
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: catppuccin.overlay0, font: { family: "'JetBrains Mono', monospace", size: 10 }, callback: (v) => v + "%" },
        grid: { color: "rgba(205, 214, 244, 0.04)" },
      },
    },
  };

  const demandChartData = trend?.demand_trend?.length
    ? {
        labels: trend.demand_trend.map((s) => s.skill),
        datasets: [
          {
            label: "Demand %",
            data: trend.demand_trend.map((s) => s.demand_percentage),
            backgroundColor: trend.demand_trend.map((_, i) => {
              const colors = [catppuccin.mauve, catppuccin.blue, catppuccin.teal, catppuccin.peach, catppuccin.green, catppuccin.sky];
              return colors[i % colors.length];
            }),
            borderColor: "transparent",
            borderRadius: 6,
          },
        ],
      }
    : null;

  const demandChartOptions = {
    ...chartDefaults,
    indexAxis: "y",
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: catppuccin.overlay0, font: { family: "'JetBrains Mono', monospace", size: 10 }, callback: (v) => v + "%" },
        grid: { color: "rgba(205, 214, 244, 0.04)" },
      },
      y: {
        ticks: { color: catppuccin.subtext0, font: { family: "'JetBrains Mono', monospace", size: 11 } },
        grid: { display: false },
      },
    },
  };

  const doughnutData = trend
    ? {
        labels: ["Learned", "Remaining Gaps"],
        datasets: [
          {
            data: [trend.total_learned || 0, Math.max((trend.total_learned || 0) * 2, 10) - (trend.total_learned || 0)],
            backgroundColor: [catppuccin.green, catppuccin.surface0],
            borderColor: [catppuccin.green, catppuccin.surface1],
            borderWidth: 1,
          },
        ],
      }
    : null;

  const doughnutOptions = {
    ...chartDefaults,
    cutout: "65%",
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        ...chartDefaults.plugins.legend,
        position: "bottom",
      },
    },
  };

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">Progress Tracker</h1>
          <p className="section-subtitle">
            Your career development journey at a glance. Data builds up as you use Skill Gap, Roadmap, and Mock Interview.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px",
        }}>
          <div style={{ padding: "14px 18px", background: "rgba(137, 180, 250, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(137, 180, 250, 0.15)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-sky)", marginBottom: "4px" }}>Match Score Trend</div>
            <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", lineHeight: 1.5 }}>Shows how your skill match % changes as you run Skill Gap analyses against different job descriptions.</div>
          </div>
          <div style={{ padding: "14px 18px", background: "rgba(250, 179, 135, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(250, 179, 135, 0.15)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-peach)", marginBottom: "4px" }}>Skill Demand</div>
            <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", lineHeight: 1.5 }}>Shows what skills the market wants, based on the job descriptions you've analyzed in Roadmap.</div>
          </div>
          <div style={{ padding: "14px 18px", background: "rgba(166, 227, 161, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(166, 227, 161, 0.15)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-green)", marginBottom: "4px" }}>Skill Growth</div>
            <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", lineHeight: 1.5 }}>Tracks skills you've marked as "learned" via the Mark Learned button in Skill Gap analysis.</div>
          </div>
        </div>

        {trend && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            <StatCard label="Gap Analyses" value={trend.total_gap_analyses} color={catppuccin.sky} cardClass="stat-card-sky" />
            <StatCard label="Skills Learned" value={trend.total_learned} color={catppuccin.green} cardClass="stat-card-green" />
            <StatCard label="Demand Snapshots" value={trend.total_demand_snapshots} color={catppuccin.peach} cardClass="stat-card-peach" />
            <StatCard
              label="Latest Match"
              value={
                trend.match_trend?.length
                  ? trend.match_trend[trend.match_trend.length - 1].match_percentage + "%"
                  : "--"
              }
              color={catppuccin.mauve}
              cardClass="stat-card-mauve"
            />
          </div>
        )}

        {!loading && trend?.match_trend?.length > 0 && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-gradient-bar" />
            <div className="card-body">
              <div className="label" style={{ marginBottom: "16px" }}>
                Match Score Trend
              </div>
              <div style={{ height: "280px" }}>
                <Line data={matchChartData} options={matchChartOptions} />
              </div>
            </div>
          </div>
        )}

        {!loading && trend?.demand_trend?.length > 0 && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-gradient-bar-warm" />
            <div className="card-body">
              <div className="label" style={{ marginBottom: "16px" }}>
                Skill Demand (Latest Roadmap)
              </div>
              <div style={{ height: `${Math.max(trend.demand_trend.length * 40 + 40, 200)}px` }}>
                <Bar data={demandChartData} options={demandChartOptions} />
              </div>
            </div>
          </div>
        )}

        {!loading && trend && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div className="card">
              <div className="card-body">
                <div className="label" style={{ marginBottom: "16px" }}>
                  Skill Growth
                </div>
                <div style={{ height: "220px", display: "flex", justifyContent: "center" }}>
                  {trend.total_learned > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: catppuccin.overlay0,
                        fontSize: "13px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Mark skills as learned to see growth
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="label" style={{ marginBottom: "16px" }}>
                  Recent Activity
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {trend.skill_timeline?.length > 0 ? (
                    trend.skill_timeline
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((entry, i) => (
                        <div
                          key={i}
                          className="result-item"
                          style={{ padding: "10px 14px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              className="tag tag-matched"
                              style={{ fontSize: "11px" }}
                            >
                              {entry.skill}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: catppuccin.overlay0,
                              }}
                            >
                              {formatDate(entry.learned_at)}
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: catppuccin.overlay0,
                        fontSize: "13px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      No activity yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && trend?.match_trend?.length === 0 && trend?.demand_trend?.length === 0 && (
          <div className="card">
            <div
              className="card-body"
              style={{ textAlign: "center", padding: "48px" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ctp-overlay0)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "16px" }}
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ctp-text)", marginBottom: "8px" }}>
                No data yet
              </div>
              <div style={{ fontSize: "12px", color: "var(--ctp-overlay0)", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
                Run a <strong style={{ color: "var(--ctp-sky)" }}>Skill Gap</strong> analysis to start tracking match trends.
                Generate a <strong style={{ color: "var(--ctp-peach)" }}>Roadmap</strong> to see market demand.
                Mark skills as <strong style={{ color: "var(--ctp-green)" }}>learned</strong> to track growth.
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="card">
            <div
              className="card-body"
              style={{ textAlign: "center", padding: "48px" }}
            >
              <span className="spinner" />
              <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)", marginTop: "12px" }}>
                Loading progress data...
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
