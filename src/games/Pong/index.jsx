import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_H = 70;
const PADDLE_W = 12;
const BALL_R = 8;
const WIN_SCORE = 7;
const AI_SPEEDS = { Easy: 2, Medium: 3.5, Hard: 5.5 };

function initialState(difficulty) {
  return {
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 3 },
    leftY: CANVAS_HEIGHT / 2 - PADDLE_H / 2,
    rightY: CANVAS_HEIGHT / 2 - PADDLE_H / 2,
    scoreL: 0,
    scoreR: 0,
    aiSpeed: AI_SPEEDS[difficulty],
    difficulty,
    keys: {},
  };
}

function resetBall(state) {
  state.ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: (Math.random() > 0.5 ? 1 : -1) * 4,
    vy: (Math.random() > 0.5 ? 1 : -1) * 3,
  };
}

function update(state, setScore, setGameOver) {
  const b = state.ball;
  b.x += b.vx;
  b.y += b.vy;

  if (b.y - BALL_R < 0) {
    b.y = BALL_R;
    b.vy = Math.abs(b.vy);
  }
  if (b.y + BALL_R > CANVAS_HEIGHT) {
    b.y = CANVAS_HEIGHT - BALL_R;
    b.vy = -Math.abs(b.vy);
  }

  if (state.keys["KeyW"] || state.keys["ArrowUp"])
    state.leftY = Math.max(0, state.leftY - 6);
  if (state.keys["KeyS"] || state.keys["ArrowDown"])
    state.leftY = Math.min(CANVAS_HEIGHT - PADDLE_H, state.leftY + 6);

  const aiCenter = state.rightY + PADDLE_H / 2;
  if (aiCenter < b.y - 5)
    state.rightY = Math.min(
      CANVAS_HEIGHT - PADDLE_H,
      state.rightY + state.aiSpeed,
    );
  if (aiCenter > b.y + 5)
    state.rightY = Math.max(0, state.rightY - state.aiSpeed);

  if (
    b.x - BALL_R < PADDLE_W &&
    b.y > state.leftY &&
    b.y < state.leftY + PADDLE_H
  ) {
    b.vx = Math.abs(b.vx) * 1.05;
    b.vy += (b.y - (state.leftY + PADDLE_H / 2)) * 0.1;
    b.x = PADDLE_W + BALL_R;
  }
  if (
    b.x + BALL_R > CANVAS_WIDTH - PADDLE_W &&
    b.y > state.rightY &&
    b.y < state.rightY + PADDLE_H
  ) {
    b.vx = -Math.abs(b.vx) * 1.05;
    b.vy += (b.y - (state.rightY + PADDLE_H / 2)) * 0.1;
    b.x = CANVAS_WIDTH - PADDLE_W - BALL_R;
  }

  if (b.x < 0) {
    state.scoreR++;
    resetBall(state);
    if (state.scoreR >= WIN_SCORE) {
      setGameOver(true);
      return;
    }
  }
  if (b.x > CANVAS_WIDTH) {
    state.scoreL++;
    setScore(state.scoreL);
    resetBall(state);
    if (state.scoreL >= WIN_SCORE) {
      setGameOver(true);
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "#2a2a3d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#7c5cfc";
  ctx.fillRect(0, state.leftY, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#fc5c7d";
  ctx.fillRect(CANVAS_WIDTH - PADDLE_W, state.rightY, PADDLE_W, PADDLE_H);

  ctx.fillStyle = "#e8e8f0";
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 32px JetBrains Mono, monospace";
  ctx.fillStyle = "#7c5cfc";
  ctx.textAlign = "center";
  ctx.fillText(state.scoreL, CANVAS_WIDTH / 2 - 60, 48);
  ctx.fillStyle = "#fc5c7d";
  ctx.fillText(state.scoreR, CANVAS_WIDTH / 2 + 60, 48);
}

export default function Pong() {
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
    if (!paused) update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current || initialState("Medium"));
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      if (stateRef.current)
        stateRef.current.leftY = Math.max(
          0,
          Math.min(CANVAS_HEIGHT - PADDLE_H, y - PADDLE_H / 2),
        );
    };
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchmove", onTouch);
  }, []);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Pong</SDiffTitle>
        <SDiffDesc>W/S or Arrow keys to move — first to 7 wins!</SDiffDesc>
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
`;
