import { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { TRIVIA_QUESTIONS } from "../../utils/triviaBank";
import { useTimer } from "../../hooks/useTimer";

const QUESTION_COUNT = 15;
const TIMERS = { Easy: 30, Medium: 20, Hard: 10 };

function buildQuestions() {
  const allQ = Object.values(TRIVIA_QUESTIONS).flat();
  return allQ.sort(() => Math.random() - 0.5).slice(0, QUESTION_COUNT);
}

export default function QuizGame() {
  const [difficulty, setDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [review, setReview] = useState([]);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, TIMERS["Medium"]);

  const startGame = useCallback(
    (diff) => {
      const qs = buildQuestions();
      setDifficulty(diff);
      setQuestions(qs);
      setIdx(0);
      setSelected(null);
      setFinished(false);
      setReview([]);
      setScore(0);
      resetTimer(TIMERS[diff]);
      startTimer();
    },
    [setScore, resetTimer, startTimer],
  );

  useEffect(() => {
    if (!difficulty || finished || selected !== null) return;
    if (elapsed === 0) {
      handleSelect(null);
    }
  }, [elapsed]); // eslint-disable-line

  const handleSelect = useCallback(
    (opt) => {
      if (selected !== null) return;
      stopTimer();
      setSelected(opt);
      const q = questions[idx];
      const correct = opt === q.a;
      const pts = correct ? (elapsed + 1) * 10 : 0;
      setScore((s) => s + pts);
      setReview((r) => [...r, { q: q.q, correct, answer: q.a, chosen: opt }]);

      setTimeout(() => {
        if (idx + 1 >= questions.length) {
          setFinished(true);
          setGameOver(true);
        } else {
          setIdx((i) => i + 1);
          setSelected(null);
          resetTimer(TIMERS[difficulty]);
          startTimer();
        }
      }, 1200);
    },
    [
      selected,
      stopped,
      questions,
      idx,
      elapsed,
      difficulty,
      setScore,
      setGameOver,
      stopTimer,
      resetTimer,
      startTimer,
    ],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Quiz Game</SDiffTitle>
        <SDiffDesc>
          15 random trivia questions — faster answers score more!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => startGame(d)}>
              {d}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  if (!questions.length) return null;
  const q = questions[idx];
  const timeLimit = TIMERS[difficulty];
  const progress = elapsed / timeLimit;

  return (
    <SWrapper>
      <SProgress>
        <SProgressBar
          style={{ width: `${progress * 100}%` }}
          $warn={elapsed <= 5}
        />
      </SProgress>
      <SCounter>
        {idx + 1} / {QUESTION_COUNT}
      </SCounter>
      <SQuestion>{q.q}</SQuestion>
      <SOptions>
        {q.options.map((opt) => (
          <SOption
            key={opt}
            onClick={() => handleSelect(opt)}
            $state={
              selected === null
                ? "default"
                : opt === q.a
                  ? "correct"
                  : opt === selected
                    ? "wrong"
                    : "dim"
            }
          >
            {opt}
          </SOption>
        ))}
      </SOptions>
      <STimer $warn={elapsed <= 5}>{elapsed}s</STimer>
    </SWrapper>
  );
}

const stopped = false;

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
  gap: ${theme.space[3]}px;
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
  max-width: 560px;
  width: 100%;
`;
const SProgress = styled.div`
  width: 100%;
  height: 4px;
  background: ${theme.colors.surfaceAlt};
  border-radius: 2px;
  overflow: hidden;
`;
const SProgressBar = styled.div`
  height: 100%;
  background: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.accent)};
  transition:
    width 200ms linear,
    background 200ms;
`;
const SCounter = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
`;
const SQuestion = styled.h2`
  font-family: ${theme.font.display};
  font-size: 1.2rem;
  color: ${theme.colors.text};
  text-align: center;
  line-height: 1.4;
`;
const SOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
`;
const OPTION_STATES = {
  default: {
    bg: theme.colors.surface,
    border: theme.colors.border,
    color: theme.colors.text,
  },
  correct: {
    bg: theme.colors.success + "22",
    border: theme.colors.success,
    color: theme.colors.success,
  },
  wrong: {
    bg: theme.colors.danger + "22",
    border: theme.colors.danger,
    color: theme.colors.danger,
  },
  dim: {
    bg: "transparent",
    border: theme.colors.border + "44",
    color: theme.colors.textMuted + "66",
  },
};
const SOption = styled.button`
  background: ${(p) => OPTION_STATES[p.$state]?.bg};
  border: 1px solid ${(p) => OPTION_STATES[p.$state]?.border};
  color: ${(p) => OPTION_STATES[p.$state]?.color};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px;
  text-align: left;
  font-family: ${theme.font.body};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
  }
`;
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.2rem;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.textMuted)};
`;
