import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const RUNNER_W = 30;
const RUNNER_H = 48;
const GROUND_Y = CANVAS_HEIGHT - 80;
const GRAVITY = 0.45;
const JUMP_VEL = -11;
const OBSTACLE_TYPES = ["gap", "spike", "barrier"];
const BASE_SPEED = 4;

function randomObstacle(score) {
  const type =
    OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  const speed = BASE_SPEED + Math.min(6, score / 200);
  const w = type === "gap" ? 60 + Math.random() * 40 : 20 + Math.random() * 20;
  const h = type === "barrier" ? 50 + Math.random() * 30 : 30;
  return { x: CANVAS_WIDTH + 50, w, h, type, speed };
}

function initialState() {
  return {
    runner: { x: 80, y: GROUND_Y - RUNNER_H, vy: 0, onGround: true, frame: 0 },
    obstacles: [],
    score: 0,
    frame: 0,
    alive: true,
    speed: BASE_SPEED,
    keys: {},
    nextSpawn: 90,
    coins: [],
    particleX: null,
    particleY: null,
  };
}

function spawnCoins(state) {
  if (Math.random() > 0.25) return;
  const y = GROUND_Y - RUNNER_H - Math.random() * 80;
  state.coins.push({ x: CANVAS_WIDTH, y, collected: false });
}

function update(state, setScore, setGameOver) {
  const { runner, keys } = state;
  state.frame++;
  state.score += 0.1;
  setScore(Math.floor(state.score));
  runner.frame++;

  const jump = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
  if (jump && runner.onGround) {
    runner.vy = JUMP_VEL;
    runner.onGround = false;
  }
  runner.vy += GRAVITY;
  runner.y += runner.vy;
  if (runner.y >= GROUND_Y - RUNNER_H) {
    runner.y = GROUND_Y - RUNNER_H;
    runner.vy = 0;
    runner.onGround = true;
  }

  const speed = BASE_SPEED + Math.min(5, state.score / 200);

  if (state.frame >= state.nextSpawn) {
    state.obstacles.push(randomObstacle(state.score));
    spawnCoins(state);
    state.nextSpawn = state.frame + 70 + Math.floor(Math.random() * 50);
  }

  for (const o of state.obstacles) o.x -= speed;
  state.obstacles = state.obstacles.filter((o) => o.x > -200);

  for (const c of state.coins) {
    c.x -= speed;
  }
  state.coins = state.coins.filter((c) => c.x > -20 && !c.collected);
  for (const c of state.coins) {
    if (
      Math.hypot(runner.x + RUNNER_W / 2 - c.x, runner.y + RUNNER_H / 2 - c.y) <
      20
    ) {
      c.collected = true;
      state.score += 10;
      setScore(Math.floor(state.score));
    }
  }

  for (const o of state.obstacles) {
    if (o.type === "gap") {
      if (
        runner.x + RUNNER_W > o.x &&
        runner.x < o.x + o.w &&
        runner.y + RUNNER_H >= GROUND_Y
      ) {
        state.alive = false;
        setGameOver(true);
      }
    } else {
      const oy = o.type === "spike" ? GROUND_Y - o.h : GROUND_Y - o.h;
      if (
        runner.x + RUNNER_W - 6 > o.x + 4 &&
        runner.x + 6 < o.x + o.w - 4 &&
        runner.y + RUNNER_H - 6 > oy + 4
      ) {
        state.alive = false;
        setGameOver(true);
      }
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let x = 0; x < CANVAS_WIDTH; x += 80) {
    const bx = (x - state.frame * 0.5) % (CANVAS_WIDTH + 80);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(bx, 20 + Math.sin(x * 0.03 + state.frame * 0.01) * 30, 40, 80);
  }

  const hasGap = state.obstacles.some(
    (o) => o.type === "gap" && o.x < CANVAS_WIDTH && o.x + o.w > 0,
  );

  ctx.fillStyle = "#2a2a3d";
  let gx = 0;
  for (const o of state.obstacles
    .filter((o) => o.type === "gap")
    .sort((a, b) => a.x - b.x)) {
    ctx.fillRect(gx, GROUND_Y, o.x - gx, CANVAS_HEIGHT - GROUND_Y);
    gx = o.x + o.w;
  }
  ctx.fillRect(gx, GROUND_Y, CANVAS_WIDTH - gx, CANVAS_HEIGHT - GROUND_Y);

  for (const o of state.obstacles) {
    if (o.type === "spike") {
      ctx.fillStyle = "#fc5c7d";
      ctx.beginPath();
      ctx.moveTo(o.x, GROUND_Y);
      ctx.lineTo(o.x + o.w / 2, GROUND_Y - o.h);
      ctx.lineTo(o.x + o.w, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    } else if (o.type === "barrier") {
      ctx.fillStyle = "#fc9c5c";
      ctx.fillRect(o.x, GROUND_Y - o.h, o.w, o.h);
      ctx.fillStyle = "#f0c93e";
      ctx.fillRect(o.x, GROUND_Y - o.h, o.w, 6);
    }
  }

  for (const c of state.coins) {
    ctx.fillStyle = "#f0c93e";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const { runner } = state;
  const legPhase = Math.sin(runner.frame * 0.3) * (runner.onGround ? 8 : 0);
  ctx.fillStyle = "#7c5cfc";
  ctx.fillRect(runner.x, runner.y, RUNNER_W, RUNNER_H);
  ctx.fillStyle = "#e8e8f0";
  ctx.fillRect(runner.x + RUNNER_W - 8, runner.y + 6, 7, 7);
  ctx.fillStyle = "#5a3dcc";
  ctx.fillRect(runner.x + 4, runner.y + RUNNER_H, 8, 6 + legPhase);
  ctx.fillRect(runner.x + RUNNER_W - 12, runner.y + RUNNER_H, 8, 6 - legPhase);
  ctx.fillStyle = "#fc9c5c";
  ctx.fillRect(runner.x - 4, runner.y + RUNNER_H / 2 - 4, 8, 10);
}

export default function InfiniteRunner() {
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
    if (
      stateRef.current?.dino?.onGround ||
      stateRef.current?.runner?.onGround
    ) {
      const r = stateRef.current.runner;
      if (r.onGround) {
        r.vy = JUMP_VEL;
        r.onGround = false;
      }
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
      <SHelp>
        Space/↑ to jump — collect coins — avoid spikes, barriers, and gaps!
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
  cursor: pointer;
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
