import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const GRAVITY = 0.5;
const FLAP_VEL = -8;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const SPAWN_INTERVAL = 90;
const BIRD_SIZE = 20;
const PIPE_GAPS = { Easy: 180, Medium: 140, Hard: 110 };

function initialState(difficulty) {
  return {
    bird: { y: CANVAS_HEIGHT / 2, vy: 0 },
    pipes: [],
    frame: 0,
    score: 0,
    gap: PIPE_GAPS[difficulty],
    alive: true,
  };
}

function update(state, setScore, setGameOver) {
  const b = state.bird;
  b.vy += GRAVITY;
  b.y += b.vy;
  state.frame++;

  if (b.y - BIRD_SIZE < 0 || b.y + BIRD_SIZE > CANVAS_HEIGHT) {
    state.alive = false;
    setGameOver(true);
    return;
  }

  if (state.frame % SPAWN_INTERVAL === 0) {
    const topH = 60 + Math.random() * (CANVAS_HEIGHT - state.gap - 120);
    state.pipes.push({ x: CANVAS_WIDTH, topH, scored: false });
  }

  for (const p of state.pipes) {
    p.x -= PIPE_SPEED;
    const bx = 80;
    if (bx + BIRD_SIZE > p.x && bx - BIRD_SIZE < p.x + PIPE_WIDTH) {
      if (b.y - BIRD_SIZE < p.topH || b.y + BIRD_SIZE > p.topH + state.gap) {
        state.alive = false;
        setGameOver(true);
        return;
      }
    }
    if (!p.scored && p.x + PIPE_WIDTH < bx) {
      p.scored = true;
      state.score++;
      setScore(state.score);
    }
  }
  state.pipes = state.pipes.filter((p) => p.x > -PIPE_WIDTH - 10);
}

function draw(ctx, state) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let i = 0; i < 6; i++) {
    const x = i * 60;
    ctx.fillStyle = "#13131a";
    ctx.fillRect(x, CANVAS_HEIGHT - 60, 60, 60);
  }

  for (const p of state.pipes) {
    ctx.fillStyle = "#3ef0a1";
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
    ctx.fillRect(p.x, p.topH + state.gap, PIPE_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#2ac47e";
    ctx.fillRect(p.x - 4, p.topH - 20, PIPE_WIDTH + 8, 20);
    ctx.fillRect(p.x - 4, p.topH + state.gap, PIPE_WIDTH + 8, 20);
  }

  const { y, vy } = state.bird;
  ctx.save();
  ctx.translate(80, y);
  ctx.rotate(Math.min(Math.PI / 4, vy * 0.05));
  ctx.fillStyle = "#f0c93e";
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE, BIRD_SIZE * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fc5c7d";
  ctx.beginPath();
  ctx.ellipse(12, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0f";
  ctx.beginPath();
  ctx.arc(10, -6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.font = "700 26px JetBrains Mono, monospace";
  ctx.fillStyle = "#e8e8f0";
  ctx.textAlign = "center";
  ctx.fillText(state.score, CANVAS_WIDTH / 2, 50);
}

export default function FlappyBird() {
  const [difficulty, setDifficulty] = useState(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setScore, setGameOver, paused } = useGameShell();

  const flap = useCallback(() => {
    if (stateRef.current && stateRef.current.alive) {
      stateRef.current.bird.vy = FLAP_VEL;
    }
  }, []);

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
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [difficulty, flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTap = (e) => {
      e.preventDefault();
      flap();
    };
    canvas.addEventListener("touchstart", onTap, { passive: false });
    canvas.addEventListener("click", flap);
    return () => {
      canvas.removeEventListener("touchstart", onTap);
      canvas.removeEventListener("click", flap);
    };
  }, [flap]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Flappy Bird</SDiffTitle>
        <SDiffDesc>Space or tap to flap — don't hit the pipes!</SDiffDesc>
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
  touch-action: none;
  cursor: pointer;
`;
