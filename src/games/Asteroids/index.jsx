import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const SHIP_ACCEL = 0.2;
const SHIP_ROT_SPEED = 0.06;
const FRICTION = 0.98;
const BULLET_LIFE = 60;
const INVINCIBLE_FRAMES = 120;
const UFO_INTERVAL = 3600;

function makeAsteroid(x, y, size) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (1 + Math.random()) / size;
  const numPoints = 7 + Math.floor(Math.random() * 5);
  const offsets = Array.from(
    { length: numPoints },
    () => 0.7 + Math.random() * 0.6,
  );
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    offsets,
    numPoints,
  };
}

function initialState() {
  const asteroids = [];
  for (let i = 0; i < 5; i++) {
    const x =
      Math.random() < 0.5
        ? Math.random() * 100
        : CANVAS_WIDTH - Math.random() * 100;
    const y =
      Math.random() < 0.5
        ? Math.random() * 100
        : CANVAS_HEIGHT - Math.random() * 100;
    asteroids.push(makeAsteroid(x, y, 3));
  }
  return {
    ship: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: 0,
      vx: 0,
      vy: 0,
      thrusting: false,
    },
    bullets: [],
    asteroids,
    score: 0,
    lives: 3,
    invincible: INVINCIBLE_FRAMES,
    frame: 0,
    ufo: null,
    ufoTimer: 0,
    keys: {},
    alive: true,
    lastShot: 0,
  };
}

function update(state, setScore, setGameOver) {
  const { ship, keys } = state;
  state.frame++;

  if (keys["ArrowLeft"] || keys["KeyA"]) ship.angle -= SHIP_ROT_SPEED;
  if (keys["ArrowRight"] || keys["KeyD"]) ship.angle += SHIP_ROT_SPEED;
  if (keys["ArrowUp"] || keys["KeyW"]) {
    ship.vx += Math.sin(ship.angle) * SHIP_ACCEL;
    ship.vy -= Math.cos(ship.angle) * SHIP_ACCEL;
    ship.thrusting = true;
  } else ship.thrusting = false;

  ship.vx *= FRICTION;
  ship.vy *= FRICTION;
  ship.x = (ship.x + ship.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
  ship.y = (ship.y + ship.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;
  if (state.invincible > 0) state.invincible--;

  state.bullets = state.bullets.filter((b) => b.life > 0);
  for (const b of state.bullets) {
    b.x = (b.x + b.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
    b.y = (b.y + b.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;
    b.life--;
  }

  for (const a of state.asteroids) {
    a.x = (a.x + a.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
    a.y = (a.y + a.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;
  }

  const SIZES_RADIUS = { 3: 40, 2: 20, 1: 10 };
  const POINTS = { 3: 20, 2: 50, 1: 100 };
  const toAdd = [];
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi];
    for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
      const a = state.asteroids[ai];
      const r = SIZES_RADIUS[a.size];
      if (Math.hypot(b.x - a.x, b.y - a.y) < r) {
        state.bullets.splice(bi, 1);
        state.asteroids.splice(ai, 1);
        state.score += POINTS[a.size];
        setScore(state.score);
        if (a.size > 1) {
          toAdd.push(makeAsteroid(a.x, a.y, a.size - 1));
          toAdd.push(makeAsteroid(a.x + 10, a.y + 10, a.size - 1));
        }
        break;
      }
    }
  }
  state.asteroids.push(...toAdd);

  if (state.invincible === 0) {
    for (const a of state.asteroids) {
      const r = SIZES_RADIUS[a.size];
      if (Math.hypot(ship.x - a.x, ship.y - a.y) < r - 5) {
        state.lives--;
        state.invincible = INVINCIBLE_FRAMES;
        ship.vx = 0;
        ship.vy = 0;
        if (state.lives <= 0) {
          state.alive = false;
          setGameOver(true);
        }
      }
    }
  }

  if (state.asteroids.length === 0) {
    for (let i = 0; i < 5; i++) state.asteroids.push(makeAsteroid(50, 50, 3));
  }

  state.ufoTimer++;
  if (state.ufoTimer >= UFO_INTERVAL && !state.ufo) {
    state.ufo = { x: 0, y: Math.random() * CANVAS_HEIGHT, vx: 3 };
    state.ufoTimer = 0;
  }
  if (state.ufo) {
    state.ufo.x += state.ufo.vx;
    if (state.ufo.x > CANVAS_WIDTH + 50) state.ufo = null;
    else if (
      Math.hypot(ship.x - state.ufo.x, ship.y - state.ufo.y) < 20 &&
      state.invincible === 0
    ) {
      state.lives--;
      state.invincible = INVINCIBLE_FRAMES;
      state.ufo = null;
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

  const RADII = { 3: 40, 2: 20, 1: 10 };
  ctx.strokeStyle = "#7c5cfc";
  ctx.lineWidth = 1.5;
  for (const a of state.asteroids) {
    ctx.beginPath();
    for (let i = 0; i < a.numPoints; i++) {
      const angle = (i / a.numPoints) * Math.PI * 2;
      const r = RADII[a.size] * a.offsets[i];
      const x = a.x + Math.cos(angle) * r,
        y = a.y + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  if (state.invincible === 0 || state.frame % 4 < 2) {
    const { x, y, angle } = state.ship;
    ctx.strokeStyle = "#e8e8f0";
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(10, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.stroke();
    if (state.ship.thrusting) {
      ctx.strokeStyle = "#fc9c5c";
      ctx.beginPath();
      ctx.moveTo(-6, 10);
      ctx.lineTo(0, 22);
      ctx.lineTo(6, 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.fillStyle = "#f0c93e";
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.ufo) {
    ctx.strokeStyle = "#5cc8fc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(state.ufo.x, state.ufo.y, 25, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(state.ufo.x, state.ufo.y - 6, 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < state.lives; i++) {
    ctx.strokeStyle = "#e8e8f0";
    ctx.lineWidth = 1.5;
    ctx.save();
    ctx.translate(20 + i * 22, CANVAS_HEIGHT - 18);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

export default function Asteroids() {
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
    const shoot = () => {
      const state = stateRef.current;
      if (!state) return;
      const now = Date.now();
      if (now - state.lastShot < 250 || state.bullets.length >= 5) return;
      state.lastShot = now;
      state.bullets.push({
        x: state.ship.x,
        y: state.ship.y,
        vx: Math.sin(state.ship.angle) * 8,
        vy: -Math.cos(state.ship.angle) * 8,
        life: BULLET_LIFE,
      });
    };
    const onDown = (e) => {
      if (stateRef.current) stateRef.current.keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        shoot();
      }
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

  return (
    <SWrapper>
      <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <SHelp>Arrow/WASD to thrust — Space to shoot</SHelp>
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
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
