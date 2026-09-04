import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 560;
const SHIP_W = 28;
const SHIP_H = 24;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 7;
const ALIEN_ROWS = 4;
const ALIEN_COLS = 10;
const ALIEN_W = 32;
const ALIEN_H = 24;
const ALIEN_SPACE_X = 46;
const ALIEN_SPACE_Y = 40;
const LIVES = 3;

function buildAliens() {
  const aliens = [];
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: 30 + c * ALIEN_SPACE_X,
        y: 60 + r * ALIEN_SPACE_Y,
        alive: true,
        row: r,
      });
    }
  }
  return aliens;
}

function initialState() {
  return {
    player: { x: CANVAS_WIDTH / 2 - SHIP_W / 2, bullets: [] },
    aliens: buildAliens(),
    alienDir: 1,
    alienStep: 0,
    alienBullets: [],
    lives: LIVES,
    score: 0,
    frame: 0,
    wave: 1,
    keys: {},
    alive: true,
    ufo: null,
    ufoTimer: 0,
  };
}

function update(state, setScore, setGameOver) {
  state.frame++;
  const { player, aliens, keys } = state;

  if (keys["ArrowLeft"] || keys["KeyA"])
    player.x = Math.max(0, player.x - PLAYER_SPEED);
  if (keys["ArrowRight"] || keys["KeyD"])
    player.x = Math.min(CANVAS_WIDTH - SHIP_W, player.x + PLAYER_SPEED);

  player.bullets = player.bullets.filter((b) => b.y > 0);
  player.bullets.forEach((b) => (b.y -= BULLET_SPEED));

  state.alienBullets = state.alienBullets.filter((b) => b.y < CANVAS_HEIGHT);
  state.alienBullets.forEach((b) => (b.y += 3));

  const alive = aliens.filter((a) => a.alive);
  const speed =
    0.3 +
    (ALIEN_ROWS * ALIEN_COLS - alive.length) * 0.02 +
    (state.wave - 1) * 0.2;
  state.alienStep += speed;
  if (state.alienStep >= 8) {
    state.alienStep = 0;
    const minX = Math.min(...alive.map((a) => a.x));
    const maxX = Math.max(...alive.map((a) => a.x));
    if (
      maxX + ALIEN_W + state.alienDir * 20 > CANVAS_WIDTH ||
      minX + state.alienDir * 20 < 0
    ) {
      state.alienDir *= -1;
      alive.forEach((a) => (a.y += 16));
    } else {
      alive.forEach((a) => (a.x += state.alienDir * 20));
    }
  }

  if (state.frame % 60 === 0 && alive.length > 0) {
    const bottom = {};
    for (const a of alive) {
      if (!bottom[a.x] || a.y > bottom[a.x].y) bottom[a.x] = a;
    }
    const shooters = Object.values(bottom);
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    state.alienBullets.push({
      x: shooter.x + ALIEN_W / 2,
      y: shooter.y + ALIEN_H,
    });
  }

  for (const bullet of player.bullets) {
    for (const alien of aliens) {
      if (!alien.alive) continue;
      if (
        bullet.x > alien.x &&
        bullet.x < alien.x + ALIEN_W &&
        bullet.y > alien.y &&
        bullet.y < alien.y + ALIEN_H
      ) {
        alien.alive = false;
        bullet.y = -999;
        const pts = alien.row === 0 ? 30 : alien.row === 1 ? 20 : 10;
        state.score += pts;
        setScore(state.score);
      }
    }
    if (
      state.ufo &&
      bullet.x > state.ufo.x &&
      bullet.x < state.ufo.x + 50 &&
      bullet.y > state.ufo.y &&
      bullet.y < state.ufo.y + 20
    ) {
      state.score += 150;
      setScore(state.score);
      state.ufo = null;
      bullet.y = -999;
    }
  }

  for (const ab of state.alienBullets) {
    if (
      ab.x > player.x &&
      ab.x < player.x + SHIP_W &&
      ab.y > CANVAS_HEIGHT - 60 &&
      ab.y < CANVAS_HEIGHT - 60 + SHIP_H
    ) {
      ab.y = CANVAS_HEIGHT + 1;
      state.lives--;
      if (state.lives <= 0) {
        state.alive = false;
        setGameOver(true);
      }
    }
  }

  if (alive.length === 0) {
    state.wave++;
    state.aliens = buildAliens();
    state.alienDir = 1;
    player.bullets = [];
    state.alienBullets = [];
  }

  if (alive.some((a) => a.y + ALIEN_H >= CANVAS_HEIGHT - 60)) {
    state.alive = false;
    setGameOver(true);
  }

  state.ufoTimer++;
  if (state.ufoTimer % 360 === 0) {
    state.ufo = { x: -50, y: 30 };
  }
  if (state.ufo) {
    state.ufo.x += 2;
    if (state.ufo.x > CANVAS_WIDTH + 50) state.ufo = null;
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#7c5cfc";
  const px = state.player.x;
  const py = CANVAS_HEIGHT - 60;
  ctx.beginPath();
  ctx.moveTo(px + SHIP_W / 2, py);
  ctx.lineTo(px + SHIP_W, py + SHIP_H);
  ctx.lineTo(px, py + SHIP_H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f0c93e";
  for (const b of state.player.bullets) {
    ctx.fillRect(b.x - 2, b.y, 4, 10);
  }
  ctx.fillStyle = "#fc5c7d";
  for (const b of state.alienBullets) {
    ctx.fillRect(b.x - 2, b.y, 4, 10);
  }

  for (const alien of state.aliens) {
    if (!alien.alive) continue;
    const colors = ["#fc5c7d", "#fc9c5c", "#f0c93e", "#3ef0a1"];
    ctx.fillStyle = colors[alien.row];
    ctx.beginPath();
    ctx.arc(alien.x + ALIEN_W / 2, alien.y + ALIEN_H / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0f";
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👾", alien.x + ALIEN_W / 2, alien.y + ALIEN_H / 2);
  }

  if (state.ufo) {
    ctx.fillStyle = "#5cc8fc";
    ctx.beginPath();
    ctx.ellipse(state.ufo.x + 25, state.ufo.y + 10, 25, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#7c5cfc";
    ctx.beginPath();
    ctx.moveTo(12 + i * 22, CANVAS_HEIGHT - 12);
    ctx.lineTo(22 + i * 22, CANVAS_HEIGHT - 2);
    ctx.lineTo(2 + i * 22, CANVAS_HEIGHT - 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = "600 13px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`WAVE ${state.wave}`, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 8);
}

export default function SpaceInvaders() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();
  const lastShot = useRef(0);

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
      stateRef.current.keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        const now = Date.now();
        if (
          now - lastShot.current > 300 &&
          stateRef.current.player.bullets.length < 3
        ) {
          lastShot.current = now;
          stateRef.current.player.bullets.push({
            x: stateRef.current.player.x + SHIP_W / 2,
            y: CANVAS_HEIGHT - 60,
          });
        }
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
    <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
  );
}

const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
`;
