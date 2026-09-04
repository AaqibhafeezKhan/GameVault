import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const RANGES = { Easy: 50, Medium: 200, Hard: 1000 };
const ATTEMPTS = { Easy: 10, Medium: 7, Hard: 5 };

export default function GuessNumber() {
  const [difficulty, setDifficulty] = useState(null);
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [solved, setSolved] = useState(false);
  const [usedHints, setUsedHints] = useState(0);
  const [lo, setLo] = useState(1);
  const [hi, setHi] = useState(50);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (diff) => {
      const max = RANGES[diff];
      const t = Math.floor(Math.random() * max) + 1;
      setDifficulty(diff);
      setTarget(t);
      setRemaining(ATTEMPTS[diff]);
      setFeedback(null);
      setGuess("");
      setSolved(false);
      setUsedHints(0);
      setLo(1);
      setHi(max);
      setScore(0);
    },
    [setScore],
  );

  const submit = useCallback(() => {
    const n = parseInt(guess);
    if (isNaN(n)) return;
    const newRemaining = remaining - 1;
    setRemaining(newRemaining);
    setGuess("");

    if (n === target) {
      const pts = newRemaining * 100;
      setScore(pts);
      setSolved(true);
      setFeedback({ text: `Correct! 🎉 It was ${target}`, type: "correct" });
      setGameOver(true);
    } else if (newRemaining <= 0) {
      setFeedback({
        text: `Out of attempts! It was ${target}.`,
        type: "wrong",
      });
      setGameOver(true);
    } else {
      const tooHigh = n > target;
      setFeedback({
        text: tooHigh ? "📉 Too High!" : "📈 Too Low!",
        type: tooHigh ? "high" : "low",
      });
      if (tooHigh) setHi(n - 1);
      else setLo(n + 1);
    }
  }, [guess, remaining, target, setScore, setGameOver]);

  const hint = useCallback(() => {
    if (difficulty !== "Easy" || solved) return;
    const mid = Math.floor((lo + hi) / 2);
    setGuess(String(mid));
    setUsedHints((h) => h + 1);
    setScore((s) => Math.max(0, s - 50));
  }, [difficulty, lo, hi, solved, setScore]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Guess the Number</SDiffTitle>
        <SDiffDesc>
          A secret number is chosen — find it with as few guesses as possible!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d} (1-{RANGES[d]}, {ATTEMPTS[d]} attempts)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SRange>Guess a number between 1 and {RANGES[difficulty]}</SRange>
      <SAttempts>
        Attempts left:{" "}
        <SAttemptVal $low={remaining <= 2}>{remaining}</SAttemptVal>
      </SAttempts>
      {feedback && <SFeedback $type={feedback.type}>{feedback.text}</SFeedback>}
      <SInputRow>
        <SInput
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          min="1"
          max={RANGES[difficulty]}
          disabled={solved || remaining <= 0}
          placeholder={`1 – ${RANGES[difficulty]}`}
          id="guess-input"
        />
        <SGuessBtn
          onClick={submit}
          disabled={!guess || solved || remaining <= 0}
        >
          Guess
        </SGuessBtn>
      </SInputRow>
      {difficulty === "Easy" && !solved && remaining > 0 && (
        <SHintBtn onClick={hint}>
          Binary Search Hint (-50 pts, used: {usedHints})
        </SHintBtn>
      )}
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
  font-size: 0.85rem;
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
const SRange = styled.div`
  font-family: ${theme.font.body};
  color: ${theme.colors.textMuted};
  font-size: 1rem;
  text-align: center;
`;
const SAttempts = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SAttemptVal = styled.span`
  color: ${(p) => (p.$low ? theme.colors.danger : theme.colors.accent)};
`;
const FEEDBACK_COLORS = {
  correct: theme.colors.success,
  wrong: theme.colors.danger,
  high: theme.colors.warning,
  low: theme.colors.accent,
};
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  color: ${(p) => FEEDBACK_COLORS[p.$type] || theme.colors.text};
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
  padding: ${theme.space[2]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 1.2rem;
  outline: none;
  text-align: center;
  transition: border-color 150ms ease-out;
  &:focus {
    border-color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const SGuessBtn = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 150ms ease-out;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`;
const SHintBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.warning};
  color: ${theme.colors.warning};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.warning}22;
  }
`;
