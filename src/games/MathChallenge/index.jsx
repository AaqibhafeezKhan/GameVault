import { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { MATH_PROBLEMS } from "../../utils/triviaBank";
import { useTimer } from "../../hooks/useTimer";

const PROBLEMS = 20;
const TIMERS_PER_QUESTION = { Easy: 15, Medium: 10, Hard: 6 };

function buildProblems(diff) {
  const diffMap = { Easy: "easy", Medium: "medium", Hard: "hard" };
  const pool = MATH_PROBLEMS[diffMap[diff]] || MATH_PROBLEMS.easy;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, PROBLEMS);
}

export default function MathChallenge() {
  const [difficulty, setDifficulty] = useState(null);
  const [problems, setProblems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, 10);

  const startGame = useCallback(
    (diff) => {
      const ps = buildProblems(diff);
      setDifficulty(diff);
      setProblems(ps);
      setIdx(0);
      setInput("");
      setFeedback(null);
      setStreak(0);
      setScore(0);
      resetTimer(TIMERS_PER_QUESTION[diff]);
      startTimer();
    },
    [setScore, resetTimer, startTimer],
  );

  const timeLimit = difficulty ? TIMERS_PER_QUESTION[difficulty] : 10;

  useEffect(() => {
    if (!difficulty || feedback || elapsed > 0) return;
    handleAnswer(null);
  }, [elapsed]); // eslint-disable-line

  const handleAnswer = useCallback(
    (ans) => {
      stopTimer();
      const q = problems[idx];
      const correct = ans !== null && String(ans).trim() === String(q?.answer);
      setInput("");
      if (correct) {
        const bonusMult = streak >= 4 ? 3 : streak >= 2 ? 2 : 1;
        const pts = (elapsed + 1) * 5 * bonusMult;
        setScore((s) => s + pts);
        setStreak((s) => s + 1);
        setFeedback({
          type: "correct",
          text: `✓ +${pts}${bonusMult > 1 ? ` (×${bonusMult} streak!)` : ""}`,
        });
      } else {
        setStreak(0);
        setFeedback({
          type: "wrong",
          text:
            ans === null
              ? `⏱ Time! Answer: ${q?.answer}`
              : `✗ Answer: ${q?.answer}`,
        });
      }
      setTimeout(() => {
        const next = idx + 1;
        if (next >= problems.length) {
          setGameOver(true);
          return;
        }
        setIdx(next);
        setFeedback(null);
        resetTimer(TIMERS_PER_QUESTION[difficulty]);
        startTimer();
      }, 1000);
    },
    [
      problems,
      idx,
      elapsed,
      streak,
      difficulty,
      stopTimer,
      setScore,
      setGameOver,
      resetTimer,
      startTimer,
    ],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Math Challenge</SDiffTitle>
        <SDiffDesc>
          Solve arithmetic problems as fast as possible. Streaks give bonuses!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => startGame(d)}>
              {d} ({TIMERS_PER_QUESTION[d]}s each)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  if (!problems.length) return null;
  const q = problems[idx];
  const progress = elapsed / timeLimit;

  return (
    <SWrapper>
      <SInfo>
        <SProgress>
          {idx + 1}/{PROBLEMS}
        </SProgress>
        {streak >= 3 && <SStreak>🔥 ×{streak} Streak!</SStreak>}
      </SInfo>
      <STimerBar>
        <STimerFill $pct={progress * 100} $warn={elapsed <= 3} />
      </STimerBar>
      <SQuestion>{q.question} = ?</SQuestion>
      {feedback && (
        <SFeedback $ok={feedback.type === "correct"}>{feedback.text}</SFeedback>
      )}
      <SInputRow>
        <SInput
          autoFocus
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnswer(input)}
          placeholder="Answer..."
          disabled={!!feedback}
          id="math-input"
        />
        <SSubmit
          onClick={() => handleAnswer(input)}
          disabled={!input || !!feedback}
        >
          OK
        </SSubmit>
      </SInputRow>
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
const SDiffButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
  align-items: center;
`;
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
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
  max-width: 400px;
  width: 100%;
`;
const SInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SProgress = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SStreak = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.warning};
`;
const STimerBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${theme.colors.surfaceAlt};
  border-radius: 3px;
  overflow: hidden;
`;
const STimerFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.accent)};
  transition: width 200ms linear;
`;
const SQuestion = styled.div`
  font-family: ${theme.font.display};
  font-size: 2rem;
  color: ${theme.colors.text};
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) => (p.$ok ? theme.colors.success : theme.colors.danger)};
`;
const SInputRow = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  width: 100%;
`;
const SInput = styled.input`
  flex: 1;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  padding: ${theme.space[3]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 1.3rem;
  outline: none;
  transition: border-color 150ms ease-out;
  text-align: center;
  &:focus {
    border-color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const SSubmit = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
