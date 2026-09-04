import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useTimer } from "../../hooks/useTimer";

const GRID_SIZE = 9;
const INTERVALS = { Easy: 1200, Medium: 900, Hard: 600 };
const GAME_DURATION = 30;

export default function WhackAMole() {
  const [difficulty, setDifficulty] = useState(null);
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const [lives, setLives] = useState(3);
  const interval = useRef(null);
  const { setScore, setGameOver, soundEnabled } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer(true, GAME_DURATION);

  const cleanup = useCallback(() => {
    clearInterval(interval.current);
    stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    if (elapsed === 0 && running) {
      cleanup();
      setRunning(false);
      setGameOver(true);
    }
  }, [elapsed, running, cleanup, setGameOver]);

  const startGame = useCallback(
    (diff) => {
      setDifficulty(diff);
      setRunning(true);
      setLives(diff === "Hard" ? 3 : 99);
      setActive(-1);
      resetTimer(GAME_DURATION);
      startTimer();
      const ms = INTERVALS[diff];
      interval.current = setInterval(() => {
        setActive(Math.floor(Math.random() * GRID_SIZE));
      }, ms);
    },
    [resetTimer, startTimer],
  );

  const handleWhack = useCallback(
    (i) => {
      if (!running || active !== i) return;
      setActive(-1);
      setScore((prev) => {
        const next = prev + 1;
        if (next % 10 === 0 && interval.current) {
          clearInterval(interval.current);
          const newMs = Math.max(
            300,
            INTERVALS[difficulty] - Math.floor(next / 10) * 50,
          );
          interval.current = setInterval(() => {
            setActive(Math.floor(Math.random() * GRID_SIZE));
          }, newMs);
        }
        return next;
      });
    },
    [running, active, difficulty, setScore],
  );

  const handleMiss = useCallback(
    (i) => {
      if (!running || active !== i) return;
      if (difficulty === "Hard") {
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) {
            cleanup();
            setRunning(false);
            setGameOver(true);
          }
          return next;
        });
      }
    },
    [running, active, difficulty, cleanup, setGameOver],
  );

  useEffect(() => {
    if (active === -1 || !running) return;
    const ms = INTERVALS[difficulty];
    const timer = setTimeout(() => handleMiss(active), ms);
    return () => clearTimeout(timer);
  }, [active, running, difficulty, handleMiss]);

  useEffect(() => () => clearInterval(interval.current), []);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Whack-a-Mole</SDiffTitle>
        <SDiffDesc>30 seconds, whack as many moles as possible!</SDiffDesc>
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

  return (
    <SWrapper>
      <SStats>
        <SStat>
          Time: <SStatVal $warn={elapsed <= 5}>{elapsed}s</SStatVal>
        </SStat>
        {difficulty === "Hard" && (
          <SStat>
            Lives: <SStatVal>{lives}</SStatVal>
          </SStat>
        )}
      </SStats>
      <SGrid>
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <SHole key={i} onClick={() => handleWhack(i)}>
            <SMole $visible={active === i} />
          </SHole>
        ))}
      </SGrid>
    </SWrapper>
  );
}

const popUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

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
  gap: ${theme.space[4]}px;
`;

const SStats = styled.div`
  display: flex;
  gap: ${theme.space[5]}px;
`;

const SStat = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
`;

const SStatVal = styled.span`
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.accent)};
`;

const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const SHole = styled.div`
  width: 120px;
  height: 120px;
  background: ${theme.colors.surfaceAlt};
  border: 1px solid ${theme.colors.border};
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
`;

const SMole = styled.div`
  width: 80px;
  height: 80px;
  background: radial-gradient(circle at 35% 35%, #c8a97a, #7a5230);
  border-radius: 50% 50% 40% 40%;
  position: relative;
  transform: translateY(${(p) => (p.$visible ? "0" : "100%")});
  transition: transform 120ms ease-out;
  ${(p) => p.$visible && `animation: ${popUp} 120ms ease-out;`}
  &::before {
    content: "👀";
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.4rem;
  }
`;
