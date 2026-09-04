import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { SCRAMBLE_WORDS } from "../../utils/wordBank";
import { useTimer } from "../../hooks/useTimer";

const WORDS_PER_GAME = 20;
const TIMERS = { Easy: 30, Medium: 20, Hard: 12 };
const MULTIPLIERS = { Easy: 1, Medium: 2, Hard: 3 };
const MAX_HINTS = 3;

function scramble(word) {
  const arr = word.split("");
  let scrambled = word;
  while (scrambled === word) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    scrambled = arr.join("");
  }
  return scrambled;
}

export default function WordScramble() {
  const [difficulty, setDifficulty] = useState(null);
  const [words, setWords] = useState([]);
  const [idx, setIdx] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [input, setInput] = useState("");
  const [hints, setHints] = useState(MAX_HINTS);
  const [feedback, setFeedback] = useState(null);
  const [revealed, setRevealed] = useState("");
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, 30);

  const nextWord = useCallback(
    (wordList, i, diff) => {
      if (i >= wordList.length) {
        setGameOver(true);
        return;
      }
      setScrambled(scramble(wordList[i]));
      setInput("");
      setFeedback(null);
      setRevealed("");
      resetTimer(TIMERS[diff]);
      startTimer();
    },
    [resetTimer, startTimer, setGameOver],
  );

  const startGame = useCallback(
    (diff) => {
      const pool = [...SCRAMBLE_WORDS]
        .sort(() => Math.random() - 0.5)
        .slice(0, WORDS_PER_GAME);
      setDifficulty(diff);
      setWords(pool);
      setIdx(0);
      setHints(MAX_HINTS);
      setScore(0);
      nextWord(pool, 0, diff);
    },
    [setScore, nextWord],
  );

  const submit = useCallback(() => {
    stopTimer();
    const correct = input.toLowerCase().trim() === words[idx].toLowerCase();
    if (correct) {
      const pts = elapsed * MULTIPLIERS[difficulty];
      setScore((s) => s + pts);
      setFeedback({ type: "correct", text: `✓ Correct! +${pts}` });
    } else {
      setFeedback({ type: "wrong", text: `✗ The word was: ${words[idx]}` });
    }
    setTimeout(() => {
      const next = idx + 1;
      setIdx(next);
      nextWord(words, next, difficulty);
    }, 1200);
  }, [input, words, idx, elapsed, difficulty, stopTimer, setScore, nextWord]);

  const skip = useCallback(() => {
    stopTimer();
    setFeedback({ type: "skip", text: `Skipped. The word was: ${words[idx]}` });
    setTimeout(() => {
      const next = idx + 1;
      setIdx(next);
      nextWord(words, next, difficulty);
    }, 1000);
  }, [words, idx, difficulty, stopTimer, nextWord]);

  const hint = useCallback(() => {
    if (hints <= 0) return;
    const word = words[idx];
    const revealed = word.slice(0, Math.ceil(word.length / 2));
    setRevealed(revealed);
    setHints((h) => h - 1);
    setScore((s) => Math.max(0, s - 2));
  }, [hints, words, idx, setScore]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Word Scramble</SDiffTitle>
        <SDiffDesc>Unscramble the letters to find the hidden word!</SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => startGame(d)}>
              {d} ({TIMERS[d]}s per word)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SProgress>
        {idx + 1} / {WORDS_PER_GAME}
      </SProgress>
      <STimer $warn={elapsed <= 5}>{elapsed}s</STimer>
      <SScrambled>{scrambled.toUpperCase()}</SScrambled>
      {revealed && <SHint>Hint: {revealed}...</SHint>}
      {feedback && <SFeedback $type={feedback.type}>{feedback.text}</SFeedback>}
      <SInputRow>
        <SInput
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type the word..."
          disabled={!!feedback}
          id="scramble-input"
          spellCheck={false}
          autoCorrect="off"
        />
        <SSubmitBtn onClick={submit} disabled={!input || !!feedback}>
          Go
        </SSubmitBtn>
      </SInputRow>
      <SActions>
        <SHintBtn onClick={hint} disabled={hints <= 0 || !!feedback}>
          Hint (-2pts, {hints} left)
        </SHintBtn>
        <SSkipBtn onClick={skip} disabled={!!feedback}>
          Skip
        </SSkipBtn>
      </SActions>
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
  max-width: 480px;
  width: 100%;
`;
const SProgress = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.4rem;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.textMuted)};
`;
const SScrambled = styled.div`
  font-family: ${theme.font.display};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${theme.colors.accent};
  letter-spacing: 0.2em;
  text-align: center;
`;
const SHint = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.warning};
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) =>
    p.$type === "correct" ? theme.colors.success : theme.colors.danger};
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
  font-size: 1.1rem;
  outline: none;
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
const SActions = styled.div`
  display: flex;
  gap: ${theme.space[3]}px;
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
const SSkipBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
