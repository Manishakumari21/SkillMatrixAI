import { useRef } from "react";
import { difficultyStyles } from "./SetupPhase";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function Timer({ secondsLeft, total }) {
  const pct = (secondsLeft / total) * 100;
  const isLow = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: "100px", height: "6px", background: "var(--ctp-surface0)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: "3px", transition: "width 1s linear, background 0.3s ease",
          background: isCritical ? "var(--ctp-red)" : isLow ? "var(--ctp-peach)" : "var(--ctp-green)",
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, minWidth: "40px",
        color: isCritical ? "var(--ctp-red)" : isLow ? "var(--ctp-peach)" : "var(--ctp-green)",
      }}>
        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function InterviewPhase({
  role, topic, difficulty, questions, currentQ, typedAnswer, setTypedAnswer,
  spokenAnswer, isRecording, toggleRecording, answerSubmitted, timeLeft,
  tabSwitches, copyPasteCount, isFullscreen, currentWpm, fillerCount,
  speechDuration, interviewConfig, containerRef, handleExitInterview,
  handleSubmitAnswer, handleNextQuestion, fillerWordsRef,
}) {
  const diff = difficultyStyles[difficulty];
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: "4px" }}>Mock Interview — {role}</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>Question {currentQ + 1} of {questions.length} · {topic} · {difficulty}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Timer secondsLeft={timeLeft} total={interviewConfig?.question_time_seconds || 180} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", display: "flex", gap: "12px" }}>
            {tabSwitches > 0 && <span style={{ color: "var(--ctp-red)" }}>Tab: {tabSwitches}</span>}
            {copyPasteCount > 0 && <span style={{ color: "var(--ctp-red)" }}>Copy: {copyPasteCount}</span>}
            {!isFullscreen && (
              <span style={{ color: "var(--ctp-peach)", cursor: "pointer" }} onClick={() => containerRef.current?.requestFullscreen?.()}>
                [Go Fullscreen]
              </span>
            )}
          </div>
          <button className="btn btn-secondary" onClick={handleExitInterview} style={{ fontSize: "11px", padding: "6px 12px" }}>Exit</button>
        </div>
      </div>

      <div className="progress-bar-track" style={{ marginBottom: "24px" }}>
        <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="card" key={currentQ} style={{ marginBottom: "24px" }}>
        <div className="card-gradient-bar" />
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <span className="label" style={{ marginBottom: 0 }}>Question {currentQ + 1}</span>
            <span className="tag" style={{ fontSize: "10px", background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>{difficulty}</span>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(203, 166, 247, 0.04), rgba(137, 180, 250, 0.04))",
            border: "1px solid rgba(203, 166, 247, 0.1)", borderRadius: "var(--radius-md)", padding: "28px",
            fontSize: "16px", lineHeight: 1.8, color: "var(--ctp-text)", marginBottom: "16px",
          }}>
            {questions[currentQ]}
          </div>

          <div className="label">Typed Answer</div>
          <textarea
            className="input-field" rows={5}
            placeholder={isRecording ? "Listening... speak your answer" : "Type your answer here..."}
            value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)}
            style={{
              resize: "vertical", marginBottom: "12px",
              borderColor: isRecording ? "var(--ctp-mauve)" : undefined,
              boxShadow: isRecording ? "0 0 0 2px rgba(203, 166, 247, 0.15)" : undefined,
            }}
          />

          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            <button
              className="btn" onClick={toggleRecording} disabled={!SpeechRecognition}
              style={{
                fontSize: "11px",
                background: isRecording ? "var(--ctp-red)" : "var(--ctp-surface1)",
                color: isRecording ? "var(--ctp-base)" : !SpeechRecognition ? "var(--ctp-overlay0)" : "var(--ctp-subtext0)",
                border: `1px solid ${isRecording ? "var(--ctp-red)" : "var(--border-default)"}`,
                animation: isRecording ? "pulse-record 1.5s infinite" : "none",
                opacity: !SpeechRecognition ? 0.5 : 1, cursor: !SpeechRecognition ? "not-allowed" : "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "6px", verticalAlign: "middle" }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              {!SpeechRecognition ? "Voice Not Supported" : isRecording ? "Stop Recording" : "Speak Answer"}
            </button>
            {spokenAnswer && (
              <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)" }}>
                Spoken: {spokenAnswer.slice(0, 60)}{spokenAnswer.length > 60 ? "..." : ""}
              </div>
            )}
          </div>

          {isRecording && (
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px",
                background: currentWpm > 0 && currentWpm < (interviewConfig?.wpm_optimal_min || 100) ? "var(--accent-peach-dim)" : currentWpm > (interviewConfig?.wpm_optimal_max || 160) ? "var(--accent-red-dim)" : "var(--accent-green-dim)",
                border: `1px solid ${currentWpm > 0 && currentWpm < (interviewConfig?.wpm_optimal_min || 100) ? "rgba(250,179,135,0.2)" : currentWpm > (interviewConfig?.wpm_optimal_max || 160) ? "rgba(243,139,168,0.2)" : "rgba(166,227,161,0.2)"}`,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={currentWpm > 0 && currentWpm < (interviewConfig?.wpm_optimal_min || 100) ? "var(--ctp-peach)" : currentWpm > (interviewConfig?.wpm_optimal_max || 160) ? "var(--ctp-red)" : "var(--ctp-green)"} strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--ctp-text)" }}>{currentWpm} WPM</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--ctp-overlay0)" }}>
                  {currentWpm < (interviewConfig?.wpm_optimal_min || 100) ? "(slow)" : currentWpm > (interviewConfig?.wpm_optimal_max || 160) ? "(fast)" : "(good)"}
                </span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px",
                background: fillerCount > 5 ? "var(--accent-red-dim)" : fillerCount > 2 ? "var(--accent-peach-dim)" : "var(--ctp-surface0)",
                border: `1px solid ${fillerCount > 5 ? "rgba(243,139,168,0.2)" : fillerCount > 2 ? "rgba(250,179,135,0.2)" : "var(--border-default)"}`,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--ctp-text)" }}>Fillers: {fillerCount}</span>
                {fillerCount > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--ctp-overlay0)" }}>({fillerWordsRef.current.slice(-3).join(", ")})</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "var(--ctp-surface0)", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ctp-overlay0)" }}>Speech: {Math.floor(speechDuration / 60)}:{String(speechDuration % 60).padStart(2, "0")}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn btn-primary" onClick={() => handleSubmitAnswer(false)} disabled={answerSubmitted}
              style={{ background: answerSubmitted ? "var(--ctp-surface1)" : undefined, color: answerSubmitted ? "var(--ctp-green)" : undefined }}
            >
              {answerSubmitted ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: "6px", verticalAlign: "middle" }}><polyline points="20 6 9 17 4 12" /></svg>Answer Submitted</>
              ) : "Submit Answer"}
            </button>
            <button className="btn btn-secondary" onClick={handleNextQuestion}>
              {currentQ + 1 === questions.length ? "Submit Final Answer" : "Next Question"}
            </button>
          </div>
        </div>
      </div>

      {answerSubmitted && answers?.[currentQ] && (
        <div className="card page-enter" key={`fb-${currentQ}`} style={{ marginBottom: "24px", borderColor: "rgba(166, 227, 161, 0.2)" }}>
          <div className="card-gradient-bar-cool" />
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent-green-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-green)" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ctp-green)" }}>Answer Captured</div>
                <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)" }}>
                  Question {currentQ + 1} of {questions.length} · Time: {Math.floor((interviewConfig?.question_time_seconds || 180 - timeLeft) / 60)}:{String((interviewConfig?.question_time_seconds || 180 - timeLeft) % 60).padStart(2, "0")}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {answers[currentQ]?.typed_answer && (
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Typed Answer</div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6, background: "var(--ctp-surface0)", padding: "10px 14px", borderRadius: "var(--radius-sm)" }}>{answers[currentQ].typed_answer}</div>
                </div>
              )}
              {answers[currentQ]?.spoken_answer && (
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Spoken Answer</div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6, background: "var(--ctp-surface0)", padding: "10px 14px", borderRadius: "var(--radius-sm)" }}>{answers[currentQ].spoken_answer}</div>
                </div>
              )}
              {!answers[currentQ]?.typed_answer && !answers[currentQ]?.spoken_answer && (
                <div style={{ fontSize: "12px", color: "var(--ctp-overlay0)", fontStyle: "italic" }}>No answer recorded for this question.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {questions.map((q, i) => (
          <div key={i} style={{
            width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600,
            background: i < currentQ ? "var(--accent-green-dim)" : i === currentQ ? "var(--accent-mauve-dim)" : "var(--ctp-surface0)",
            color: i < currentQ ? "var(--ctp-green)" : i === currentQ ? "var(--ctp-mauve)" : "var(--ctp-overlay0)",
            border: `1px solid ${i === currentQ ? "rgba(203, 166, 247, 0.2)" : "var(--border-default)"}`,
          }}>
            {i < currentQ ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            ) : i + 1}
          </div>
        ))}
      </div>
    </>
  );
}
