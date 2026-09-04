import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const ROAD_W = 320;
const ROAD_X = (CANVAS_WIDTH - ROAD_W) / 2;
const PLAYER_W = 40;
const PLAYER_H = 65;
const SCROLL_BASE = 3;
const LIVES = 3;
const LAP_DIST = 500;

function randomAI() {
  const lane = Math.floor(Math.random() * 3);
  const x = ROAD_X + 20 + lane * (ROAD_W / 3 - PLAYER_W / 2);
  return {
    x,
    y: -PLAYER_H - Math.random() * 300,
    color: ["#fc9c5c", "#fc5c7d", "#5cc8fc"][lane],
    speed: 1 + Math.random(),
  };
}

function initialState() {
  return {
    player: { x: CANVAS_WIDTH / 2 - PLAYER_W / 2 },
    aiCars: [randomAI(), randomAI(), randomAI()],
    scrollY: 0,
    score: 0,
    lives: LIVES,
    lapDist: 0,
    laps: 0,
    keys: {},
    alive: true,
  };
}

function update(state, setScore, setGameOver) {
  const { player, keys } = state;
  const speed = SCROLL_BASE + Math.floor(state.score / 200) * 0.5;

  if (keys["ArrowLeft"] || keys["KeyA"])
    player.x = Math.max(ROAD_X + 4, player.x - 5);
  if (keys["ArrowRight"] || keys["KeyD"])
    player.x = Math.min(ROAD_X + ROAD_W - PLAYER_W - 4, player.x + 5);

  state.scrollY = (state.scrollY + speed + 4) % 80;
  state.score += 0.1;
  setScore(Math.floor(state.score));
  state.lapDist += speed;
  if (state.lapDist >= LAP_DIST) {
    state.laps++;
    state.lapDist = 0;
  }

  for (const car of state.aiCars) {
    car.y += speed + car.speed;
    if (car.y > CANVAS_HEIGHT + 50) {
      const updated = randomAI();
      car.x = updated.x;
      car.y = -PLAYER_H - Math.random() * 200;
      car.speed = updated.speed;
      car.color = updated.color;
    }
    const py = CANVAS_HEIGHT - 120;
    if (
      car.y + PLAYER_H > py &&
      car.y < py + PLAYER_H &&
      car.x + PLAYER_W > player.x + 4 &&
      car.x < player.x + PLAYER_W - 4
    ) {
      state.lives--;
      car.y = -PLAYER_H - 300;
      if (state.lives <= 0) {
        state.alive = false;
        setGameOver(true);
      }
    }
  }
}

function drawCar(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, PLAYER_W, PLAYER_H);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x + 4, y + 8, PLAYER_W - 8, 18);
  ctx.fillStyle = "#f0c93e";
  ctx.fillRect(x + 4, y, 8, 6);
  ctx.fillRect(x + PLAYER_W - 12, y, 8, 6);
  ctx.fillStyle = "#e8e8f0";
  ctx.fillRect(x + 4, y + PLAYER_H - 8, 8, 6);
  ctx.fillRect(x + PLAYER_W - 12, y + PLAYER_H - 8, 8, 6);
}

function draw(ctx, state) {
  ctx.fillStyle = "#2a2a3d";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#3a3a55";
  ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_HEIGHT);

  ctx.strokeStyle = "#e8e8f044";
  ctx.lineWidth = 4;
  ctx.setLineDash([40, 40]);
  ctx.lineDashOffset = -state.scrollY;
  for (let i = 1; i <= 2; i++) {
    const x = ROAD_X + i * (ROAD_W / 3);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = "#ffffff44";
  ctx.lineWidth = 4;
  ctx.strokeRect(ROAD_X, 0, ROAD_W, CANVAS_HEIGHT);

  for (const car of state.aiCars) drawCar(ctx, car.x, car.y, car.color);
  drawCar(ctx, state.player.x, CANVAS_HEIGHT - 120, "#7c5cfc");

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#7c5cfc";
    ctx.fillRect(10 + i * 18, CANVAS_HEIGHT - 22, 12, 18);
  }

  ctx.font = "600 13px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "right";
  ctx.fillText(`LAPS ${state.laps}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 6);
}

export default function RacingGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, true);

  useEffect(() => {
    const onDown = (e) => {
      if (stateRef.current) stateRef.current.keys[e.code] = true;
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const tx = e.touches[0].clientX - rect.left;
      if (stateRef.current) {
        stateRef.current.player.x = Math.max(
          ROAD_X + 4,
          Math.min(ROAD_X + ROAD_W - PLAYER_W - 4, tx - PLAYER_W / 2),
        );
      }
    };
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchmove", onTouch);
  }, []);

  return (
    <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
  );
}

const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  touch-action: none;
`;
