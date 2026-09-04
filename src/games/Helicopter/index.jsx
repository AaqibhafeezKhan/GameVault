import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 300;
const GRAVITY = 0.25;
const HELI_W = 50;
const HELI_H = 22;

function caveAt(x, score) {
  const gap = Math.max(90, 180 - score * 0.2);
  const mid =
    CANVAS_HEIGHT / 2 +
    Math.sin(x * 0.006 + score * 0.01) * (CANVAS_HEIGHT / 2 - gap / 2 - 30);
  return { top: mid - gap / 2, bot: mid + gap / 2 };
}

function initialState() {
  return {
    heli: { y: CANVAS_HEIGHT / 2 - HELI_H / 2, vy: 0 },
    score: 0,
    alive: true,
    holding: false,
    caveX: CANVAS_WIDTH,
  };
}

function update(state, setScore, setGameOver) {
  const h = state.heli;
  h.vy += state.holding ? -0.6 : GRAVITY;
  h.vy = Math.max(-5, Math.min(5, h.vy));
  h.y += h.vy;
  state.score += 0.05;
  setScore(Math.floor(state.score));

  const sc = Math.floor(state.score);
  const cave = caveAt(sc * 2, sc);
  if (
    h.y < cave.top ||
    h.y + HELI_H > cave.bot ||
    h.y < 0 ||
    h.y + HELI_H > CANVAS_HEIGHT
  ) {
    state.alive = false;
    setGameOver(true);
  }
}

function draw(ctx, state) {
  const sc = Math.floor(state.score);
  const advance = sc * 2;

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let x = 0; x <= CANVAS_WIDTH; x += 4) {
    const cave = caveAt(advance + x, sc);
    ctx.fillStyle = "#2a2a3d";
    ctx.fillRect(x, 0, 4, cave.top);
    ctx.fillRect(x, cave.bot, 4, CANVAS_HEIGHT - cave.bot);
  }

  const { y } = state.heli;
  ctx.fillStyle = "#7c5cfc";
  ctx.fillRect(70, y, HELI_W, HELI_H);
  ctx.fillStyle = "#5a3dcc";
  ctx.fillRect(70 - 10, y - 4, HELI_W + 20, 4);
  ctx.fillStyle = "#fc5c7d";
  ctx.beginPath();
  ctx.arc(60, y + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  if (state.holding) {
    ctx.fillStyle = "#f0c93e";
    ctx.beginPath();
    ctx.arc(84, y - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Helicopter() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();

  const setHold = useCallback((val) => {
    if (stateRef.current) stateRef.current.holding = val;
  }, []);

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
      if (e.code === "Space") {
        e.preventDefault();
        setHold(true);
      }
    };
    const onUp = (e) => {
      if (e.code === "Space") setHold(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [setHold]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e) => {
      e.preventDefault();
      setHold(true);
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      setHold(false);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [setHold]);

  return (
    <SWrapper>
      <SCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={() => setHold(true)}
        onMouseUp={() => setHold(false)}
      />
      <SHelp>Hold Space / click / tap to ascend — release to descend</SHelp>
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
  touch-action: none;
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
