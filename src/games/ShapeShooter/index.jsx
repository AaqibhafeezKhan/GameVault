import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";
import { useTimer } from "../../hooks/useTimer";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const GAME_DURATION = 60;
const SHRINK_TIME = 3000;
const SPAWN_INTERVAL_BASE = 80;
const POINTS = { pentagon: 50, triangle: 30, square: 20, circle: 10 };
const SHAPE_TYPES = ["circle", "square", "triangle", "pentagon"];
const SHAPE_COLORS = {
  pentagon: "#f0c93e",
  triangle: "#fc5c7d",
  square: "#7c5cfc",
  circle: "#3ef0a1",
};

let nextId = 0;
function spawnShape(score) {
  const types = SHAPE_TYPES;
  const type = types[Math.floor(Math.random() * types.length)];
  const r = 20 + Math.random() * 20;
  return {
    id: nextId++,
    type,
    r,
    x: r + Math.random() * (CANVAS_WIDTH - r * 2),
    y: r + Math.random() * (CANVAS_HEIGHT - r * 2),
    born: Date.now(),
    color: SHAPE_COLORS[type],
  };
}

function drawShape(ctx, shape, frac) {
  const { type, x, y, r, color } = shape;
  const cr = r * frac;
  if (cr <= 0) return;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3 + frac * 0.7;
  if (type === "circle") {
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "square") {
    ctx.fillRect(x - cr, y - cr, cr * 2, cr * 2);
  } else if (type === "triangle") {
    ctx.beginPath();
    ctx.moveTo(x, y - cr);
    ctx.lineTo(x + cr, y + cr);
    ctx.lineTo(x - cr, y + cr);
    ctx.closePath();
    ctx.fill();
  } else if (type === "pentagon") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * cr,
        py = y + Math.sin(angle) * cr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default function ShapeShooter() {
  const canvasRef = useRef(null);
  const shapesRef = useRef([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const { setScore, setGameOver } = useGameShell();
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
    frameRef.current++;
    const spawnInterval = Math.max(
      20,
      SPAWN_INTERVAL_BASE - Math.floor(scoreRef.current / 20) * 5,
    );
    if (frameRef.current % spawnInterval === 0) {
      shapesRef.current.push(spawnShape(scoreRef.current));
    }
    const now = Date.now();
    shapesRef.current = shapesRef.current.filter(
      (s) => now - s.born < SHRINK_TIME + 200,
    );

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (const s of shapesRef.current) {
      const frac = Math.max(0, 1 - (now - s.born) / SHRINK_TIME);
      drawShape(ctx, s, frac);
    }
  }, started);

  const handleClick = useCallback(
    (e) => {
      if (!started) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      const now = Date.now();
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const s = shapesRef.current[i];
        const frac = Math.max(0, 1 - (now - s.born) / SHRINK_TIME);
        const cr = s.r * frac;
        const dist = Math.hypot(mx - s.x, my - s.y);
        if (dist < cr + 4) {
          shapesRef.current.splice(i, 1);
          scoreRef.current += POINTS[s.type];
          setScore(scoreRef.current);
          break;
        }
      }
    },
    [started, setScore],
  );

  const begin = useCallback(() => {
    shapesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
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
        <SDiffTitle>Shape Shooter</SDiffTitle>
        <SDiffDesc>
          Click shapes before they shrink away! Pentagon=50, Triangle=30,
          Square=20, Circle=10
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
  max-width: 400px;
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
