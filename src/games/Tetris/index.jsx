import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 600;
const COLS = 10;
const ROWS = 20;
const CELL = 28;
const COLORS = [
  "",
  "#fc5c7d",
  "#f0c93e",
  "#5cc8fc",
  "#7c5cfc",
  "#fc9c5c",
  "#3ef0a1",
  "#fc5c7d",
];

const PIECES = [
  { shape: [[1, 1, 1, 1]], color: 1 },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 2,
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 3,
  },
  {
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: 4,
  },
  {
    shape: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    color: 5,
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 6,
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 7,
  },
];

function rotate(mat) {
  return mat[0].map((_, i) => mat.map((r) => r[i]).reverse());
}

function newPiece() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    shape: p.shape,
    color: p.color,
    x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2),
    y: 0,
  };
}

function initialState() {
  return {
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    current: newPiece(),
    next: newPiece(),
    hold: null,
    usedHold: false,
    score: 0,
    level: 1,
    lines: 0,
    keys: {},
    lastDrop: 0,
    alive: true,
  };
}

function fits(board, piece, dx = 0, dy = 0, shape) {
  const s = shape || piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const nx = piece.x + c + dx,
        ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function lock(state, setScore, setGameOver) {
  const { board, current } = state;
  for (let r = 0; r < current.shape.length; r++) {
    for (let c = 0; c < current.shape[r].length; c++) {
      if (!current.shape[r][c]) continue;
      const ny = current.y + r,
        nx = current.x + c;
      if (ny < 0) {
        state.alive = false;
        setGameOver(true);
        return;
      }
      board[ny][nx] = current.color;
    }
  }
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(Boolean)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      r++;
      cleared++;
    }
  }
  const pts = [0, 100, 300, 500, 800][cleared] * state.level;
  state.score += pts;
  setScore(state.score);
  state.lines += cleared;
  state.level = Math.floor(state.lines / 10) + 1;
  state.current = state.next;
  state.next = newPiece();
  state.usedHold = false;
  if (!fits(board, state.current)) {
    state.alive = false;
    setGameOver(true);
  }
}

function ghostY(board, piece) {
  let dy = 0;
  while (fits(board, piece, 0, dy + 1)) dy++;
  return dy;
}

function update(state, timestamp, setScore, setGameOver) {
  const dropInterval = Math.max(100, 800 - (state.level - 1) * 70);
  if (timestamp - state.lastDrop > dropInterval) {
    state.lastDrop = timestamp;
    if (fits(state.board, state.current, 0, 1)) {
      state.current.y++;
    } else {
      lock(state, setScore, setGameOver);
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.board[r][c]) {
        ctx.fillStyle = COLORS[state.board[r][c]];
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }
  }

  const gy = state.current.y + ghostY(state.board, state.current);
  for (let r = 0; r < state.current.shape.length; r++) {
    for (let c = 0; c < state.current.shape[r].length; c++) {
      if (!state.current.shape[r][c]) continue;
      ctx.fillStyle = COLORS[state.current.color] + "44";
      ctx.fillRect(
        (state.current.x + c) * CELL + 1,
        (gy + r) * CELL + 1,
        CELL - 2,
        CELL - 2,
      );
      ctx.fillStyle = COLORS[state.current.color];
      ctx.fillRect(
        (state.current.x + c) * CELL + 1,
        (state.current.y + r) * CELL + 1,
        CELL - 2,
        CELL - 2,
      );
    }
  }

  ctx.strokeStyle = "#2a2a3d";
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++)
    ctx.strokeRect(0, r * CELL, CANVAS_WIDTH, CELL);
  for (let c = 0; c < COLS; c++)
    ctx.strokeRect(c * CELL, 0, CELL, CANVAS_HEIGHT);

  ctx.font = "600 12px JetBrains Mono, monospace";
  ctx.fillStyle = "#6b6b8a";
  ctx.textAlign = "left";
  ctx.fillText(
    `LVL ${state.level}  LINES ${state.lines}`,
    4,
    CANVAS_HEIGHT - 6,
  );
}

function handleKey(e, state) {
  if (!state.alive) return;
  if (e.key === "ArrowLeft" && fits(state.board, state.current, -1, 0))
    state.current.x--;
  if (e.key === "ArrowRight" && fits(state.board, state.current, 1, 0))
    state.current.x++;
  if (e.key === "ArrowDown") {
    if (fits(state.board, state.current, 0, 1)) state.current.y++;
  }
  if (e.key === "ArrowUp") {
    const rotated = rotate(state.current.shape);
    if (fits(state.board, state.current, 0, 0, rotated))
      state.current.shape = rotated;
  }
  if (e.key === " ") {
    const dy = ghostY(state.board, state.current);
    state.current.y += dy;
  }
  if (e.key === "h" || e.key === "H") {
    if (state.usedHold) return;
    const temp = state.hold;
    state.hold = {
      shape: state.current.shape,
      color: state.current.color,
      x: 0,
      y: 0,
    };
    state.current = temp
      ? {
          ...temp,
          x: Math.floor(COLS / 2) - Math.floor(temp.shape[0].length / 2),
          y: 0,
        }
      : state.next;
    if (!temp) state.next = newPiece();
    state.usedHold = true;
  }
}

export default function Tetris() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState());
  const { setScore, setGameOver, paused } = useGameShell();

  useGameLoop((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, timestamp, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, true);

  useEffect(() => {
    const onKey = (e) => {
      if (!stateRef.current) return;
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)
      )
        e.preventDefault();
      handleKey(e, stateRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SWrapper>
      <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <SHelp>← → move ↑ rotate ↓ soft drop Space hard drop H hold</SHelp>
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
  border-radius: ${theme.radius.sm};
`;
const SHelp = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
  text-align: center;
`;
