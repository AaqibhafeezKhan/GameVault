import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const GRAVITY = 0.3;
const LIVES = 3;

const BUMPER_POSITIONS = [
  { x: 160, y: 200, r: 28 },
  { x: 320, y: 200, r: 28 },
  { x: 240, y: 120, r: 28 },
];
const FLIPPER_W = 90;
const FLIPPER_H = 12;
const FLIPPER_Y = CANVAS_HEIGHT - 80;

function initialState() {
  return {
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 3, vx: 2, vy: 1, r: 12 },
    leftFlipper: false,
    rightFlipper: false,
    score: 0,
    lives: LIVES,
    alive: true,
    multiplier: 1,
    bumperFrames: [0, 0, 0],
  };
}

function update(state, setScore, setGameOver) {
  const { ball } = state;
  ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x + ball.r > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  for (let i = 0; i < BUMPER_POSITIONS.length; i++) {
    const b = BUMPER_POSITIONS[i];
    const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
    if (dist < ball.r + b.r) {
      const angle = Math.atan2(ball.y - b.y, ball.x - b.x);
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx = Math.cos(angle) * Math.max(speed, 5);
      ball.vy = Math.sin(angle) * Math.max(speed, 5);
      ball.x = b.x + Math.cos(angle) * (ball.r + b.r + 1);
      ball.y = b.y + Math.sin(angle) * (ball.r + b.r + 1);
      state.score += 50 * state.multiplier;
      setScore(state.score);
      state.bumperFrames[i] = 15;
    }
    if (state.bumperFrames[i] > 0) state.bumperFrames[i]--;
  }

  const leftX = 50,
    rightX = CANVAS_WIDTH - 50 - FLIPPER_W;
  const leftAngle = state.leftFlipper ? -0.5 : 0.4;
  const rightAngle = state.rightFlipper ? 0.5 : -0.4;

  const checkFlipper = (fx, fy, angle) => {
    const cos = Math.cos(angle),
      sin = Math.sin(angle);
    const bx = ball.x - fx,
      by = ball.y - fy;
    const rx = bx * cos + by * sin,
      ry = -bx * sin + by * cos;
    if (
      rx > -5 &&
      rx < FLIPPER_W + 5 &&
      ry > -ball.r &&
      ry < FLIPPER_H + ball.r
    ) {
      ball.vy = -(Math.abs(ball.vy) + 2);
      ball.vx += angle * 5;
      ball.y = fy + Math.sin(angle) * rx - (ball.r + FLIPPER_H);
    }
  };
  checkFlipper(leftX, FLIPPER_Y, leftAngle);
  checkFlipper(rightX, FLIPPER_Y, rightAngle);

  if (ball.y > CANVAS_HEIGHT + ball.r) {
    state.lives--;
    if (state.lives <= 0) {
      state.alive = false;
      setGameOver(true);
    } else {
      ball.x = CANVAS_WIDTH / 2;
      ball.y = CANVAS_HEIGHT / 3;
      ball.vx = 2;
      ball.vy = 1;
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#1c1c27";
  ctx.fillRect(0, 0, 50, CANVAS_HEIGHT);
  ctx.fillRect(CANVAS_WIDTH - 50, 0, 50, CANVAS_HEIGHT);

  for (let i = 0; i < BUMPER_POSITIONS.length; i++) {
    const b = BUMPER_POSITIONS[i];
    const flash = state.bumperFrames[i] > 0;
    ctx.fillStyle = flash ? "#ffffff" : "#fc5c7d";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    if (flash) {
      ctx.fillStyle = "#fc5c7d";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const leftX = 50,
    rightX = CANVAS_WIDTH - 50 - FLIPPER_W;
  const leftAngle = state.leftFlipper ? -0.5 : 0.4;
  const rightAngle = state.rightFlipper ? 0.5 : -0.4;

  ctx.fillStyle = "#7c5cfc";
  ctx.save();
  ctx.translate(leftX, FLIPPER_Y);
  ctx.rotate(leftAngle);
  ctx.beginPath();
  ctx.roundRect(0, 0, FLIPPER_W, FLIPPER_H, 6);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(rightX, FLIPPER_Y);
  ctx.rotate(rightAngle);
  ctx.beginPath();
  ctx.roundRect(0, 0, FLIPPER_W, FLIPPER_H, 6);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#e8e8f0";
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#fc5c7d";
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 20 - i * 22, CANVAS_HEIGHT - 14, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "600 13px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "left";
  ctx.fillText("Z  left  /  right", 60, CANVAS_HEIGHT - 6);
}

export default function Pinball() {
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
      if (!stateRef.current) return;
      if (e.code === "KeyZ" || e.code === "ArrowLeft")
        stateRef.current.leftFlipper = true;
      if (e.code === "Slash" || e.code === "ArrowRight")
        stateRef.current.rightFlipper = true;
    };
    const onUp = (e) => {
      if (!stateRef.current) return;
      if (e.code === "KeyZ" || e.code === "ArrowLeft")
        stateRef.current.leftFlipper = false;
      if (e.code === "Slash" || e.code === "ArrowRight")
        stateRef.current.rightFlipper = false;
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
      const leftDown = Array.from(e.touches).some(
        (t) => t.clientX - rect.left < CANVAS_WIDTH / 2,
      );
      const rightDown = Array.from(e.touches).some(
        (t) => t.clientX - rect.left >= CANVAS_WIDTH / 2,
      );
      if (stateRef.current) {
        stateRef.current.leftFlipper = leftDown;
        stateRef.current.rightFlipper = rightDown;
      }
    };
    const onEnd = (e) => {
      e.preventDefault();
      if (!e.touches.length && stateRef.current) {
        stateRef.current.leftFlipper = false;
        stateRef.current.rightFlipper = false;
      }
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onEnd);
    };
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
