import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";
import { generateMaze, bfsPath } from "../../utils/mazeGenerator";

const CELL_SIZES = { Easy: 36, Medium: 22, Hard: 16 };
const MAZE_SIZES = { Easy: 11, Medium: 21, Hard: 31 };

function initialState(difficulty) {
  const size = MAZE_SIZES[difficulty];
  const maze = generateMaze(size, size);
  return {
    maze,
    player: { x: 1, y: 1 },
    exit: { x: maze[0].length - 2, y: maze.length - 2 },
    hint: [],
    score: 0,
    startTime: Date.now(),
    difficulty,
    solved: false,
    size,
    cellSize: CELL_SIZES[difficulty],
  };
}

function draw(ctx, state) {
  const { maze, player, exit, hint, cellSize } = state;
  const cols = maze[0].length;
  const rows = maze.length;
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (maze[row][col] === 1) {
        ctx.fillStyle = "#2a2a3d";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  for (const [hx, hy] of hint) {
    ctx.fillStyle = "rgba(124,92,252,0.3)";
    ctx.fillRect(
      hx * cellSize + 2,
      hy * cellSize + 2,
      cellSize - 4,
      cellSize - 4,
    );
  }

  ctx.fillStyle = "#3ef0a1";
  ctx.beginPath();
  ctx.arc(
    exit.x * cellSize + cellSize / 2,
    exit.y * cellSize + cellSize / 2,
    cellSize / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#fc5c7d";
  ctx.beginPath();
  ctx.arc(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    cellSize / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

export default function MazeGame() {
  const [difficulty, setDifficulty] = useState(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setScore, setGameOver } = useGameShell();
  const touchRef = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (diff) => {
      stateRef.current = initialState(diff);
      setDifficulty(diff);
      setScore(0);
    },
    [setScore],
  );

  const movePlayer = useCallback(
    (dx, dy) => {
      const state = stateRef.current;
      if (!state || state.solved) return;
      const nx = state.player.x + dx;
      const ny = state.player.y + dy;
      if (state.maze[ny]?.[nx] === 0) {
        state.player.x = nx;
        state.player.y = ny;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          draw(ctx, state);
        }
        if (nx === state.exit.x && ny === state.exit.y) {
          state.solved = true;
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          const s = Math.max(0, 1000 - elapsed);
          setScore(s);
          setGameOver(true);
        }
      }
    },
    [setScore, setGameOver],
  );

  useEffect(() => {
    if (!difficulty) return;
    const onKey = (e) => {
      const map = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        movePlayer(...dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [difficulty, movePlayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onStart = (e) => {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > Math.abs(dy)) movePlayer(dx > 0 ? 1 : -1, 0);
      else movePlayer(0, dy > 0 ? 1 : -1);
    };
    canvas.addEventListener("touchstart", onStart);
    canvas.addEventListener("touchend", onEnd);
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [movePlayer]);

  useEffect(() => {
    if (!difficulty || !stateRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    draw(ctx, stateRef.current);
  }, [difficulty]);

  const showHint = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.difficulty !== "Easy") return;
    const path = bfsPath(
      state.maze,
      state.player.x,
      state.player.y,
      state.exit.x,
      state.exit.y,
    );
    state.hint = path;
    setScore((s) => Math.max(0, s - 5));
    const canvas = canvasRef.current;
    if (canvas) draw(canvas.getContext("2d"), state);
  }, [setScore]);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Maze Game</SDiffTitle>
        <SDiffDesc>
          Navigate from start to exit using arrow keys or WASD
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

  const state = stateRef.current;
  const cols = state?.maze[0].length || 11;
  const rows = state?.maze.length || 11;
  const cellSize = state?.cellSize || 36;

  return (
    <SWrapper>
      {difficulty === "Easy" && (
        <SHintBtn onClick={showHint}>Show Hint (-5 pts)</SHintBtn>
      )}
      <SCanvas
        ref={canvasRef}
        width={cols * cellSize}
        height={rows * cellSize}
      />
    </SWrapper>
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
const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SHintBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.warning};
  color: ${theme.colors.warning};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 150ms ease-out;
  &:hover {
    background: ${theme.colors.warning}22;
  }
`;
const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  max-width: 90vw;
  max-height: 80vh;
  touch-action: none;
`;
