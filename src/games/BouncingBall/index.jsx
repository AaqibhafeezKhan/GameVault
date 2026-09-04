import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;
const BALL_R = 10;
const TARGET_R = 30;

function generateObstacles(level) {
  const obs = [];
  const count = Math.min(10, 2 + level * 2);
  for (let i = 0; i < count; i++) {
    obs.push({
      x: 50 + Math.random() * (CANVAS_WIDTH - 150),
      y: 100 + Math.random() * (CANVAS_HEIGHT - 200),
      w: 30 + Math.random() * 60,
      h: 10 + Math.random() * 20,
    });
  }
  return obs;
}

function initialState(level = 1) {
  let targetX, targetY;
  do {
    targetX = 50 + Math.random() * (CANVAS_WIDTH - 100);
    targetY = CANVAS_HEIGHT - 60;
  } while (Math.abs(targetX - CANVAS_WIDTH / 2) < 50);

  return {
    ball: { x: CANVAS_WIDTH / 2, y: 30, vx: 0, vy: 0 },
    obstacles: generateObstacles(level),
    target: { x: targetX, y: targetY },
    level,
    score: (level - 1) * 100,
    attempts: 0,
    state: "aiming", // aiming, moving, win, fail
    aimTarget: { x: CANVAS_WIDTH / 2, y: 30 },
  };
}

function update(state, setScore, setGameOver) {
  if (state.state !== "moving") return;

  const { ball, obstacles, target } = state;
  ball.vy += 0.2; // Gravity
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions
  if (ball.x - BALL_R < 0) {
    ball.x = BALL_R;
    ball.vx *= -0.8;
  }
  if (ball.x + BALL_R > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - BALL_R;
    ball.vx *= -0.8;
  }
  if (ball.y - BALL_R < 0) {
    ball.y = BALL_R;
    ball.vy *= -0.8;
  }
  // Floor check (fail)
  if (ball.y + BALL_R > CANVAS_HEIGHT) {
    state.state = "fail";
    state.attempts++;
    state.ball = { x: CANVAS_WIDTH / 2, y: 30, vx: 0, vy: 0 };
    return;
  }

  // Target collision
  if (Math.hypot(ball.x - target.x, ball.y - target.y) < BALL_R + TARGET_R) {
    state.state = "win";
    state.score += Math.max(10, 100 - state.attempts * 10);
    setScore(state.score);
    // Auto next level
    setTimeout(() => {
      Object.assign(state, initialState(state.level + 1));
    }, 1000);
    return;
  }

  // Basic rect collisions
  for (const obs of obstacles) {
    const cx = Math.max(obs.x, Math.min(ball.x, obs.x + obs.w));
    const cy = Math.max(obs.y, Math.min(ball.y, obs.y + obs.h));
    if (Math.hypot(ball.x - cx, ball.y - cy) < BALL_R) {
      // Simple resolution
      if (Math.abs(ball.x - cx) > Math.abs(ball.y - cy)) ball.vx *= -0.8;
      else ball.vy *= -0.8;

      // Push out slightly to avoid sticking
      ball.x += (ball.x - cx) * 0.1;
      ball.y += (ball.y - cy) * 0.1;
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const { ball, target, obstacles } = state;

  // Target
  ctx.fillStyle = "#3ef0a122";
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3ef0a1";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Obstacles
  ctx.fillStyle = "#fc5c7d";
  for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);

  // Aiming Line
  if (state.state === "aiming") {
    ctx.strokeStyle = "#e8e8f044";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(state.aimTarget.x, state.aimTarget.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ball
  ctx.fillStyle = "#7c5cfc";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  // UI
  ctx.font = "14px JetBrains Mono";
  ctx.fillStyle = "#e8e8f0";
  ctx.fillText(`Level: ${state.level}`, 10, 20);
  ctx.fillText(`Attempts: ${state.attempts}`, 10, 40);

  if (state.state === "win") {
    ctx.fillStyle = "#3ef0a1";
    ctx.textAlign = "center";
    ctx.font = "700 24px JetBrains Mono";
    ctx.fillText("Target Reached!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

export default function BouncingBall() {
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

  const handlePointerMove = useCallback((e) => {
    if (stateRef.current.state !== "aiming") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Get coords for both mouse and touch
    let clX, clY;
    if (e.touches) {
      clX = e.touches[0].clientX;
      clY = e.touches[0].clientY;
    } else {
      clX = e.clientX;
      clY = e.clientY;
    }
    stateRef.current.aimTarget = { x: clX - rect.left, y: clY - rect.top };
  }, []);

  const handleLaunch = useCallback(() => {
    const s = stateRef.current;
    if (s.state !== "aiming") {
      // Reset to aim if failed
      if (s.state === "fail") s.state = "aiming";
      return;
    }
    const dx = s.aimTarget.x - s.ball.x;
    const dy = s.aimTarget.y - s.ball.y;
    const length = Math.hypot(dx, dy);
    const speed = Math.min(15, length / 10); // Launch speed based on drag dist
    s.ball.vx = (dx / length) * speed;
    s.ball.vy = (dy / length) * speed;
    s.state = "moving";
  }, []);

  return (
    <SWrapper>
      <SCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handlePointerMove}
        onMouseUp={handleLaunch}
        onClick={handleLaunch}
        onTouchMove={(e) => {
          e.preventDefault();
          handlePointerMove(e);
        }}
        onTouchEnd={handleLaunch}
      />
      <SHelp>
        Click/drag to aim, release/click to launch. Reach the green zone!
      </SHelp>
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
  cursor: crosshair;
  touch-action: none;
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
