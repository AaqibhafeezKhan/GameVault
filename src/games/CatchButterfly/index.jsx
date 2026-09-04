import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useTimer } from "../../hooks/useTimer";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;
const GAME_DURATION = 60;
const BUTTERFLY_COUNT = 8;

let nextId = 0;
function makeBF() {
  const x = 80 + Math.random() * (CANVAS_WIDTH - 160);
  const y = 80 + Math.random() * (CANVAS_HEIGHT - 160);
  const color = `hsl(${Math.random() * 360},70%,65%)`;
  return {
    id: nextId++,
    x,
    y,
    cx: x,
    cy: y,
    angle: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 0.8,
    turn: (Math.random() - 0.5) * 0.08,
    wingPhase: Math.random() * Math.PI * 2,
    radius: 16 + Math.random() * 8,
    color,
  };
}

function drawBF(ctx, bf, frame) {
  const wing = Math.sin(bf.wingPhase + frame * 0.18) * 14;
  ctx.fillStyle = bf.color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(bf.x - wing, bf.y - 4, Math.abs(wing), 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bf.x + wing, bf.y - 4, Math.abs(wing), 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(
    bf.x - wing * 0.7,
    bf.y + 6,
    Math.abs(wing) * 0.7,
    5,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    bf.x + wing * 0.7,
    bf.y + 6,
    Math.abs(wing) * 0.7,
    5,
    0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#2a2a3d";
  ctx.beginPath();
  ctx.ellipse(bf.x, bf.y, 3, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

export default function CatchButterfly() {
  const canvasRef = useRef(null);
  const butterfliesRef = useRef(
    Array.from({ length: BUTTERFLY_COUNT }, makeBF),
  );
  const frameRef = useRef(0);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
  } = useTimer(true, GAME_DURATION);
  const [started, setStarted] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (elapsed === 0 && started) {
      stopTimer();
      setGameOver(true);
    }
  }, [elapsed, started, stopTimer, setGameOver]);

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    frameRef.current++;

    for (const bf of butterfliesRef.current) {
      bf.angle += bf.turn + Math.sin(frameRef.current * 0.02 + bf.id) * 0.03;
      bf.x += Math.cos(bf.angle) * bf.speed;
      bf.y += Math.sin(bf.angle) * bf.speed;
      if (bf.x < bf.radius) {
        bf.x = bf.radius;
        bf.angle = Math.PI - bf.angle;
      }
      if (bf.x > CANVAS_WIDTH - bf.radius) {
        bf.x = CANVAS_WIDTH - bf.radius;
        bf.angle = Math.PI - bf.angle;
      }
      if (bf.y < bf.radius) {
        bf.y = bf.radius;
        bf.angle = -bf.angle;
      }
      if (bf.y > CANVAS_HEIGHT - bf.radius) {
        bf.y = CANVAS_HEIGHT - bf.radius;
        bf.angle = -bf.angle;
      }
    }

    ctx.fillStyle = "#0a1a0a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let x = 0; x < CANVAS_WIDTH; x += 40)
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.fillStyle = `rgba(62,240,161,${0.03 + Math.sin(x * 0.1 + frameRef.current * 0.01) * 0.02})`;
        ctx.fillRect(x, y, 38, 38);
      }
    for (const bf of butterfliesRef.current) drawBF(ctx, bf, frameRef.current);

    ctx.font = "600 13px JetBrains Mono, monospace";
    ctx.fillStyle = "#6b6b8a";
    ctx.textAlign = "right";
    ctx.fillText(
      `${butterfliesRef.current.length} left`,
      CANVAS_WIDTH - 10,
      22,
    );
  }, started);

  const handleClick = useCallback(
    (e) => {
      if (!started) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      for (let i = butterfliesRef.current.length - 1; i >= 0; i--) {
        const bf = butterfliesRef.current[i];
        if (Math.hypot(mx - bf.x, my - bf.y) < bf.radius + 6) {
          butterfliesRef.current.splice(i, 1);
          scoreRef.current += 50;
          setScore(scoreRef.current);
          if (!butterfliesRef.current.length) {
            butterfliesRef.current = Array.from(
              { length: BUTTERFLY_COUNT },
              makeBF,
            );
          }
          break;
        }
      }
    },
    [started, setScore],
  );

  const begin = useCallback(() => {
    butterfliesRef.current = Array.from({ length: BUTTERFLY_COUNT }, makeBF);
    scoreRef.current = 0;
    setScore(0);
    setStarted(true);
    startTimer();
  }, [setScore, startTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e) => {
      e.preventDefault();
      handleClick({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouch);
  }, [handleClick]);

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Catch the Butterfly</SDiffTitle>
        <SDiffDesc>
          Click butterflies as they flit around! 50 points each. 60 seconds!
        </SDiffDesc>
        <SDiffBtn onClick={begin}>Start</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <STimer $warn={elapsed <= 10}>{elapsed}s</STimer>
      <SCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
      />
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
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[6]}px;
  font-family: ${theme.font.mono};
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.textMuted)};
`;
const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  cursor: crosshair;
  touch-action: none;
`;
