import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useTimer } from "../../hooks/useTimer";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;
const LIVES = 3;
const GAME_DURATION = 60;

const BALLOON_COLORS = [
  "#fc5c7d",
  "#7c5cfc",
  "#f0c93e",
  "#3ef0a1",
  "#5cc8fc",
  "#fc9c5c",
];

function randomBalloon() {
  const r = 15 + Math.random() * 20;
  const points = r < 20 ? 30 : r < 30 ? 20 : 10;
  return {
    x: r + Math.random() * (CANVAS_WIDTH - r * 2),
    y: CANVAS_HEIGHT + r,
    r,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(1.5 + Math.random() * 1.5),
    color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    points,
    popped: false,
  };
}

function initialState() {
  return {
    balloons: [],
    frame: 0,
    score: 0,
    lives: LIVES,
    popped: 0,
    alive: true,
  };
}

function update(state, setScore, setGameOver) {
  state.frame++;
  const spawnRate = Math.max(20, 60 - Math.floor(state.popped / 15) * 5);
  if (state.frame % spawnRate === 0) state.balloons.push(randomBalloon());

  for (let i = state.balloons.length - 1; i >= 0; i--) {
    const b = state.balloons[i];
    b.x += b.vx + Math.sin(state.frame * 0.05 + i) * 0.5;
    b.y += b.vy;
    if (b.x < b.r) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
    }
    if (b.x > CANVAS_WIDTH - b.r) {
      b.x = CANVAS_WIDTH - b.r;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y + b.r < 0 && !b.popped) {
      state.balloons.splice(i, 1);
      state.lives--;
      if (state.lives <= 0) {
        state.alive = false;
        setGameOver(true);
      }
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const b of state.balloons) {
    if (b.popped) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a0a0f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.r);
    ctx.quadraticCurveTo(b.x + 5, b.y + b.r + 15, b.x, b.y + b.r + 25);
    ctx.stroke();
  }

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#fc5c7d";
    ctx.beginPath();
    ctx.arc(16 + i * 24, 20, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function BalloonPop() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
  } = useTimer(true, GAME_DURATION);
  const [started, setStarted] = useState(false);

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
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, true);

  useEffect(() => {
    stateRef.current = initialState();
    startTimer();
    setStarted(true);
  }, [startTimer]);

  const handleClick = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      const state = stateRef.current;
      for (const b of state.balloons) {
        if (Math.hypot(b.x - mx, b.y - my) < b.r) {
          b.popped = true;
          state.score += b.points * (state.popped > 50 ? 2 : 1);
          state.popped++;
          setScore(state.score);
          setTimeout(() => {
            const idx = state.balloons.indexOf(b);
            if (idx !== -1) state.balloons.splice(idx, 1);
          }, 50);
          break;
        }
      }
    },
    [setScore],
  );

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

  return (
    <SWrapper>
      <STimer $warn={elapsed <= 10}>{elapsed}s remaining</STimer>
      <SCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
      />
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
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
