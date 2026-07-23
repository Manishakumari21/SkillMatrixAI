import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import SetupPhase from "./mockinterview/SetupPhase";
import InterviewPhase from "./mockinterview/InterviewPhase";
import ResultsPhase from "./mockinterview/ResultsPhase";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function MockInterview() {
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [phase, setPhase] = useState("setup");
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [spokenAnswer, setspokenAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteCount, setCopyPasteCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [showWarning, setShowWarning] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const pendingAnswerRef = useRef(null);
  const [sessionId, setSessionId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [speechDuration, setSpeechDuration] = useState(0);
  const [visibleHints, setVisibleHints] = useState({});

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const spokenBufferRef = useRef("");
  const containerRef = useRef(null);
  const speechStartTimeRef = useRef(null);
  const fillerWordsRef = useRef([]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    client.get("/mock-interview/config").then((res) => {
      setInterviewConfig(res.data);
      setNumQuestions(res.data.default_questions);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "interview") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((p) => p + 1);
        setShowWarning("TAB SWITCH DETECTED — This incident has been recorded.");
        setTimeout(() => setShowWarning(""), 4000);
      }
    };

    const handleCopy = (e) => { e.preventDefault(); setCopyPasteCount((p) => p + 1); setShowWarning("COPY/PASTE BLOCKED — This incident has been recorded."); setTimeout(() => setShowWarning(""), 4000); };
    const handlePaste = (e) => { e.preventDefault(); setCopyPasteCount((p) => p + 1); setShowWarning("COPY/PASTE BLOCKED — This incident has been recorded."); setTimeout(() => setShowWarning(""), 4000); };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")) {
        if (!window.getSelection().toString()) return;
        e.preventDefault();
        setCopyPasteCount((p) => p + 1);
        setShowWarning("KEYBOARD SHORTCUT BLOCKED — This incident has been recorded.");
        setTimeout(() => setShowWarning(""), 4000);
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) e.preventDefault();
    };

    const handleContextMenu = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "interview" || answerSubmitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSubmitAnswer(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentQ, answerSubmitted]);

  function handleFullscreenChange() {
    if (phase === "interview" && !document.fullscreenElement) {
      setFullscreenExits((p) => p + 1);
      setShowWarning("FULLSCREEN EXIT DETECTED — This incident has been recorded.");
      setTimeout(() => setShowWarning(""), 4000);
    }
    setIsFullscreen(!!document.fullscreenElement);
  }

  async function handleStartSession() {
    if (!role || !topic) { setError("Select both a role and a topic"); return; }
    setLoading(true);
    setError("");
    try {
      const response = await client.post("/mock-interview/start", { role, topic, difficulty, num_questions: numQuestions });
      setQuestions(response.data.questions);
      setSessionId(response.data.session_id);
      setCurrentQ(0);
      setAnswers([]);
      setTabSwitches(0);
      setCopyPasteCount(0);
      setFullscreenExits(0);
      setTimeLeft(interviewConfig?.question_time_seconds || 180);
      setCurrentWpm(0);
      setFillerCount(0);
      setSpeechDuration(0);
      speechStartTimeRef.current = null;
      fillerWordsRef.current = [];
      setPhase("interview");
      if (containerRef.current?.requestFullscreen) {
        try { await containerRef.current.requestFullscreen(); setIsFullscreen(true); } catch {}
      }
    } catch { setError("Could not start session. Try again."); } finally { setLoading(false); }
  }

  const FILLER_WORDS = interviewConfig?.filler_words || ["um", "uh", "like", "you know", "basically", "actually", "so", "right", "i mean", "kind of", "sort of", "literally"];

  function detectFillers(text) {
    const lower = text.toLowerCase();
    const found = [];
    for (const fw of FILLER_WORDS) {
      const regex = new RegExp(`\\b${fw}\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) for (let i = 0; i < matches.length; i++) found.push(fw);
    }
    return found;
  }

  function calculateWpm(text, durationSeconds) {
    if (!text || durationSeconds < 1) return 0;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return (words / durationSeconds) * 60;
  }

  function toggleRecording() {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    if (!SpeechRecognition) { setError("Speech recognition is not supported in this browser"); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = interviewConfig?.speech_language || "en-US";
    speechStartTimeRef.current = Date.now();
    fillerWordsRef.current = [];
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        spokenBufferRef.current += (spokenBufferRef.current ? " " : "") + finalTranscript;
        const newFillers = detectFillers(finalTranscript);
        fillerWordsRef.current = [...fillerWordsRef.current, ...newFillers];
        setFillerCount(fillerWordsRef.current.length);
      }
      const fullText = spokenBufferRef.current + (interimTranscript ? " " + interimTranscript : "");
      setspokenAnswer(fullText);
      const elapsed = (Date.now() - speechStartTimeRef.current) / 1000;
      setSpeechDuration(Math.round(elapsed));
      setCurrentWpm(Math.round(calculateWpm(spokenBufferRef.current, elapsed)));
    };
    recognition.onerror = (event) => { if (event.error !== "aborted") setError("Voice error: " + event.error); setIsRecording(false); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setCurrentWpm(0);
    setFillerCount(0);
    setSpeechDuration(0);
  }

  function resetInputState() {
    setTypedAnswer("");
    setspokenAnswer("");
    spokenBufferRef.current = "";
    setTimeLeft(interviewConfig?.question_time_seconds || 180);
    setCurrentWpm(0);
    setFillerCount(0);
    setSpeechDuration(0);
    speechStartTimeRef.current = null;
    fillerWordsRef.current = [];
  }

  function handleSubmitAnswer(timedOut = false) {
    if (timerRef.current) clearInterval(timerRef.current);
    const newAnswer = {
      question: questions[currentQ], typed_answer: typedAnswer.trim(), spoken_answer: spokenBufferRef.current.trim(),
      time_spent_seconds: interviewConfig?.question_time_seconds || 180 - timeLeft,
      was_tab_switched: tabSwitches > 0, copy_paste_detected: copyPasteCount > 0,
      speaking_pace_wpm: currentWpm, speech_duration_seconds: speechDuration, filler_words: [...fillerWordsRef.current],
    };
    const updatedAnswers = answerSubmitted ? [...answers].map((a, i) => i === currentQ ? newAnswer : a) : [...answers, newAnswer];
    setAnswers(updatedAnswers);
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false); }
    setAnswerSubmitted(true);
    resetInputState();
    if (timedOut) {
      if (currentQ + 1 < questions.length) { setCurrentQ(currentQ + 1); setAnswerSubmitted(false); }
      else handleSubmitSession(updatedAnswers);
    }
  }

  function handleNextQuestion() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false); }
    const currentAnswer = {
      question: questions[currentQ], typed_answer: typedAnswer.trim(), spoken_answer: spokenBufferRef.current.trim(),
      time_spent_seconds: interviewConfig?.question_time_seconds || 180 - timeLeft,
      was_tab_switched: tabSwitches > 0, copy_paste_detected: copyPasteCount > 0,
      speaking_pace_wpm: currentWpm, speech_duration_seconds: speechDuration, filler_words: [...fillerWordsRef.current],
    };
    if (!currentAnswer.typed_answer && !currentAnswer.spoken_answer) {
      pendingAnswerRef.current = currentAnswer;
      setShowSkipConfirm(true);
      return;
    }
    _proceedNext(currentAnswer);
  }

  function _proceedNext(currentAnswer) {
    const finalAnswers = answerSubmitted ? [...answers].map((a, i) => i === currentQ ? currentAnswer : a) : [...answers, currentAnswer];
    resetInputState();
    if (currentQ + 1 < questions.length) { setAnswers(finalAnswers); setCurrentQ(currentQ + 1); setAnswerSubmitted(false); }
    else handleSubmitSession(finalAnswers);
  }

  function handleSkipConfirm() { setShowSkipConfirm(false); _proceedNext(pendingAnswerRef.current); pendingAnswerRef.current = null; }
  function handleSkipCancel() { setShowSkipConfirm(false); pendingAnswerRef.current = null; }

  async function handleSubmitSession(allAnswers) {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
    setPhase("results");
    setEvaluating(true);
    try {
      const response = await client.post("/mock-interview/evaluate", {
        role, topic, difficulty, answers: allAnswers,
        total_cheating_incidents: tabSwitches + copyPasteCount, fullscreen_exits: fullscreenExits,
      });
      setFeedback(response.data);
      client.post("/progress/record-interview").catch(() => {});
    } catch { setError("Could not evaluate session. Results may be partial."); } finally { setEvaluating(false); }
  }

  function handleExitInterview() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setPhase("setup");
    setQuestions([]); setAnswers([]); setFeedback(null); setCurrentQ(0); setTypedAnswer(""); setspokenAnswer("");
    spokenBufferRef.current = ""; setAnswerSubmitted(false); setCurrentWpm(0); setFillerCount(0); setSpeechDuration(0);
    speechStartTimeRef.current = null; fillerWordsRef.current = []; setVisibleHints({});
  }

  return (
    <Layout>
      <div ref={containerRef} className="page-enter">
        {showWarning && (
          <div style={{ position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "var(--ctp-red)", color: "var(--ctp-base)", padding: "12px 24px", borderRadius: "10px", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 8px 32px rgba(243, 139, 168, 0.4)", animation: "fadeUp 0.3s ease", maxWidth: "90vw", textAlign: "center" }}>
            {showWarning}
          </div>
        )}
        {showSkipConfirm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={handleSkipCancel}>
            <div className="card" style={{ maxWidth: "400px", width: "90%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div className="card-body" style={{ padding: "32px" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>?</div>
                <h3 style={{ color: "var(--ctp-text)", fontSize: "16px", marginBottom: "8px" }}>Skip this question?</h3>
                <p style={{ color: "var(--ctp-subtext0)", fontSize: "13px", marginBottom: "24px", lineHeight: 1.6 }}>You haven't provided any answer. Skipping will give you 0/10 for this question.</p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button className="btn-secondary" onClick={handleSkipCancel} style={{ flex: 1 }}>Go Back</button>
                  <button className="btn-primary" onClick={handleSkipConfirm} style={{ flex: 1, background: "var(--ctp-red)" }}>Skip Question</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "setup" && (
          <SetupPhase role={role} setRole={setRole} topic={topic} setTopic={setTopic} difficulty={difficulty} setDifficulty={setDifficulty} numQuestions={numQuestions} setNumQuestions={setNumQuestions} interviewConfig={interviewConfig} loading={loading} error={error} handleStartSession={handleStartSession} />
        )}
        {phase === "interview" && (
          <InterviewPhase role={role} topic={topic} difficulty={difficulty} questions={questions} currentQ={currentQ} typedAnswer={typedAnswer} setTypedAnswer={setTypedAnswer} spokenAnswer={spokenAnswer} isRecording={isRecording} toggleRecording={toggleRecording} answerSubmitted={answerSubmitted} timeLeft={timeLeft} tabSwitches={tabSwitches} copyPasteCount={copyPasteCount} isFullscreen={isFullscreen} currentWpm={currentWpm} fillerCount={fillerCount} speechDuration={speechDuration} interviewConfig={interviewConfig} containerRef={containerRef} handleExitInterview={handleExitInterview} handleSubmitAnswer={handleSubmitAnswer} handleNextQuestion={handleNextQuestion} fillerWordsRef={fillerWordsRef} answers={answers} />
        )}
        {phase === "results" && (
          <ResultsPhase feedback={feedback} evaluating={evaluating} error={error} role={role} topic={topic} difficulty={difficulty} questions={questions} tabSwitches={tabSwitches} copyPasteCount={copyPasteCount} fullscreenExits={fullscreenExits} visibleHints={visibleHints} setVisibleHints={setVisibleHints} handleSubmitSession={handleSubmitSession} handleExitInterview={handleExitInterview} />
        )}
      </div>
    </Layout>
  );
}
