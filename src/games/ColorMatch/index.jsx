import { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useTimer } from "../../hooks/useTimer";

const GAME_DURATION = 30;

function randomHsl() {
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 30);
  const l = 40 + Math.floor(Math.random() * 25);
  return `hsl(${h},${s}%,${l}%)`;
}

function generateRound(score) {
  const target = randomHsl();
  const delta = Math.max(15, 60 - Math.floor(score / 5) * 3);
  const options = [target];
  while (options.length < 6) {
    const h = parseInt(target.match(/\d+/)[0]);
    const newH =
      (h +
        (Math.random() > 0.5 ? 1 : -1) * (delta / 2 + Math.random() * delta)) %
      360;
    options.push(`hsl(${Math.round(newH)},${50}%,${50}%)`);
  }
  return { target, options: options.sort(() => Math.random() - 0.5) };
}

export default function ColorMatch() {
  const [difficulty, setDifficulty] = useState(null);
  const [round, setRound] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, GAME_DURATION);

  const nextRound = useCallback((sc) => {
    setRound(generateRound(sc));
    setSelected(null);
    setFeedback(null);
  }, []);

  const startGame = useCallback(
    (diff) => {
      setDifficulty(diff);
      nextRound(0);
      resetTimer(GAME_DURATION);
      startTimer();
      setScore(0);
    },
    [nextRound, resetTimer, startTimer, setScore],
  );

  useEffect(() => {
    if (elapsed === 0 && difficulty) {
      stopTimer();
      setGameOver(true);
    }
  }, [elapsed, difficulty, stopTimer, setGameOver]);

  const handlePick = useCallback(
    (color) => {
      if (selected || !round) return;
      setSelected(color);
      const correct = color === round.target;
      if (correct) {
        setFeedback("✓ Correct!");
        setScore((s) => {
          const next = s + 10;
          setTimeout(() => nextRound(next), 700);
          return next;
        });
      } else {
        setFeedback("✗ Wrong!");
        setScore((s) => {
          const next = Math.max(0, s - 5);
          setTimeout(() => nextRound(next), 700);
          return next;
        });
      }
    },
    [selected, round, setScore, nextRound],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Color Matching</SDiffTitle>
        <SDiffDesc>
          Match the target color from the swatches — colors get more similar
          over time!
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

  if (!round) return null;

  return (
    <SWrapper>
      <STimer $warn={elapsed <= 5}>{elapsed}s</STimer>
      <SLabel>Match this color:</SLabel>
      <STarget style={{ background: round.target }} />
      {feedback && (
        <SFeedback $ok={feedback.startsWith("✓")}>{feedback}</SFeedback>
      )}
      <SGrid>
        {round.options.map((color, i) => (
          <SSwatch
            key={`${color}-${i}`}
            style={{ background: color }}
            $selected={selected === color}
            $correct={selected && color === round.target}
            $wrong={selected === color && color !== round.target}
            onClick={() => handlePick(color)}
          />
        ))}
      </SGrid>
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
  max-width: 340px;
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
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.2rem;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.textMuted)};
`;
const SLabel = styled.div`
  font-family: ${theme.font.body};
  color: ${theme.colors.textMuted};
`;
const STarget = styled.div`
  width: 140px;
  height: 140px;
  border-radius: ${theme.radius.md};
  border: 2px solid ${theme.colors.border};
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${(p) => (p.$ok ? theme.colors.success : theme.colors.danger)};
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;
const SSwatch = styled.div`
  width: 100px;
  height: 100px;
  border-radius: ${theme.radius.sm};
  cursor: pointer;
  border: 3px solid
    ${(p) =>
      p.$correct
        ? theme.colors.success
        : p.$wrong
          ? theme.colors.danger
          : "transparent"};
  transition:
    transform 100ms ease-out,
    border-color 100ms ease-out;
  &:hover {
    transform: scale(1.05);
  }
`;
