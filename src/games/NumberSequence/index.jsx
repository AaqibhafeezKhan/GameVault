import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { NUMBER_SEQUENCES } from "../../utils/triviaBank";

const PER_ROUND = 12;

export default function NumberSequence() {
  const [difficulty, setDifficulty] = useState(null);
  const [problems, setProblems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hints, setHints] = useState(3);
  const { setScore, setGameOver } = useGameShell();

  const startGame = useCallback(
    (diff) => {
      const pool = NUMBER_SEQUENCES[diff] || NUMBER_SEQUENCES.Easy;
      const ps = [...pool].sort(() => Math.random() - 0.5).slice(0, PER_ROUND);
      setDifficulty(diff);
      setProblems(ps);
      setIdx(0);
      setInput("");
      setFeedback(null);
      setHints(3);
      setScore(0);
    },
    [setScore],
  );

  const submit = useCallback(() => {
    const q = problems[idx];
    const correct = parseInt(input) === q.answer;
    if (correct) {
      setScore((s) => s + 20);
      setFeedback({ type: "correct", text: "✓ Correct!" });
    } else {
      setFeedback({
        type: "wrong",
        text: `✗ Answer was: ${q.answer}. Pattern: ${q.explanation}`,
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
      setInput("");
    }, 1800);
  }, [problems, idx, input, setScore, setGameOver]);

  const hint = useCallback(() => {
    if (hints <= 0) return;
    setHints((h) => h - 1);
    setScore((s) => Math.max(0, s - 5));
    const q = problems[idx];
    setFeedback({ type: "hint", text: `💡 Hint: ${q.hint}` });
  }, [hints, problems, idx, setScore]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Number Sequence</SDiffTitle>
        <SDiffDesc>Find the next number in the sequence!</SDiffDesc>
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

  if (!problems.length) return null;
  const q = problems[idx];

  return (
    <SWrapper>
      <SProgress>
        {idx + 1} / {PER_ROUND}
      </SProgress>
      <SSequence>
        {q.sequence.map((n, i) => (
          <SNum key={i}>{n}</SNum>
        ))}
        <SNum $next>?</SNum>
      </SSequence>
      {feedback && <SFeedback $type={feedback.type}>{feedback.text}</SFeedback>}
      <SInputRow>
        <SInput
          autoFocus
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Next number..."
          disabled={!!feedback}
          id="sequence-input"
        />
        <SSubmitBtn onClick={submit} disabled={!input || !!feedback}>
          Guess
        </SSubmitBtn>
      </SInputRow>
      <SHintBtn onClick={hint} disabled={hints <= 0 || !!feedback}>
        Hint (-5pts, {hints} left)
      </SHintBtn>
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
  max-width: 480px;
  width: 100%;
`;
const SProgress = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SSequence = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  flex-wrap: wrap;
  justify-content: center;
`;
const SNum = styled.div`
  width: 60px;
  height: 60px;
  background: ${(p) =>
    p.$next ? theme.colors.accent + "22" : theme.colors.surface};
  border: 1px solid
    ${(p) => (p.$next ? theme.colors.accent : theme.colors.border)};
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-size: 1.3rem;
  font-weight: 600;
  color: ${(p) => (p.$next ? theme.colors.accent : theme.colors.text)};
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  text-align: center;
  color: ${(p) =>
    p.$type === "correct"
      ? theme.colors.success
      : p.$type === "hint"
        ? theme.colors.warning
        : theme.colors.danger};
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
const SSubmitBtn = styled.button`
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
const SHintBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.warning};
  color: ${theme.colors.warning};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${theme.colors.warning}22;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
