import io
import base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from app.core.config import get_settings

settings = get_settings()


# ── Theme Colors ────────────────────────────────────────────────────
C = {
    "bg": settings.color_bg,
    "surface": settings.color_surface,
    "text": settings.color_text,
    "subtext": settings.color_subtext,
    "overlay": settings.color_overlay,
    "accent1": settings.color_accent1,
    "accent2": settings.color_accent2,
    "green": settings.color_green,
    "yellow": settings.color_yellow,
    "red": settings.color_red,
    "blue": settings.color_blue,
    "peach": settings.color_peach,
}


def _to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=settings.chart_dpi, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def _score_color(score, good=70, mid=40):
    if score >= good:
        return C["green"]
    elif score >= mid:
        return C["yellow"]
    return C["red"]


# ── ATS Score Charts ──────────────────────────────────────────────

def generate_ats_radar(breakdown: dict) -> str | None:
    labels = []
    values = []
    for key, val in breakdown.items():
        labels.append(key.replace("_", " ").title())
        values.append(val["score"] / 100.0)

    if not labels:
        return None

    N = len(labels)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    values_plot = values + [values[0]]
    angles += [angles[0]]

    fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    ax.fill(angles, values_plot, color=C["accent1"], alpha=0.15)
    ax.plot(angles, values_plot, color=C["accent2"], linewidth=2.5, marker="o", markersize=6, markerfacecolor=C["accent2"], markeredgecolor=C["bg"], markeredgewidth=1.5)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, color=C["text"], fontsize=9, fontfamily="monospace", fontweight="bold")
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["25", "50", "75", "100"], color=C["overlay"], fontsize=7, fontfamily="monospace")
    ax.set_ylim(0, 1.05)
    ax.spines["polar"].set_color(C["surface"])
    ax.grid(color=C["surface"], linewidth=0.5)
    ax.tick_params(colors=C["overlay"])
    ax.set_title("ATS Score Breakdown", color=C["text"], fontsize=13, fontweight="bold", pad=20, fontfamily="monospace")

    for angle, val, label in zip(angles[:-1], values, labels):
        score = int(val * 100)
        color = _score_color(score)
        ax.text(angle, val + 0.08, f"{score}", ha="center", va="bottom", color=color, fontsize=10, fontweight="bold", fontfamily="monospace")

    return _to_base64(fig)


def generate_ats_gauge(score: int) -> str | None:
    fig, ax = plt.subplots(figsize=(4, 2.5))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    theta_bg = np.linspace(np.pi, 0, 100)
    theta_fill = np.linspace(np.pi, np.pi - (score / 100) * np.pi, 100)

    r = 1.0
    ax.plot(r * np.cos(theta_bg), r * np.sin(theta_bg), color=C["surface"], linewidth=14, solid_capstyle="round")

    color = _score_color(score)
    ax.plot(r * np.cos(theta_fill), r * np.sin(theta_fill), color=color, linewidth=14, solid_capstyle="round")

    ax.text(0, -0.1, f"{score}", ha="center", va="center", color=C["text"], fontsize=28, fontweight="bold", fontfamily="monospace")
    ax.text(0, -0.45, "ATS SCORE", ha="center", va="center", color=C["overlay"], fontsize=9, fontfamily="monospace", fontweight="bold")

    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-0.6, 1.1)
    ax.set_aspect("equal")
    ax.axis("off")

    return _to_base64(fig)


# ── Skill Gap Charts ──────────────────────────────────────────────

def generate_skill_gap_chart(matched_skills, missing_skills, semantic_matches=None):
    all_job_skills = matched_skills + missing_skills
    if semantic_matches:
        for m in semantic_matches:
            if m.get("job_skill") and m["job_skill"] not in all_job_skills:
                all_job_skills.append(m["job_skill"])

    if not all_job_skills:
        return None

    matched_count = len(matched_skills)
    semantic_count = len(semantic_matches) if semantic_matches else 0
    missing_count = len(missing_skills)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5), gridspec_kw={"width_ratios": [2, 1]})
    fig.patch.set_facecolor(C["bg"])

    ax1 = axes[0]
    ax1.set_facecolor(C["bg"])
    categories = ["Matched", "Semantic", "Missing"]
    counts = [matched_count, semantic_count, missing_count]
    colors = [C["green"], C["blue"], C["red"]]
    bars = ax1.bar(categories, counts, color=colors, width=0.55, edgecolor="none", zorder=3)
    ax1.set_ylabel("Number of Skills", color=C["text"], fontsize=11, fontfamily="monospace")
    ax1.set_title("Skill Coverage Analysis", color=C["text"], fontsize=13, fontweight="bold", pad=15, fontfamily="monospace")
    ax1.tick_params(colors=C["subtext"], labelsize=10)
    ax1.spines["top"].set_visible(False)
    ax1.spines["right"].set_visible(False)
    ax1.spines["left"].set_color(C["surface"])
    ax1.spines["bottom"].set_color(C["surface"])
    ax1.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
    ax1.set_axisbelow(True)
    ax1.grid(axis="y", color=C["surface"], linewidth=0.5, zorder=0)

    for bar, count in zip(bars, counts):
        if count > 0:
            ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.2, str(count), ha="center", va="bottom", color=C["text"], fontsize=12, fontweight="bold", fontfamily="monospace")

    ax2 = axes[1]
    ax2.set_facecolor(C["bg"])
    sizes = [matched_count, semantic_count, missing_count]
    donut_colors = [C["green"], C["blue"], C["red"]]
    active_sizes = [s for s in sizes if s > 0]
    active_colors = [c for s, c in zip(sizes, donut_colors) if s > 0]

    if sum(active_sizes) > 0:
        wedges, _ = ax2.pie(active_sizes, colors=active_colors, startangle=90, wedgeprops=dict(width=0.4, edgecolor=C["bg"], linewidth=2))

    total = len(all_job_skills)
    match_pct = round((matched_count + semantic_count) / total * 100) if total > 0 else 0
    ax2.text(0, 0.05, f"{match_pct}%", ha="center", va="center", color=C["text"], fontsize=22, fontweight="bold", fontfamily="monospace")
    ax2.text(0, -0.15, "covered", ha="center", va="center", color=C["subtext"], fontsize=9, fontfamily="monospace")

    legend_patches = [
        mpatches.Patch(color=C["green"], label=f"Matched ({matched_count})"),
        mpatches.Patch(color=C["blue"], label=f"Semantic ({semantic_count})"),
        mpatches.Patch(color=C["red"], label=f"Missing ({missing_count})"),
    ]
    ax2.legend(handles=legend_patches, loc="lower center", bbox_to_anchor=(0.5, -0.15), ncol=3, fontsize=9, frameon=False, labelcolor=C["subtext"])

    plt.tight_layout(pad=2)
    return _to_base64(fig)


def generate_skill_match_bars(skill_details: list) -> str | None:
    if not skill_details:
        return None

    skills = [d["skill"] for d in skill_details[:settings.max_skill_bars]]
    percentages = [d["match_percentage"] for d in skill_details[:settings.max_skill_bars]]
    statuses = [d["status"] for d in skill_details[:settings.max_skill_bars]]

    color_map = {"matched": C["green"], "semantic": C["blue"], "missing": C["red"]}
    colors = [color_map.get(s, C["overlay"]) for s in statuses]

    fig, ax = plt.subplots(figsize=(10, max(3, len(skills) * 0.45)))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    y_pos = np.arange(len(skills))
    bars = ax.barh(y_pos, percentages, color=colors, height=0.6, edgecolor="none", zorder=3)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(skills, color=C["text"], fontsize=9, fontfamily="monospace")
    ax.set_xlabel("Match %", color=C["text"], fontsize=10, fontfamily="monospace")
    ax.set_title("Per-Skill Match Breakdown", color=C["text"], fontsize=13, fontweight="bold", pad=15, fontfamily="monospace")
    ax.set_xlim(0, 110)
    ax.invert_yaxis()
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(C["surface"])
    ax.spines["bottom"].set_color(C["surface"])
    ax.tick_params(colors=C["subtext"], labelsize=9)
    ax.set_axisbelow(True)
    ax.grid(axis="x", color=C["surface"], linewidth=0.5, zorder=0)

    for bar, pct in zip(bars, percentages):
        label_color = _score_color(pct)
        ax.text(bar.get_width() + 1.5, bar.get_y() + bar.get_height() / 2, f"{pct:.0f}%", va="center", color=label_color, fontsize=9, fontweight="bold", fontfamily="monospace")

    legend_patches = [
        mpatches.Patch(color=C["green"], label="Exact Match"),
        mpatches.Patch(color=C["blue"], label="Semantic Match"),
        mpatches.Patch(color=C["red"], label="Missing"),
    ]
    ax.legend(handles=legend_patches, loc="lower right", fontsize=8, frameon=False, labelcolor=C["subtext"])

    plt.tight_layout()
    return _to_base64(fig)


def generate_radar_chart(matched_skills, missing_skills, job_skills_all):
    categories = sorted(set(job_skills_all))[:settings.max_radar_categories]
    if not categories:
        return None

    resume_set = set(matched_skills)
    values = [1.0 if s in resume_set else 0.0 for s in categories]
    values.append(values[0])

    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles.append(angles[0])

    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    ax.fill(angles, values, color=C["accent1"], alpha=0.15)
    ax.plot(angles, values, color=C["accent2"], linewidth=2)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, color=C["text"], fontsize=8, fontfamily="monospace")
    ax.set_yticks([0, 0.5, 1])
    ax.set_yticklabels(["0%", "50%", "100%"], color=C["overlay"], fontsize=7, fontfamily="monospace")
    ax.spines["polar"].set_color(C["surface"])
    ax.tick_params(colors=C["subtext"])
    ax.set_title("Skill Coverage Radar", color=C["text"], fontsize=12, fontweight="bold", pad=20, fontfamily="monospace")

    return _to_base64(fig)


# ── Roadmap Charts ────────────────────────────────────────────────

def generate_roadmap_demand_chart(roadmap: list) -> str | None:
    if not roadmap:
        return None

    skills = [r["skill"] for r in roadmap[:settings.max_roadmap_skills]]
    demand = [r["demand_percentage"] for r in roadmap[:settings.max_roadmap_skills]]

    fig, ax = plt.subplots(figsize=(10, max(3, len(skills) * 0.5)))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    y_pos = np.arange(len(skills))
    colors = []
    for d in demand:
        if d >= 70:
            colors.append(C["red"])
        elif d >= 40:
            colors.append(C["yellow"])
        else:
            colors.append(C["peach"])

    bars = ax.barh(y_pos, demand, color=colors, height=0.6, edgecolor="none", zorder=3)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(skills, color=C["text"], fontsize=9, fontfamily="monospace")
    ax.set_xlabel("Demand %", color=C["text"], fontsize=10, fontfamily="monospace")
    ax.set_title("Skill Demand from Job Postings", color=C["text"], fontsize=13, fontweight="bold", pad=15, fontfamily="monospace")
    ax.set_xlim(0, 110)
    ax.invert_yaxis()
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(C["surface"])
    ax.spines["bottom"].set_color(C["surface"])
    ax.tick_params(colors=C["subtext"], labelsize=9)
    ax.set_axisbelow(True)
    ax.grid(axis="x", color=C["surface"], linewidth=0.5, zorder=0)

    for bar, pct in zip(bars, demand):
        ax.text(bar.get_width() + 1.5, bar.get_y() + bar.get_height() / 2, f"{pct:.0f}%", va="center", color=C["yellow"], fontsize=9, fontweight="bold", fontfamily="monospace")

    plt.tight_layout()
    return _to_base64(fig)


def generate_relevance_pie(relevance_score: float) -> str | None:
    fig, ax = plt.subplots(figsize=(4, 4))
    fig.patch.set_facecolor(C["bg"])
    ax.set_facecolor(C["bg"])

    sizes = [relevance_score, 100 - relevance_score]
    color_match = _score_color(relevance_score, good=60, mid=30)
    colors = [color_match, C["surface"]]

    wedges, _ = ax.pie(sizes, colors=colors, startangle=90, wedgeprops=dict(width=0.35, edgecolor=C["bg"], linewidth=2))

    ax.text(0, 0.05, f"{relevance_score:.0f}%", ha="center", va="center", color=C["text"], fontsize=20, fontweight="bold", fontfamily="monospace")
    ax.text(0, -0.18, "relevance", ha="center", va="center", color=C["subtext"], fontsize=9, fontfamily="monospace")

    ax.set_title("Resume-JD Alignment", color=C["text"], fontsize=11, fontweight="bold", pad=10, fontfamily="monospace")

    return _to_base64(fig)
