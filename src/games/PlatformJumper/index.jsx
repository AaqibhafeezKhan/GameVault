import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 600;
const PLAYER_W = 28;
const PLAYER_H = 36;
const GRAVITY = 0.4;
const JUMP_VEL = -10;
const PLATFORM_H = 12;
const SCROLL_SPEED = 2;
const MIN_GAP = 80;
const MAX_GAP = 180;

function createPlatform(y, difficulty) {
  const gapMultiplier =
    difficulty === "Hard" ? 1.5 : difficulty === "Medium" ? 1.2 : 1;
  const w = 80 + Math.random() * 80;
  const x = Math.random() * (CANVAS_WIDTH - w);
  return { x, y, w };
}

function initialState(difficulty) {
  const platforms = [];
  for (let i = 0; i < 8; i++) {
    platforms.push(
      createPlatform(
        CANVAS_HEIGHT - 60 - i * (80 + Math.random() * 40),
        difficulty,
      ),
    );
  }
  return {
    player: {
      x: platforms[0].x + platforms[0].w / 2 - PLAYER_W / 2,
      y: platforms[0].y - PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
    },
    platforms,
    cameraY: 0,
    score: 0,
    heightRecord: 0,
    keys: {},
    difficulty,
    alive: true,
    lastPlatY: platforms[platforms.length - 1].y,
  };
}

function update(state, setScore, setGameOver) {
  const p = state.player;
  const keys = state.keys;

  if (keys["ArrowLeft"] || keys["KeyA"]) p.vx = -4;
  else if (keys["ArrowRight"] || keys["KeyD"]) p.vx = 4;
  else p.vx *= 0.8;

  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;

  if (p.x < 0) p.x = CANVAS_WIDTH;
  if (p.x > CANVAS_WIDTH) p.x = 0;

  p.onGround = false;
  for (const plat of state.platforms) {
    const screenY = plat.y - state.cameraY;
    if (
      p.vy > 0 &&
      p.y + PLAYER_H > screenY &&
      p.y + PLAYER_H < screenY + PLATFORM_H + 10 &&
      p.x + PLAYER_W > plat.x &&
      p.x < plat.x + plat.w
    ) {
      p.y = screenY - PLAYER_H;
      p.vy = 0;
      p.onGround = true;
    }
  }

  if (keys["Space"] && p.onGround) p.vy = JUMP_VEL;
  if (!p.onGround && p.vy < 0 && p.y < CANVAS_HEIGHT / 2) {
    const scroll = Math.abs(p.vy);
    state.cameraY -= scroll;
    state.platforms.forEach((pl) => (pl.y += scroll));
    const newHeight = Math.abs(state.cameraY);
    if (newHeight > state.heightRecord) {
      state.heightRecord = newHeight;
      state.score = Math.floor(newHeight / 10);
      setScore(state.score);
    }
  }

  while (state.lastPlatY > -200) {
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    state.lastPlatY -= gap;
    state.platforms.push(createPlatform(state.lastPlatY, state.difficulty));
  }
  state.platforms = state.platforms.filter((pl) => pl.y < CANVAS_HEIGHT + 100);

  if (p.y > CANVAS_HEIGHT + 100) {
    state.alive = false;
    setGameOver(true);
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const plat of state.platforms) {
    ctx.fillStyle = "#7c5cfc";
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.w, PLATFORM_H, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(plat.x + 4, plat.y, plat.w - 8, 3);
  }

  const p = state.player;
  ctx.fillStyle = "#fc5c7d";
  ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);
  ctx.fillStyle = "#f0c93e";
  ctx.fillRect(p.x + 6, p.y + 4, 16, 10);

  ctx.font = "600 14px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "left";
  ctx.fillText(`HEIGHT ${state.score}`, 10, 24);
}

export default function PlatformJumper() {
  const [difficulty, setDifficulty] = useState(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setScore, setGameOver, paused } = useGameShell();

  const start = useCallback(
    (diff) => {
      stateRef.current = initialState(diff);
      setDifficulty(diff);
      setScore(0);
    },
    [setScore],
  );

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, !!difficulty);

  useEffect(() => {
    if (!difficulty) return;
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
  }, [difficulty]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Platform Jumper</SDiffTitle>
        <SDiffDesc>
          Arrow keys / WASD to move, Space to jump. Climb as high as possible!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
  );
}

const SDiffScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SDiffTitle = styled.h2`
  font-family: ${theme.font.display};
  font-size: 2rem;
  color: ${theme.colors.text};
`;
const SDiffDesc = styled.p`
  color: ${theme.colors.textMuted};
  font-family: ${theme.font.body};
  text-align: center;
  max-width: 320px;
`;
const SDiffButtons = styled.div`
  display: flex;
  gap: ${theme.space[3]}px;
`;
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 150ms ease-out;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
`;
