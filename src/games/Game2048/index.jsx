import { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const BOARD_SIZE = 4;
const WIN_TILE = 2048;

function createBoard() {
  const board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));
  addRandom(board);
  addRandom(board);
  return board;
}

function addRandom(board) {
  const empty = [];
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (board[r][c] === 0) empty.push([r, c]);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slideRow(row) {
  const filtered = row.filter((x) => x !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      gained += filtered[i];
      filtered[i + 1] = 0;
    }
  }
  const merged = filtered.filter((x) => x !== 0);
  while (merged.length < BOARD_SIZE) merged.push(0);
  return { row: merged, gained };
}

function move(board, dir) {
  let newBoard = board.map((r) => [...r]);
  let totalGained = 0;
  let changed = false;

  const transform = (b) => {
    if (dir === "left") return b;
    if (dir === "right") return b.map((r) => r.reverse());
    if (dir === "up") return b[0].map((_, i) => b.map((r) => r[i]));
    if (dir === "down") return b[0].map((_, i) => b.map((r) => r[i]).reverse());
  };
  const untransform = (b) => {
    if (dir === "left") return b;
    if (dir === "right") return b.map((r) => r.reverse());
    if (dir === "up") return b[0].map((_, i) => b.map((r) => r[i]));
    if (dir === "down") return b[0].map((_, i) => b.map((r) => r[i]).reverse());
  };

  newBoard = transform(newBoard);
  for (let r = 0; r < BOARD_SIZE; r++) {
    const { row, gained } = slideRow(newBoard[r]);
    if (row.join() !== newBoard[r].join()) changed = true;
    newBoard[r] = row;
    totalGained += gained;
  }
  newBoard = untransform(newBoard);
  return { board: newBoard, gained: totalGained, changed };
}

function hasValidMoves(board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c < BOARD_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < BOARD_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

const TILE_COLORS = {
  0: "#1c1c27",
  2: "#3ef0a1",
  4: "#2ed47a",
  8: "#f0c93e",
  16: "#fc9c5c",
  32: "#fc5c7d",
  64: "#fc5c7d",
  128: "#7c5cfc",
  256: "#5cc8fc",
  512: "#7c5cfc",
  1024: "#fc5c7d",
  2048: "#f0c93e",
};

export default function Game2048() {
  const [board, setBoard] = useState(createBoard);
  const [scoreAdd, setScoreAdd] = useState(0);
  const [won, setWon] = useState(false);
  const { setScore, setGameOver } = useGameShell();
  const touchRef = useState({ x: 0, y: 0 })[0];

  const handleMove = useCallback(
    (dir) => {
      setBoard((prev) => {
        const { board: newBoard, gained, changed } = move(prev, dir);
        if (!changed) return prev;
        addRandom(newBoard);
        setScoreAdd(gained);
        setScore((s) => s + gained);
        const hasWon = newBoard.some((r) => r.some((c) => c >= WIN_TILE));
        if (hasWon && !won) setWon(true);
        if (!hasValidMoves(newBoard)) setGameOver(true);
        return newBoard;
      });
    },
    [won, setScore, setGameOver],
  );

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleMove]);

  useEffect(() => {
    const onTouchStart = (e) => {
      touchRef.x = e.touches[0].clientX;
      touchRef.y = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.x;
      const dy = e.changedTouches[0].clientY - touchRef.y;
      if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
      else handleMove(dy > 0 ? "down" : "up");
    };
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMove, touchRef]);

  const restart = () => {
    setBoard(createBoard());
    setScore(0);
    setWon(false);
    setGameOver(false);
  };

  return (
    <SWrapper>
      {won && <SWinBanner>You reached 2048! Keep going!</SWinBanner>}
      <SBoard>
        {board.map((row, r) =>
          row.map((val, c) => (
            <STile key={`${r}-${c}`} $val={val}>
              {val > 0 ? val : ""}
            </STile>
          )),
        )}
      </SBoard>
      <SHint>Arrow keys or swipe to slide tiles</SHint>
      <SRestartBtn onClick={restart}>New Game</SRestartBtn>
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SWinBanner = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.warning};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  border: 1px solid ${theme.colors.warning}44;
  border-radius: ${theme.radius.sm};
`;
const SBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: ${theme.colors.border};
  padding: 8px;
  border-radius: ${theme.radius.md};
`;
const STile = styled.div`
  width: 90px;
  height: 90px;
  background: ${(p) => TILE_COLORS[p.$val] || "#fc5c7d"};
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: ${(p) => (p.$val > 512 ? "1.2rem" : "1.6rem")};
  color: ${(p) => (p.$val === 0 ? "transparent" : "#0a0a0f")};
  transition: background 100ms ease-out;
`;
const SHint = styled.p`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
const SRestartBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
