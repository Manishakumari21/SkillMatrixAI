import fitz
from app.core.config import get_settings

settings = get_settings()


def build_portfolio_pdf(data: dict, personal: dict) -> bytes:
    doc = fitz.open()
    page_width = settings.pdf_page_width
    page_height = settings.pdf_page_height
    page = doc.new_page(width=page_width, height=page_height)

    sidebar_w = int(page_width * settings.portfolio_sidebar_ratio)
    main_w = page_width - sidebar_w
    margin = 24
    accent = (settings.portfolio_accent_r, settings.portfolio_accent_g, settings.portfolio_accent_b)
    dark_bg = (0.118, 0.114, 0.149)
    light_text = (0.878, 0.867, 0.941)
    muted_text = (0.565, 0.545, 0.659)
    body_color = (0.157, 0.157, 0.188)
    section_color = (0.125, 0.125, 0.157)

    font_regular = settings.pdf_font_name
    font_bold = settings.pdf_font_bold

    def draw_sidebar_bg():
        page.draw_rect(
            fitz.Rect(0, 0, sidebar_w, page_height),
            color=None,
            fill=dark_bg,
        )
        page.draw_rect(
            fitz.Rect(sidebar_w, 0, sidebar_w + 1, page_height),
            color=None,
            fill=accent,
        )

    def draw_textSidebar(text, y_pos, fontsize=9, color=light_text, bold=False):
        fontname = font_bold if bold else font_regular
        page.insert_text(fitz.Point(margin, y_pos), text, fontname=fontname, fontsize=fontsize, color=color)
        return y_pos + fontsize + 4

    def draw_textMain(text, y_pos, fontsize=9, color=body_color, bold=False):
        fontname = font_bold if bold else font_regular
        page.insert_text(fitz.Point(sidebar_w + margin, y_pos), text, fontname=fontname, fontsize=fontsize, color=color)
        return y_pos + fontsize + 4

    def draw_wrappedSidebar(text, y_pos, fontsize=9, color=light_text, max_w=None):
        fontname = font_regular
        w = max_w or (sidebar_w - margin * 2)
        lines = fitz.get_text("text", fontname=fontname, fontsize=fontsize, text=text, width=w, sort=True)
        for line in lines.split("\n"):
            if line.strip():
                if y_pos > page_height - 30:
                    return y_pos
                page.insert_text(fitz.Point(margin, y_pos), line.strip(), fontname=fontname, fontsize=fontsize, color=color)
                y_pos += fontsize + 3
        return y_pos + 2

    def draw_wrappedMain(text, y_pos, fontsize=9, color=body_color, max_w=None):
        fontname = font_regular
        w = max_w or (main_w - margin * 2)
        lines = fitz.get_text("text", fontname=fontname, fontsize=fontsize, text=text, width=w, sort=True)
        for line in lines.split("\n"):
            if line.strip():
                if y_pos > page_height - 30:
                    return y_pos
                page.insert_text(fitz.Point(sidebar_w + margin, y_pos), line.strip(), fontname=fontname, fontsize=fontsize, color=color)
                y_pos += fontsize + 3
        return y_pos + 2

    def draw_sectionLineSidebar(y_pos):
        y_pos += 4
        page.draw_line(
            fitz.Point(margin, y_pos),
            fitz.Point(sidebar_w - margin, y_pos),
            color=accent, width=0.8,
        )
        return y_pos + 10

    def draw_sectionLineMain(y_pos):
        y_pos += 4
        page.draw_line(
            fitz.Point(sidebar_w + margin, y_pos),
            fitz.Point(page_width - margin, y_pos),
            color=accent, width=0.8,
        )
        return y_pos + 10

    def draw_initials_circle(y_pos):
        name = personal.get("full_name", "U")
        initials = "".join(w[0].upper() for w in name.split()[:2]) if name else "U"
        cx = sidebar_w / 2
        cy = y_pos + 28
        radius = 28
        page.draw_circle(fitz.Point(cx, cy), radius, color=None, fill=accent)
        page.insert_text(
            fitz.Point(cx - 8, cy + 5),
            initials,
            fontname=font_bold,
            fontsize=16,
            color=dark_bg,
        )
        return cy + radius + 16

    def check_page_break(y_pos, needed=60):
        nonlocal page
        if y_pos > page_height - needed:
            page = doc.new_page(width=page_width, height=page_height)
            draw_sidebar_bg()
            return margin, True
        return y_pos, False

    draw_sidebar_bg()

    sy = margin + 8
    sy = draw_initials_circle(sy)

    sy = draw_textSidebar(personal.get("full_name", ""), sy, fontsize=12, color=light_text, bold=True)
    sy = draw_textSidebar(personal.get("title", ""), sy, fontsize=9, color=accent)
    sy += 6

    sy = draw_sectionLineSidebar(sy)
    sy = draw_textSidebar("CONTACT", sy, fontsize=7, color=accent, bold=True)
    sy += 2

    contact_items = []
    if personal.get("email"):
        contact_items.append(("Email", personal["email"]))
    if personal.get("phone"):
        contact_items.append(("Phone", personal["phone"]))
    if personal.get("linkedin"):
        contact_items.append(("LinkedIn", personal["linkedin"]))
    if personal.get("github"):
        contact_items.append(("GitHub", personal["github"]))
    if personal.get("website"):
        contact_items.append(("Website", personal["website"]))

    for label, value in contact_items:
        sy = draw_textSidebar(label, sy, fontsize=6, color=muted_text)
        sy = draw_textSidebar(value, sy, fontsize=8, color=light_text)
        sy += 2

    sy += 4
    sy = draw_sectionLineSidebar(sy)
    sy = draw_textSidebar("EDUCATION", sy, fontsize=7, color=accent, bold=True)
    sy += 2

    education = data.get("education", [])
    for edu in education:
        sy, brk = check_page_break(sy, 40)
        if brk:
            draw_sidebar_bg()
        sy = draw_textSidebar(edu.get("degree", ""), sy, fontsize=8, color=light_text, bold=True)
        if edu.get("school"):
            sy = draw_textSidebar(edu["school"], sy, fontsize=7, color=muted_text)
        if edu.get("year"):
            sy = draw_textSidebar(edu["year"], sy, fontsize=7, color=muted_text)
        if edu.get("details"):
            sy = draw_wrappedSidebar(edu["details"], sy, fontsize=7, color=muted_text)
        sy += 6

    sy += 4
    sy = draw_sectionLineSidebar(sy)
    sy = draw_textSidebar("SKILLS", sy, fontsize=7, color=accent, bold=True)
    sy += 2

    skills = data.get("skills", {})
    if isinstance(skills, dict):
        for category, items in skills.items():
            sy = draw_textSidebar(category, sy, fontsize=7, color=accent, bold=True)
            sy = draw_wrappedSidebar(", ".join(items), sy, fontsize=7, color=light_text)
            sy += 4
    elif isinstance(skills, list) and skills:
        sy = draw_wrappedSidebar(", ".join(skills), sy, fontsize=7, color=light_text)

    my = margin + 8
    my = draw_textMain(personal.get("full_name", ""), my, fontsize=18, color=section_color, bold=True)
    my += 2
    my = draw_textMain(personal.get("title", ""), my, fontsize=10, color=accent)
    my += 4
    my = draw_sectionLineMain(my)

    about = data.get("about_me", "")
    if about:
        my = draw_textMain("ABOUT ME", my, fontsize=8, color=accent, bold=True)
        my += 2
        my = draw_wrappedMain(about, my, fontsize=9, color=body_color)
        my += 6
        my = draw_sectionLineMain(my)

    skills_main = data.get("skills", {})
    if skills_main:
        my = draw_textMain("SKILLS", my, fontsize=8, color=accent, bold=True)
        my += 4

        if isinstance(skills_main, dict):
            for category, items in skills_main.items():
                my, brk = check_page_break(my, 30)
                if brk:
                    draw_sidebar_bg()
                my = draw_textMain(category, my, fontsize=9, color=accent, bold=True)
                for item in items:
                    my = draw_textMain(f"  {item}", my, fontsize=8, color=body_color)
                my += 4
        elif isinstance(skills_main, list) and skills_main:
            my = draw_wrappedMain(", ".join(skills_main), my, fontsize=9, color=body_color)

        my = draw_sectionLineMain(my)

    projects = data.get("projects", [])
    if projects:
        my = draw_textMain("PROJECTS", my, fontsize=8, color=accent, bold=True)
        my += 4

        for proj in projects:
            my, brk = check_page_break(my, 50)
            if brk:
                draw_sidebar_bg()
            my = draw_textMain(proj.get("name", ""), my, fontsize=10, color=section_color, bold=True)
            my += 1
            if proj.get("description"):
                my = draw_wrappedMain(proj["description"], my, fontsize=8, color=body_color)
            if proj.get("tech"):
                my = draw_textMain(", ".join(proj["tech"]), my, fontsize=7, color=muted_text)
            my += 8

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes
