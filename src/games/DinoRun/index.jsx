import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 240;
const DINO_W = 40;
const DINO_H = 50;
const DINO_X = 80;
const GROUND_Y = CANVAS_HEIGHT - 60;
const JUMP_VEL = -13;
const GRAVITY = 0.6;
const BASE_SPEED = 5;

function randomObstacle(speed) {
  const w = 20 + Math.floor(Math.random() * 20);
  const h = 30 + Math.floor(Math.random() * 40);
  return { x: CANVAS_WIDTH + 50, w, h, y: GROUND_Y + DINO_H - h };
}

function initialState() {
  return {
    dino: { y: GROUND_Y, vy: 0, onGround: true, ducking: false },
    obstacles: [],
    score: 0,
    frame: 0,
    alive: true,
    speed: BASE_SPEED,
    keys: {},
    nextSpawn: 80,
  };
}

function update(state, setScore, setGameOver) {
  const { dino, keys } = state;
  state.frame++;
  state.score += 0.1;
  setScore(Math.floor(state.score));
  state.speed = BASE_SPEED + Math.floor(state.score / 100) * 0.3;

  const jump = keys["Space"] || keys["ArrowUp"];
  dino.ducking = keys["ArrowDown"];

  if (jump && dino.onGround) {
    dino.vy = JUMP_VEL;
    dino.onGround = false;
  }
  dino.vy += GRAVITY;
  dino.y += dino.vy;
  if (dino.y >= GROUND_Y) {
    dino.y = GROUND_Y;
    dino.vy = 0;
    dino.onGround = true;
  }

  if (state.frame >= state.nextSpawn) {
    state.obstacles.push(randomObstacle(state.speed));
    state.nextSpawn = state.frame + 60 + Math.floor(Math.random() * 60);
  }

  for (const obs of state.obstacles) obs.x -= state.speed;
  state.obstacles = state.obstacles.filter((o) => o.x > -100);

  const dinoH = dino.ducking ? DINO_H * 0.6 : DINO_H;
  const dinoY = dino.ducking ? dino.y + (DINO_H - dinoH) : dino.y;

  for (const obs of state.obstacles) {
    if (
      DINO_X + DINO_W - 6 > obs.x + 4 &&
      DINO_X + 4 < obs.x + obs.w - 4 &&
      dinoY + dinoH - 6 > obs.y + 4
    ) {
      state.alive = false;
      setGameOver(true);
    }
  }

  const elapsed = Math.floor(state.score / 100);
  if (elapsed > 0 && elapsed % 5 === 0) state.speed += 0.01;
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "#2a2a3d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + DINO_H + 2);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + DINO_H + 2);
  ctx.stroke();

  const { dino } = state;
  const dinoH = dino.ducking ? DINO_H * 0.6 : DINO_H;
  const dinoY = dino.ducking ? dino.y + (DINO_H - dinoH) : dino.y;

  ctx.fillStyle = "#7c5cfc";
  ctx.fillRect(DINO_X, dinoY, DINO_W, dinoH);
  ctx.fillStyle = "#e8e8f0";
  ctx.fillRect(DINO_X + DINO_W - 8, dinoY + 6, 6, 6);
  if (!dino.ducking) {
    ctx.fillStyle = "#7c5cfc";
    ctx.fillRect(DINO_X + DINO_W - 2, dinoY + DINO_H - 8, 8, 4);
  }

  ctx.fillStyle = "#fc5c7d";
  for (const obs of state.obstacles) {
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.fillStyle = "#3ef0a1";
    ctx.fillRect(obs.x + 2, obs.y, obs.w - 4, 6);
    ctx.fillStyle = "#fc5c7d";
  }

  ctx.font = "600 13px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "right";
  ctx.fillText(`SCORE ${Math.floor(state.score)}`, CANVAS_WIDTH - 12, 22);

  if (!state.alive) {
    ctx.fillStyle = "#fc5c7d44";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#e8e8f0";
    ctx.textAlign = "center";
    ctx.font = "600 18px JetBrains Mono, monospace";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

export default function DinoRun() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();
  const [started, setStarted] = useState(false);

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, started);

  useEffect(() => {
    const onDown = (e) => {
      if (!stateRef.current) return;
      stateRef.current.keys[e.code] = true;
      if (!started && (e.code === "Space" || e.code === "ArrowUp")) {
        e.preventDefault();
        setStarted(true);
      }
      if (e.code === "Space") e.preventDefault();
    };
    const onUp = (e) => {
      if (stateRef.current) stateRef.current.keys[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [started]);

  const handleTap = useCallback(() => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (stateRef.current && stateRef.current.dino.onGround) {
      stateRef.current.dino.vy = JUMP_VEL;
      stateRef.current.dino.onGround = false;
    }
  }, [started]);

  return (
    <SWrapper>
      <SCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleTap}
      />
      <SHelp>Space/↑ to jump, ↓ to duck. Tap to start!</SHelp>
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
  cursor: pointer;
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
