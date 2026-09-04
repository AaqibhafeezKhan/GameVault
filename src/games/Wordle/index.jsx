import { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { WORD_BANK } from "../../utils/wordBank";

const FIVE_LETTER_WORDS = [
  ...new Set(
    WORD_BANK.filter((w) => w.length === 5).map((w) => w.toUpperCase()),
  ),
];
const MAX_GUESSES = 6;

function evaluateGuess(guess, target) {
  const result = Array(5).fill("absent");
  const targetArr = target.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct") {
      const idx = targetArr.findIndex((c, j) => c === guessArr[i] && !used[j]);
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      }
    }
  }
  return result;
}

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "⌫"],
];

export default function Wordle() {
  const [target, setTarget] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [gameOver, setLocalGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [letterStates, setLetterStates] = useState({});
  const { setScore, setGameOver } = useGameShell();

  const newGame = useCallback(() => {
    const word =
      FIVE_LETTER_WORDS[Math.floor(Math.random() * FIVE_LETTER_WORDS.length)];
    setTarget(word);
    setGuesses([]);
    setCurrent("");
    setLocalGameOver(false);
    setWon(false);
    setLetterStates({});
    setScore(0);
    setGameOver(false);
  }, [setScore, setGameOver]);

  useEffect(() => {
    newGame();
  }, []); // eslint-disable-line

  const submitGuess = useCallback(() => {
    if (current.length !== 5 || gameOver) return;
    const result = evaluateGuess(current, target);
    const newGuesses = [...guesses, { word: current, result }];
    setGuesses(newGuesses);
    setCurrent("");

    const newStates = { ...letterStates };
    for (let i = 0; i < 5; i++) {
      const l = current[i];
      const prev = newStates[l];
      if (
        result[i] === "correct" ||
        (result[i] === "present" && prev !== "correct") ||
        (!prev && result[i] === "absent")
      ) {
        newStates[l] = result[i];
      }
    }
    setLetterStates(newStates);

    if (current === target) {
      const pts = (MAX_GUESSES - newGuesses.length + 1) * 100;
      setScore(pts);
      setWon(true);
      setLocalGameOver(true);
      setGameOver(true);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setLocalGameOver(true);
      setGameOver(true);
    }
  }, [current, target, guesses, gameOver, letterStates, setScore, setGameOver]);

  const appendLetter = useCallback(
    (l) => {
      if (gameOver) return;
      if (l === "⌫") {
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (l === "ENTER") {
        submitGuess();
        return;
      }
      if (current.length < 5) setCurrent((c) => c + l);
    },
    [gameOver, current, submitGuess],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") submitGuess();
      else if (e.key === "Backspace") setCurrent((c) => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key)) appendLetter(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitGuess, appendLetter]);

  const STATE_COLORS = {
    correct: theme.colors.success,
    present: theme.colors.warning,
    absent: theme.colors.surfaceAlt,
    "": theme.colors.surface,
  };

  return (
    <SWrapper>
      <SBoard>
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          const guess = guesses[i];
          const isActive = i === guesses.length;
          const word = isActive ? current : guess ? guess.word : "";
          return (
            <SRow key={i}>
              {Array.from({ length: 5 }, (_, j) => {
                const state = guess ? guess.result[j] : "";
                return (
                  <STile key={j} $state={state} $filled={!!word[j] && !guess}>
                    {word[j] || ""}
                  </STile>
                );
              })}
            </SRow>
          );
        })}
      </SBoard>
      {gameOver && (
        <SReveal $won={won}>
          {won
            ? `🎉 ${MAX_GUESSES - guesses.length + 1} guesses left`
            : `The word was: ${target}`}
        </SReveal>
      )}
      <SKeyboard>
        {KEYBOARD_ROWS.map((row, ri) => (
          <SKeyRow key={ri}>
            {row.map((k) => (
              <SKey
                key={k}
                $wide={k === "ENTER" || k === "⌫"}
                $state={letterStates[k]}
                onClick={() => appendLetter(k)}
              >
                {k}
              </SKey>
            ))}
          </SKeyRow>
        ))}
      </SKeyboard>
      <SNewBtn onClick={newGame}>New Word</SNewBtn>
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SBoard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const SRow = styled.div`
  display: flex;
  gap: 4px;
`;
const STATE_BG = {
  correct: theme.colors.success + "88",
  present: theme.colors.warning + "88",
  absent: theme.colors.surfaceAlt,
  "": theme.colors.surface,
};
const STATE_BORDER = {
  correct: theme.colors.success,
  present: theme.colors.warning,
  absent: theme.colors.border,
  "": theme.colors.border,
};
const STile = styled.div`
  width: 54px;
  height: 54px;
  background: ${(p) => STATE_BG[p.$state] || theme.colors.surface};
  border: 2px solid
    ${(p) =>
      STATE_BORDER[p.$state] ||
      (p.$filled ? theme.colors.textMuted : theme.colors.border)};
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-size: 1.4rem;
  font-weight: 700;
  color: ${theme.colors.text};
  text-transform: uppercase;
  transition:
    background 200ms ease-out,
    border-color 200ms ease-out;
`;
const SReveal = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) => (p.$won ? theme.colors.success : theme.colors.danger)};
`;
const SKeyboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
`;
const SKeyRow = styled.div`
  display: flex;
  gap: 4px;
`;
const KEY_BG = {
  correct: theme.colors.success,
  present: theme.colors.warning,
  absent: theme.colors.surfaceAlt,
};
const SKey = styled.button`
  min-width: ${(p) => (p.$wide ? "60px" : "36px")};
  height: 44px;
  background: ${(p) => KEY_BG[p.$state] || theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  font-family: ${theme.font.mono};
  font-size: ${(p) => (p.$wide ? "0.6rem" : "0.8rem")};
  cursor: pointer;
  transition: background 200ms ease-out;
  &:hover {
    opacity: 0.8;
  }
`;
const SNewBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
