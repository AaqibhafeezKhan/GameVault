import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const PADDLE_W = 80;
const PADDLE_H = 10;
const BALL_R = 7;
const BRICK_COLS = 8;
const BRICK_ROWS = 8;
const BRICK_W = 52;
const BRICK_H = 18;
const BRICK_GAP = 4;
const BRICK_OFFSET_X = 16;
const BRICK_OFFSET_Y = 40;
const BALL_SPEED_BASE = 5;
const LIVES = 3;

const BRICK_COLORS = [
  "#fc5c7d",
  "#fc5c7d",
  "#f0c93e",
  "#f0c93e",
  "#7c5cfc",
  "#7c5cfc",
  "#3ef0a1",
  "#3ef0a1",
];
const BRICK_POINTS = [80, 80, 60, 60, 40, 40, 20, 20];

function initBricks() {
  return Array.from({ length: BRICK_ROWS }, (_, r) =>
    Array.from({ length: BRICK_COLS }, (_, c) => ({
      alive: true,
      row: r,
      col: c,
    })),
  );
}

function initialState() {
  return {
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_W / 2, w: PADDLE_W },
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 3,
      vy: -BALL_SPEED_BASE,
    },
    bricks: initBricks(),
    lives: LIVES,
    score: 0,
    launched: false,
    keys: {},
    mouseX: CANVAS_WIDTH / 2,
    powerups: [],
    level: 1,
    rowsCleared: 0,
  };
}

function update(state, setScore, setGameOver) {
  const { ball, paddle } = state;

  if (!state.launched) {
    ball.x = paddle.x + paddle.w / 2;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.x - BALL_R < 0) {
    ball.x = BALL_R;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x + BALL_R > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - BALL_R;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - BALL_R < 0) {
    ball.y = BALL_R;
    ball.vy = Math.abs(ball.vy);
  }

  if (
    ball.y + BALL_R > CANVAS_HEIGHT - 40 - PADDLE_H &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w
  ) {
    ball.vy = -Math.abs(ball.vy);
    ball.vx = ((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)) * 5;
    ball.y = CANVAS_HEIGHT - 40 - PADDLE_H - BALL_R;
  }

  if (ball.y > CANVAS_HEIGHT) {
    state.lives--;
    if (state.lives <= 0) {
      setGameOver(true);
      return;
    }
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT - 80;
    ball.vx = 3;
    ball.vy = -BALL_SPEED_BASE;
    state.launched = false;
  }

  for (const row of state.bricks) {
    for (const brick of row) {
      if (!brick.alive) continue;
      const bx = BRICK_OFFSET_X + brick.col * (BRICK_W + BRICK_GAP);
      const by = BRICK_OFFSET_Y + brick.row * (BRICK_H + BRICK_GAP);
      if (
        ball.x + BALL_R > bx &&
        ball.x - BALL_R < bx + BRICK_W &&
        ball.y + BALL_R > by &&
        ball.y - BALL_R < by + BRICK_H
      ) {
        brick.alive = false;
        ball.vy = -ball.vy;
        state.score += BRICK_POINTS[brick.row];
        setScore(state.score);
      }
    }
  }

  if (state.keys["ArrowLeft"] || state.keys["KeyA"])
    paddle.x = Math.max(0, paddle.x - 7);
  if (state.keys["ArrowRight"] || state.keys["KeyD"])
    paddle.x = Math.min(CANVAS_WIDTH - paddle.w, paddle.x + 7);

  paddle.x = Math.max(
    0,
    Math.min(CANVAS_WIDTH - paddle.w, state.mouseX - paddle.w / 2),
  );

  if (state.bricks.every((row) => row.every((b) => !b.alive))) {
    state.bricks = initBricks();
    state.level++;
    const speed = Math.min(10, BALL_SPEED_BASE + state.level);
    ball.vx = (ball.vx > 0 ? 1 : -1) * speed * 0.6;
    ball.vy = -speed;
    state.launched = false;
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const row of state.bricks) {
    for (const brick of row) {
      if (!brick.alive) continue;
      const x = BRICK_OFFSET_X + brick.col * (BRICK_W + BRICK_GAP);
      const y = BRICK_OFFSET_Y + brick.row * (BRICK_H + BRICK_GAP);
      ctx.fillStyle = BRICK_COLORS[brick.row];
      ctx.fillRect(x, y, BRICK_W, BRICK_H);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x, y, BRICK_W, 4);
    }
  }

  ctx.fillStyle = "#7c5cfc";
  ctx.beginPath();
  ctx.roundRect(
    state.paddle.x,
    CANVAS_HEIGHT - 40,
    state.paddle.w,
    PADDLE_H,
    4,
  );
  ctx.fill();

  ctx.fillStyle = "#e8e8f0";
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#fc5c7d";
    ctx.beginPath();
    ctx.arc(16 + i * 24, CANVAS_HEIGHT - 16, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "600 14px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "right";
  ctx.fillText(`LVL ${state.level}`, CANVAS_WIDTH - 16, CANVAS_HEIGHT - 8);

  if (!state.launched) {
    ctx.font = "14px JetBrains Mono, monospace";
    ctx.fillStyle = "#6b6b8a";
    ctx.textAlign = "center";
    ctx.fillText(
      "Click or Space to launch",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
    );
  }
}

export default function Breakout() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!paused) update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, true);

  useEffect(() => {
    const launch = () => {
      if (stateRef.current && !stateRef.current.launched)
        stateRef.current.launched = true;
    };
    const onKey = (e) => {
      if (!stateRef.current) return;
      stateRef.current.keys[e.code] = e.type === "keydown";
      if (e.code === "Space" && e.type === "keydown") {
        e.preventDefault();
        launch();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (stateRef.current) stateRef.current.mouseX = e.clientX - rect.left;
    };
    const onTouch = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (stateRef.current) {
        stateRef.current.mouseX = e.touches[0].clientX - rect.left;
        stateRef.current.launched = true;
      }
    };
    const onClick = () => {
      if (stateRef.current && !stateRef.current.launched)
        stateRef.current.launched = true;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
  );
}

const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  cursor: none;
  touch-action: none;
`;
