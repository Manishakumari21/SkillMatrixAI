import { useState } from "react";
import Layout from "../components/Layout";
import client from "../api/client";

const emptyExperience = { title: "", company: "", dates: "", bullets: [""] };
const emptyEducation = { degree: "", school: "", dates: "", details: "" };

function SectionHeader({ children, color = "var(--ctp-mauve)" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "16px",
        marginTop: "28px",
      }}
    >
      <div
        style={{
          height: "1px",
          flex: 1,
          background: "var(--border-default)",
        }}
      />
      <div
        className="label"
        style={{
          margin: 0,
          whiteSpace: "nowrap",
          color,
          fontSize: "11px",
        }}
      >
        {children}
      </div>
      <div
        style={{
          height: "1px",
          flex: 1,
          background: "var(--border-default)",
        }}
      />
    </div>
  );
}

export default function ATSResume() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: "",
    skills: "",
    job_description: "",
  });
  const [experience, setExperience] = useState([{ ...emptyExperience }]);
  const [education, setEducation] = useState([{ ...emptyEducation }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateExperience(index, field, value) {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  }

  function addExperience() {
    setExperience([...experience, { ...emptyExperience }]);
  }

  function removeExperience(index) {
    if (experience.length <= 1) return;
    setExperience(experience.filter((_, i) => i !== index));
  }

  function updateExpBullet(expIndex, bulletIndex, value) {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    setExperience(updated);
  }

  function addExpBullet(expIndex) {
    const updated = [...experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: [...updated[expIndex].bullets, ""],
    };
    setExperience(updated);
  }

  function removeExpBullet(expIndex, bulletIndex) {
    const updated = [...experience];
    const bullets = updated[expIndex].bullets.filter(
      (_, i) => i !== bulletIndex
    );
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: bullets.length ? bullets : [""],
    };
    setExperience(updated);
  }

  function updateEducation(index, field, value) {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  }

  function addEducation() {
    setEducation([...education, { ...emptyEducation }]);
  }

  function removeEducation(index) {
    if (education.length <= 1) return;
    setEducation(education.filter((_, i) => i !== index));
  }

  function buildPayload() {
    return {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      location: form.location,
      linkedin: form.linkedin,
      summary: form.summary,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      experience: experience
        .filter((e) => e.title || e.company)
        .map((e) => ({
          ...e,
          bullets: e.bullets.filter((b) => b.trim()),
        })),
      education: education.filter((e) => e.degree || e.school),
      job_description: form.job_description,
    };
  }

  async function handlePreview() {
    if (!form.full_name || !form.email) {
      setError("Name and email are required");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = buildPayload();
      const response = await client.post("/ats-resume/preview", payload);
      setResult(response.data);
    } catch (err) {
      setError("Could not generate resume preview, try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!form.full_name || !form.email) {
      setError("Name and email are required");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const payload = buildPayload();
      const response = await client.post("/ats-resume/generate", payload, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${form.full_name.replace(/\s+/g, "_")}_ATS_Resume.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not download PDF, try again");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">ATS Resume Builder</h1>
          <p className="section-subtitle">
            Build an ATS-friendly resume. Paste a job description to optimize
            keywords and content for that role.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <SectionHeader color="var(--ctp-mauve)">
              Personal Information
            </SectionHeader>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input-field"
                  placeholder="Jane Smith"
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="jane@email.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input-field"
                  placeholder="San Francisco, CA"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div>
                <label className="label">LinkedIn</label>
                <input
                  className="input-field"
                  placeholder="linkedin.com/in/janesmith"
                  value={form.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                />
              </div>
            </div>

            <SectionHeader color="var(--ctp-blue)">
              Professional Summary
            </SectionHeader>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Brief 2-3 sentence summary of your professional background and key strengths..."
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              style={{ resize: "vertical" }}
            />

            <SectionHeader color="var(--ctp-green)">Skills</SectionHeader>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Python, React, Node.js, PostgreSQL, Docker, AWS, Git..."
              value={form.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              style={{ resize: "vertical" }}
            />
            <div
              style={{
                fontSize: "11px",
                color: "var(--ctp-overlay0)",
                marginTop: "6px",
                fontFamily: "var(--font-mono)",
              }}
            >
              Comma-separated. Reorder by putting the most relevant skills
              first.
            </div>

            <SectionHeader color="var(--ctp-peach)">
              Work Experience
            </SectionHeader>
            {experience.map((exp, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "16px",
                  padding: "18px",
                  background: "var(--ctp-surface0)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--ctp-peach)",
                      fontWeight: 600,
                    }}
                  >
                    EXPERIENCE #{i + 1}
                  </span>
                  {experience.length > 1 && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "10px", padding: "4px 10px" }}
                      onClick={() => removeExperience(i)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label className="label">Job Title</label>
                    <input
                      className="input-field"
                      placeholder="Software Engineer"
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(i, "title", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input
                      className="input-field"
                      placeholder="Google"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(i, "company", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label className="label">Dates</label>
                  <input
                    className="input-field"
                    placeholder="Jan 2023 - Present"
                    value={exp.dates}
                    onChange={(e) =>
                      updateExperience(i, "dates", e.target.value)
                    }
                    style={{ maxWidth: "280px" }}
                  />
                </div>
                <label className="label">Bullet Points</label>
                {exp.bullets.map((bullet, bi) => (
                  <div
                    key={bi}
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ctp-overlay0)",
                        fontSize: "12px",
                      }}
                    >
                      •
                    </span>
                    <input
                      className="input-field"
                      placeholder="Built X feature that improved Y by Z%"
                      value={bullet}
                      onChange={(e) =>
                        updateExpBullet(i, bi, e.target.value)
                      }
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        className="btn btn-secondary"
                        style={{
                          fontSize: "10px",
                          padding: "4px 8px",
                          minWidth: "28px",
                        }}
                        onClick={() => removeExpBullet(i, bi)}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", marginTop: "4px" }}
                  onClick={() => addExpBullet(i)}
                >
                  + Add Bullet
                </button>
              </div>
            ))}
            <button
              className="btn btn-ghost"
              onClick={addExperience}
              style={{ fontSize: "12px" }}
            >
              + Add Experience
            </button>

            <SectionHeader color="var(--ctp-sky)">Education</SectionHeader>
            {education.map((edu, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "16px",
                  padding: "18px",
                  background: "var(--ctp-surface0)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--ctp-sky)",
                      fontWeight: 600,
                    }}
                  >
                    EDUCATION #{i + 1}
                  </span>
                  {education.length > 1 && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "10px", padding: "4px 10px" }}
                      onClick={() => removeEducation(i)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label className="label">Degree</label>
                    <input
                      className="input-field"
                      placeholder="B.S. Computer Science"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(i, "degree", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">School</label>
                    <input
                      className="input-field"
                      placeholder="MIT"
                      value={edu.school}
                      onChange={(e) =>
                        updateEducation(i, "school", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label className="label">Dates</label>
                    <input
                      className="input-field"
                      placeholder="2019 - 2023"
                      value={edu.dates}
                      onChange={(e) =>
                        updateEducation(i, "dates", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Details</label>
                    <input
                      className="input-field"
                      placeholder="GPA: 3.8, Dean's List"
                      value={edu.details}
                      onChange={(e) =>
                        updateEducation(i, "details", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              className="btn btn-ghost"
              onClick={addEducation}
              style={{ fontSize: "12px" }}
            >
              + Add Education
            </button>

            <SectionHeader color="var(--ctp-mauve)">
              Target Job Description (Optional)
            </SectionHeader>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Paste the job description here to optimize your resume for ATS keywords..."
              value={form.job_description}
              onChange={(e) => updateField("job_description", e.target.value)}
              style={{ resize: "vertical" }}
            />
            <div
              style={{
                fontSize: "11px",
                color: "var(--ctp-overlay0)",
                marginTop: "6px",
                fontFamily: "var(--font-mono)",
              }}
            >
              When provided, the LLM will tailor your summary, bullet points,
              and skill order to match this job description.
            </div>

            {error && (
              <div className="error-box" style={{ marginTop: "16px" }}>
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "28px",
                borderTop: "1px solid var(--border-default)",
                paddingTop: "20px",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Optimizing...
                  </>
                ) : (
                  "Preview Optimized Resume"
                )}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  background: "var(--ctp-green)",
                  color: "var(--ctp-crust)",
                }}
              >
                {downloading ? (
                  <>
                    <span className="spinner" /> Generating PDF...
                  </>
                ) : (
                  "Download PDF"
                )}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="card page-enter">
            <div className="card-gradient-bar" />
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "28px",
                }}
              >
                <div className="label" style={{ marginBottom: 0 }}>
                  Optimized Resume Preview
                </div>
                <span className="tag tag-mauve" style={{ fontSize: "10px" }}>
                  {result._source || "generated"}
                </span>
              </div>

              <div
                style={{
                  background: "var(--ctp-surface0)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "36px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "var(--ctp-text)",
                      marginBottom: "6px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {result.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--ctp-overlay1)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {[result.email, result.phone, result.location]
                      .filter(Boolean)
                      .join(" | ")}
                  </div>
                  {result.linkedin && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--ctp-overlay1)",
                        marginTop: "4px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {result.linkedin}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "var(--border-default)",
                    margin: "20px 0",
                  }}
                />

                {result.summary && (
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ctp-mauve)",
                        marginBottom: "8px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Professional Summary
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.7,
                        color: "var(--ctp-subtext0)",
                      }}
                    >
                      {result.summary}
                    </div>
                  </div>
                )}

                {result.experience?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ctp-mauve)",
                        marginBottom: "12px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Experience
                    </div>
                    {result.experience.map((exp, i) => (
                      <div key={i} style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "var(--ctp-text)",
                            }}
                          >
                            {exp.title} — {exp.company}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--ctp-overlay0)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {exp.dates}
                          </div>
                        </div>
                        <ul
                          style={{
                            marginTop: "6px",
                            paddingLeft: "18px",
                          }}
                        >
                          {exp.bullets?.map((b, bi) => (
                            <li
                              key={bi}
                              style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                color: "var(--ctp-subtext0)",
                                marginBottom: "3px",
                              }}
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {result.education?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ctp-green)",
                        marginBottom: "12px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Education
                    </div>
                    {result.education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "13px",
                              color: "var(--ctp-text)",
                            }}
                          >
                            {edu.degree} — {edu.school}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--ctp-overlay0)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {edu.dates}
                          </div>
                        </div>
                        {edu.details && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--ctp-overlay1)",
                              marginTop: "2px",
                            }}
                          >
                            {edu.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.skills?.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ctp-peach)",
                        marginBottom: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Skills
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      {result.skills.map((skill) => (
                        <span
                          key={skill}
                          className="tag tag-matched"
                          style={{ fontSize: "11px" }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{
                    background: "var(--ctp-green)",
                    color: "var(--ctp-crust)",
                  }}
                >
                  {downloading ? (
                    <>
                      <span className="spinner" /> Generating PDF...
                    </>
                  ) : (
                    "Download as PDF"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
