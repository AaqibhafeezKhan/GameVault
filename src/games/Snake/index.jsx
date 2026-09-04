import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;
const CELL_SIZE = 24;
const COLS = Math.floor(CANVAS_WIDTH / CELL_SIZE);
const ROWS = Math.floor(CANVAS_HEIGHT / CELL_SIZE);
const SPEEDS = { Easy: 150, Medium: 100, Hard: 65 };
const COLORS = {
  bg: "#0a0a0f",
  grid: "#1c1c27",
  snake: "#7c5cfc",
  snakeHead: "#a07cff",
  food: "#fc5c7d",
  text: "#e8e8f0",
};

function initialState(difficulty) {
  return {
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 15 },
    score: 0,
    lastTime: 0,
    difficulty,
    alive: true,
    speedIncrement: 0,
  };
}

function placeFood(state) {
  let x, y;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (state.snake.some((s) => s.x === x && s.y === y));
  state.food = { x, y };
}

function update(state, timestamp, setScore, setGameOver) {
  const baseSpeed = SPEEDS[state.difficulty];
  const speed = Math.max(50, baseSpeed - state.speedIncrement * 5);
  if (timestamp - state.lastTime < speed) return;
  state.lastTime = timestamp;
  state.dir = state.nextDir;

  const head = {
    x: state.snake[0].x + state.dir.x,
    y: state.snake[0].y + state.dir.y,
  };

  if (state.difficulty === "Easy") {
    head.x = (head.x + COLS) % COLS;
    head.y = (head.y + ROWS) % ROWS;
  } else {
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      state.alive = false;
      setGameOver(true);
      return;
    }
  }

  if (state.snake.some((s) => s.x === head.x && s.y === head.y)) {
    state.alive = false;
    setGameOver(true);
    return;
  }

  state.snake.unshift(head);
  if (head.x === state.food.x && head.y === state.food.y) {
    state.score = state.snake.length - 1;
    setScore(state.score);
    if (state.score % 5 === 0) state.speedIncrement++;
    placeFood(state);
  } else {
    state.snake.pop();
  }
}

function draw(ctx, state) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(
    state.food.x * CELL_SIZE + CELL_SIZE / 2,
    state.food.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  state.snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
    ctx.fillRect(
      seg.x * CELL_SIZE + 1,
      seg.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2,
    );
  });
}

function handleInput(e, state) {
  const dirs = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };
  const newDir = dirs[e.key];
  if (!newDir) return;
  if (newDir.x === -state.dir.x || newDir.y === -state.dir.y) return;
  state.nextDir = newDir;
}

export default function Snake() {
  const [difficulty, setDifficulty] = useState(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setScore, setGameOver, paused } = useGameShell();
  const touchRef = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (diff) => {
      stateRef.current = initialState(diff);
      setDifficulty(diff);
      setScore(0);
      setGameOver(false);
    },
    [setScore, setGameOver],
  );

  useGameLoop((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive) {
      update(stateRef.current, timestamp, setScore, setGameOver);
    }
    draw(ctx, stateRef.current || initialState("Medium"));
  }, !!difficulty);

  useEffect(() => {
    if (!difficulty) return;
    const handler = (e) => {
      if (!stateRef.current) return;
      handleInput(e, stateRef.current);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e) => {
      e.preventDefault();
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!stateRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      const synthetic = { key: "" };
      if (Math.abs(dx) > Math.abs(dy)) {
        synthetic.key = dx > 0 ? "ArrowRight" : "ArrowLeft";
      } else {
        synthetic.key = dy > 0 ? "ArrowDown" : "ArrowUp";
      }
      handleInput(synthetic, stateRef.current);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Snake</SDiffTitle>
        <SDiffDesc>Choose difficulty to start</SDiffDesc>
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
  font-family: ${theme.font.body};
  color: ${theme.colors.textMuted};
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
