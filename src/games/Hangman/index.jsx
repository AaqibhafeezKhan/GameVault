import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { WORD_BANK } from "../../utils/wordBank";

const MAX_WRONG = 6;
const WORD_TIERS = [
  WORD_BANK.filter((w) => w.length <= 4),
  WORD_BANK.filter((w) => w.length === 5),
  WORD_BANK.filter((w) => w.length >= 6),
];

function pickWord(difficulty) {
  const tier = difficulty === "Easy" ? 0 : difficulty === "Medium" ? 1 : 2;
  const pool = WORD_TIERS[tier].length ? WORD_TIERS[tier] : WORD_BANK;
  return pool[Math.floor(Math.random() * pool.length)].toUpperCase();
}

const SCAFFOLD = [
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y + 120);
    ctx.lineTo(x + 80, y + 120);
    ctx.stroke();
  },
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 120);
    ctx.lineTo(x + 20, y);
    ctx.stroke();
  },
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + 60, y);
    ctx.stroke();
  },
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x + 60, y);
    ctx.lineTo(x + 60, y + 20);
    ctx.stroke();
  },
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.arc(x + 60, y + 30, 10, 0, Math.PI * 2);
    ctx.stroke();
  },
  (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 40);
    ctx.lineTo(x + 60, y + 75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 55);
    ctx.lineTo(x + 45, y + 68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 55);
    ctx.lineTo(x + 75, y + 68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 75);
    ctx.lineTo(x + 45, y + 90);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 75);
    ctx.lineTo(x + 75, y + 90);
    ctx.stroke();
  },
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Hangman() {
  const [word, setWord] = useState(null);
  const [guessed, setGuessed] = useState(new Set());
  const [wrong, setWrong] = useState(0);
  const [score, setScoreLocal] = useState(100);
  const [difficulty, setDifficulty] = useState(null);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (diff) => {
      const w = pickWord(diff);
      setDifficulty(diff);
      setWord(w);
      setGuessed(new Set());
      setWrong(0);
      setScoreLocal(100);
      setScore(0);
    },
    [setScore],
  );

  const guess = useCallback(
    (letter) => {
      if (!word || guessed.has(letter)) return;
      const newGuessed = new Set(guessed);
      newGuessed.add(letter);
      setGuessed(newGuessed);

      if (!word.includes(letter)) {
        const newWrong = wrong + 1;
        setWrong(newWrong);
        if (newWrong >= MAX_WRONG) {
          setGameOver(true);
        }
      } else {
        const revealed = word.split("").filter((l) => newGuessed.has(l)).length;
        const total = word.length;
        const newScore = Math.max(0, score);
        setScoreLocal(newScore);
        setScore(newScore);
        if (revealed === total) {
          setGameOver(true);
        }
      }
    },
    [word, guessed, wrong, score, setScore, setGameOver],
  );

  const hint = useCallback(() => {
    if (!word) return;
    const unguessed = word.split("").filter((l) => !guessed.has(l));
    if (!unguessed.length) return;
    const letter = unguessed[Math.floor(Math.random() * unguessed.length)];
    guess(letter);
    setScoreLocal((s) => Math.max(0, s - 10));
    setScore((s) => Math.max(0, s - 10));
  }, [word, guessed, guess, setScore]);

  const drawHangman = (wrong) => {
    const canvas = document.createElement("canvas");
    canvas.width = 140;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 140, 140);
    ctx.strokeStyle = "#e8e8f0";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < wrong; i++) SCAFFOLD[i](ctx, 10, 5);
    return canvas.toDataURL();
  };

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Hangman</SDiffTitle>
        <SDiffDesc>Guess the word before the hangman is complete</SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  const revealed = word
    ? word.split("").map((l) => (guessed.has(l) ? l : "_"))
    : [];
  const won = revealed.every((l) => l !== "_");

  return (
    <SWrapper>
      <SHangmanImg src={drawHangman(wrong)} alt={`${wrong} wrong guesses`} />
      <SWrongCount>
        Wrong: {wrong} / {MAX_WRONG}
      </SWrongCount>
      <SWord>{revealed.join(" ")}</SWord>
      {(won || wrong >= MAX_WRONG) && (
        <SWordReveal $won={won}>
          {won ? `Well done! "${word}"` : `The word was "${word}"`}
        </SWordReveal>
      )}
      <SLetters>
        {LETTERS.map((l) => (
          <SLetterBtn
            key={l}
            onClick={() => guess(l)}
            disabled={guessed.has(l)}
            $correct={word && guessed.has(l) && word.includes(l)}
            $wrong={word && guessed.has(l) && !word.includes(l)}
          >
            {l}
          </SLetterBtn>
        ))}
      </SLetters>
      <SActions>
        <SHintBtn onClick={hint} disabled={won || wrong >= MAX_WRONG}>
          Hint (-10)
        </SHintBtn>
        <SNewBtn onClick={() => start(difficulty)}>New Word</SNewBtn>
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
`;
const SHangmanImg = styled.img`
  width: 140px;
  height: 140px;
  image-rendering: pixelated;
`;
const SWrongCount = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.danger};
`;
const SWord = styled.div`
  font-family: ${theme.font.mono};
  font-size: 2rem;
  letter-spacing: 0.3em;
  color: ${theme.colors.text};
`;
const SWordReveal = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) => (p.$won ? theme.colors.success : theme.colors.danger)};
`;
const SLetters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 400px;
  justify-content: center;
`;
const SLetterBtn = styled.button`
  width: 34px;
  height: 34px;
  background: ${(p) =>
    p.$correct
      ? theme.colors.success + "22"
      : p.$wrong
        ? theme.colors.danger + "22"
        : "transparent"};
  border: 1px solid
    ${(p) =>
      p.$correct
        ? theme.colors.success
        : p.$wrong
          ? theme.colors.danger
          : theme.colors.border};
  color: ${(p) =>
    p.$correct
      ? theme.colors.success
      : p.$wrong
        ? theme.colors.danger
        : theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 100ms ease-out;
  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
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
  transition: background 150ms ease-out;
  &:hover:not(:disabled) {
    background: ${theme.colors.warning}22;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const SNewBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
