import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { TRIVIA_QUESTIONS } from "../../utils/triviaBank";
import { useTimer } from "../../hooks/useTimer";

const CATEGORIES = Object.keys(TRIVIA_QUESTIONS);
const QUESTIONS_PER_GAME = 15;
const TIME_PER_Q = 20;

function buildQuestions() {
  const all = CATEGORIES.flatMap((cat) =>
    TRIVIA_QUESTIONS[cat].map((q) => ({ ...q, cat })),
  );
  return [...all].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_GAME);
}

export default function TriviaQuiz() {
  const [category, setCategory] = useState("All");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [started, setStarted] = useState(false);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, TIME_PER_Q);

  const startGame = useCallback(
    (cat) => {
      setCategory(cat);
      let pool;
      if (cat === "All") pool = buildQuestions();
      else
        pool = [...TRIVIA_QUESTIONS[cat]]
          .sort(() => Math.random() - 0.5)
          .slice(0, QUESTIONS_PER_GAME);
      setQuestions(pool);
      setIdx(0);
      setChosen(null);
      setFeedback(null);
      setStarted(true);
      setScore(0);
      resetTimer(TIME_PER_Q);
      startTimer();
    },
    [setScore, resetTimer, startTimer],
  );

  const answerTimeout = useCallback(() => {
    if (!questions.length || !started || chosen !== null) return;
    const q = questions[idx];
    setChosen("__timeout__");
    stopTimer();
    setFeedback({ ok: false, text: `⏱ Time! Answer: ${q.a}` });
    setTimeout(() => proceed(), 1500);
  }, [questions, idx, started, chosen, stopTimer]);

  const proceed = useCallback(() => {
    const next = idx + 1;
    if (next >= questions.length) {
      setGameOver(true);
      return;
    }
    setIdx(next);
    setChosen(null);
    setFeedback(null);
    resetTimer(TIME_PER_Q);
    startTimer();
  }, [idx, questions, setGameOver, resetTimer, startTimer]);

  const answer = useCallback(
    (opt) => {
      if (chosen || !questions.length) return;
      stopTimer();
      setChosen(opt);
      const q = questions[idx];
      const ok = opt === q.a;
      if (ok) {
        setScore((s) => s + elapsed * 5);
        setFeedback({ ok: true, text: `✓ Correct! +${elapsed * 5}` });
      } else setFeedback({ ok: false, text: `✗ Answer: ${q.a}` });
      setTimeout(() => proceed(), 1300);
    },
    [chosen, questions, idx, elapsed, stopTimer, setScore, proceed],
  );

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Trivia Quiz</SDiffTitle>
        <SDiffDesc>
          Answer {QUESTIONS_PER_GAME} questions. Score depends on how fast you
          answer!
        </SDiffDesc>
        <SCategories>
          {["All", ...CATEGORIES].map((cat) => (
            <SCatBtn key={cat} onClick={() => startGame(cat)}>
              {cat}
            </SCatBtn>
          ))}
        </SCategories>
      </SDiffScreen>
    );
  }

  if (!questions.length) return null;
  const q = questions[idx];
  const progress = elapsed / TIME_PER_Q;

  return (
    <SWrapper>
      <STopRow>
        <SProgress>
          {idx + 1}/{QUESTIONS_PER_GAME}
        </SProgress>
        <SCat>{q.cat}</SCat>
      </STopRow>
      <STimerBar>
        <STimerFill $pct={progress * 100} $warn={elapsed <= 5} />
      </STimerBar>
      <SQuestion>{q.q}</SQuestion>
      {feedback && <SFeedback $ok={feedback.ok}>{feedback.text}</SFeedback>}
      <SOptions>
        {q.options.map((opt) => (
          <SOption
            key={opt}
            onClick={() => answer(opt)}
            disabled={!!chosen}
            $correct={chosen && opt === q.a}
            $wrong={chosen === opt && opt !== q.a}
          >
            {opt}
          </SOption>
        ))}
      </SOptions>
    </SWrapper>
  );
}

const SDiffScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SDiffTitle = styled.h2`
  font-family: ${theme.font.display};
  font-size: 2rem;
  color: ${theme.colors.text};
`;
const SDiffDesc = styled.p`
  color: ${theme.colors.textMuted};
  font-family: ${theme.font.body};
  text-align: center;
  max-width: 360px;
`;
const SCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space[2]}px;
  justify-content: center;
  max-width: 440px;
`;
const SCatBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 150ms ease-out;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
  max-width: 520px;
  width: 100%;
`;
const STopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;
const SProgress = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SCat = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.accent};
`;
const STimerBar = styled.div`
  width: 100%;
  height: 5px;
  background: ${theme.colors.surfaceAlt};
  border-radius: 3px;
  overflow: hidden;
`;
const STimerFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.accent)};
  transition: width 250ms linear;
`;
const SQuestion = styled.div`
  font-family: ${theme.font.body};
  font-size: 1.05rem;
  color: ${theme.colors.text};
  text-align: center;
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) => (p.$ok ? theme.colors.success : theme.colors.danger)};
`;
const SOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.space[2]}px;
  width: 100%;
`;
const SOption = styled.button`
  padding: ${theme.space[3]}px;
  text-align: center;
  background: ${(p) =>
    p.$correct
      ? theme.colors.success + "33"
      : p.$wrong
        ? theme.colors.danger + "33"
        : theme.colors.surface};
  border: 1px solid
    ${(p) =>
      p.$correct
        ? theme.colors.success
        : p.$wrong
          ? theme.colors.danger
          : theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  font-family: ${theme.font.body};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 100ms;
  white-space: normal;
  word-break: break-word;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    background: ${theme.colors.surfaceAlt};
  }
  &:disabled {
    cursor: default;
  }
`;
