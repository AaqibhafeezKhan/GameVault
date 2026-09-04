import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 560;
const CELL = 40;
const COLS = Math.floor(CANVAS_WIDTH / CELL);
const ROWS = 9;
const SAFE_ROW = 0;
const ROAD_ROWS = [2, 3, 4];
const RIVER_ROWS = [6, 7, 8];
const FROG_LIVES = 3;

function initialState() {
  const cars = [];
  ROAD_ROWS.forEach((row, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = 1.5 + i * 0.4;
    const count = 3 + i;
    for (let j = 0; j < count; j++) {
      cars.push({
        row,
        x: j * (CANVAS_WIDTH / count),
        dir,
        speed,
        w: 60,
        isLog: false,
      });
    }
  });
  RIVER_ROWS.forEach((row, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = 1 + i * 0.3;
    const count = 2 + i;
    for (let j = 0; j < count; j++) {
      cars.push({
        row,
        x: j * (CANVAS_WIDTH / count),
        dir,
        speed,
        w: 80 + i * 20,
        isLog: true,
      });
    }
  });
  return {
    frog: { x: Math.floor(COLS / 2), y: ROWS - 1 },
    cars,
    lives: FROG_LIVES,
    score: 0,
    frame: 0,
    alive: true,
    onLog: false,
    logVx: 0,
  };
}

function update(state, setScore, setGameOver) {
  state.frame++;
  for (const car of state.cars) {
    car.x += car.dir * car.speed;
    if (car.dir > 0 && car.x > CANVAS_WIDTH) car.x = -car.w;
    if (car.dir < 0 && car.x < -car.w) car.x = CANVAS_WIDTH;
  }

  const frogPx = state.frog.x * CELL + CELL / 2;
  const frogPy = state.frog.y * CELL + CELL / 2;

  state.onLog = false;
  state.logVx = 0;
  if (RIVER_ROWS.includes(state.frog.y)) {
    let onAnyLog = false;
    for (const log of state.cars.filter(
      (c) => c.isLog && c.row === state.frog.y,
    )) {
      if (frogPx > log.x - 4 && frogPx < log.x + log.w + 4) {
        onAnyLog = true;
        state.logVx = log.dir * log.speed;
      }
    }
    if (!onAnyLog) {
      state.lives--;
      if (state.lives <= 0) {
        state.alive = false;
        setGameOver(true);
        return;
      }
      state.frog = { x: Math.floor(COLS / 2), y: ROWS - 1 };
      return;
    }
    state.frog.x = Math.min(
      COLS - 1,
      Math.max(0, state.frog.x + state.logVx / CELL),
    );
  }

  if (ROAD_ROWS.includes(state.frog.y)) {
    for (const car of state.cars.filter(
      (c) => !c.isLog && c.row === state.frog.y,
    )) {
      if (frogPx > car.x + 4 && frogPx < car.x + car.w - 4) {
        state.lives--;
        if (state.lives <= 0) {
          state.alive = false;
          setGameOver(true);
          return;
        }
        state.frog = { x: Math.floor(COLS / 2), y: ROWS - 1 };
        return;
      }
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let row = 0; row < ROWS; row++) {
    const y = row * CELL;
    if (row === SAFE_ROW || row === 1 || row === 5) {
      ctx.fillStyle = "#2a3a2a";
      ctx.fillRect(0, y, CANVAS_WIDTH, CELL);
    } else if (ROAD_ROWS.includes(row)) {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(0, y, CANVAS_WIDTH, CELL);
      ctx.strokeStyle = "#ffffff22";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, y + CELL / 2);
      ctx.lineTo(CANVAS_WIDTH, y + CELL / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (RIVER_ROWS.includes(row)) {
      ctx.fillStyle = "#0a1a3a";
      ctx.fillRect(0, y, CANVAS_WIDTH, CELL);
    }
  }

  for (const car of state.cars) {
    const y = car.row * CELL;
    ctx.fillStyle = car.isLog ? "#7a4a2a" : "#fc5c7d";
    ctx.beginPath();
    ctx.roundRect(car.x, y + 6, car.w, CELL - 12, 6);
    ctx.fill();
    if (!car.isLog) {
      ctx.fillStyle = "#ffffff44";
      ctx.fillRect(car.x + 6, y + 10, 12, 8);
      ctx.fillRect(car.x + car.w - 18, y + 10, 12, 8);
    }
  }

  ctx.fillStyle = "#3ef0a1";
  const fx = state.frog.x * CELL;
  const fy = state.frog.y * CELL;
  ctx.beginPath();
  ctx.ellipse(fx + CELL / 2, fy + CELL / 2, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ac47e";
  ctx.beginPath();
  ctx.arc(fx + CELL / 2 - 6, fy + 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fx + CELL / 2 + 6, fy + 12, 5, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#3ef0a1";
    ctx.beginPath();
    ctx.arc(16 + i * 22, CANVAS_HEIGHT - 14, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Frogger() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();
  const touchRef = useRef({ x: 0, y: 0 });

  const moveFrog = useCallback(
    (dx, dy) => {
      const state = stateRef.current;
      if (!state || !state.alive) return;
      const nx = Math.min(COLS - 1, Math.max(0, state.frog.x + dx));
      const ny = Math.min(ROWS - 1, Math.max(0, state.frog.y + dy));
      state.frog.x = nx;
      state.frog.y = ny;
      if (ny === SAFE_ROW) {
        state.score += 100;
        setScore(state.score);
        setTimeout(() => {
          state.frog = { x: Math.floor(COLS / 2), y: ROWS - 1 };
        }, 500);
      }
    },
    [setScore],
  );

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, true);

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        moveFrog(...dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveFrog]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onStart = (e) => {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > Math.abs(dy)) moveFrog(dx > 0 ? 1 : -1, 0);
      else moveFrog(0, dy > 0 ? 1 : -1);
    };
    canvas.addEventListener("touchstart", onStart);
    canvas.addEventListener("touchend", onEnd);
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [moveFrog]);

  return (
    <SWrapper>
      <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <SHelp>Arrow keys or WASD — reach the top safe zone!</SHelp>
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  touch-action: none;
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
