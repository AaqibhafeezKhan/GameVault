import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const SIZES = {
  Easy: { rows: 9, cols: 9, mines: 10 },
  Medium: { rows: 16, cols: 16, mines: 40 },
  Hard: { rows: 9, cols: 30, mines: 56 },
};

function createBoard(rows, cols, mines, firstR, firstC) {
  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) safe.add(`${firstR + dr},${firstC + dc}`);
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r,
      c,
      mine: false,
      revealed: false,
      flagged: false,
      adj: 0,
    })),
  );
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows),
      c = Math.floor(Math.random() * cols);
    if (!cells[r][c].mine && !safe.has(`${r},${c}`)) {
      cells[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (!cells[r][c].mine) {
        let adj = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              cells[nr][nc].mine
            )
              adj++;
          }
        cells[r][c].adj = adj;
      }
    }
  return cells;
}

function floodReveal(cells, r, c, rows, cols) {
  const visited = new Set();
  const queue = [[r, c]];
  while (queue.length) {
    const [cr, cc] = queue.shift();
    const key = `${cr},${cc}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const cell = cells[cr][cc];
    if (cell.flagged || cell.revealed) continue;
    cell.revealed = true;
    if (cell.adj === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr,
            nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
            queue.push([nr, nc]);
        }
    }
  }
}

const ADJ_COLORS = [
  "",
  "#5cc8fc",
  "#3ef0a1",
  "#fc5c7d",
  "#7c5cfc",
  "#fc9c5c",
  "#5cc8fc",
  "#e8e8f0",
  "#6b6b8a",
];

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState(null);
  const [board, setBoard] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [config, setConfig] = useState(null);
  const [gameOver, setLocalGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (diff) => {
      const cfg = SIZES[diff];
      setDifficulty(diff);
      setConfig(cfg);
      setBoard(
        Array.from({ length: cfg.rows }, (_, r) =>
          Array.from({ length: cfg.cols }, (_, c) => ({
            r,
            c,
            mine: false,
            revealed: false,
            flagged: false,
            adj: 0,
          })),
        ),
      );
      setInitialized(false);
      setLocalGameOver(false);
      setWon(false);
      setScore(0);
    },
    [setScore],
  );

  const handleClick = useCallback(
    (r, c) => {
      if (!board || gameOver || won) return;
      let newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      if (!initialized) {
        newBoard = createBoard(config.rows, config.cols, config.mines, r, c);
        setInitialized(true);
      }
      const cell = newBoard[r][c];
      if (cell.flagged || cell.revealed) return;
      if (cell.mine) {
        for (const row of newBoard)
          for (const cl of row) if (cl.mine) cl.revealed = true;
        setBoard(newBoard);
        setLocalGameOver(true);
        setGameOver(true);
        return;
      }
      floodReveal(newBoard, r, c, config.rows, config.cols);
      setBoard(newBoard);
      const safe = config.rows * config.cols - config.mines;
      const revealed = newBoard
        .flat()
        .filter((cl) => cl.revealed && !cl.mine).length;
      if (revealed >= safe) {
        setWon(true);
        setScore(1000);
        setGameOver(true);
      }
    },
    [board, initialized, config, gameOver, won, setScore, setGameOver],
  );

  const handleFlag = useCallback(
    (e, r, c) => {
      e.preventDefault();
      if (!board || gameOver || won || !initialized) return;
      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      setBoard(newBoard);
    },
    [board, initialized, gameOver, won],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Minesweeper</SDiffTitle>
        <SDiffDesc>
          Reveal all safe cells without triggering a mine. Right-click to flag.
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d} ({SIZES[d].rows}×{SIZES[d].cols}, {SIZES[d].mines} mines)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SStatus $won={won} $lost={gameOver && !won}>
        {won
          ? "🎉 You won!"
          : gameOver
            ? "💥 Mine hit!"
            : `${config.mines} mines`}
      </SStatus>
      <SGrid
        $cols={config.cols}
        style={{ maxWidth: "90vw", overflowX: "auto" }}
      >
        {board &&
          board.map((row, r) =>
            row.map((cell, c) => (
              <SCell
                key={`${r}-${c}`}
                $revealed={cell.revealed}
                $mine={cell.mine && cell.revealed}
                $flagged={cell.flagged}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleFlag(e, r, c)}
                $adj={cell.adj}
              >
                {cell.flagged && !cell.revealed
                  ? "🚩"
                  : cell.revealed && cell.mine
                    ? "💣"
                    : cell.revealed && cell.adj > 0
                      ? cell.adj
                      : ""}
              </SCell>
            )),
          )}
      </SGrid>
      <SRestart onClick={() => start(difficulty)}>New Game</SRestart>
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
  text-align: center;
  max-width: 360px;
`;
const SDiffButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
  align-items: center;
`;
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
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
const SStatus = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) =>
    p.$won
      ? theme.colors.success
      : p.$lost
        ? theme.colors.danger
        : theme.colors.textMuted};
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, 26px);
  gap: 2px;
`;
const SCell = styled.div`
  width: 26px;
  height: 26px;
  background: ${(p) =>
    p.$mine
      ? theme.colors.danger + "44"
      : p.$revealed
        ? theme.colors.surfaceAlt
        : theme.colors.surface};
  border: 1px solid
    ${(p) => (p.$revealed ? theme.colors.border + "44" : theme.colors.border)};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: 0.72rem;
  font-weight: 700;
  color: ${(p) =>
    p.$adj > 0 ? ADJ_COLORS[p.$adj] || theme.colors.text : theme.colors.text};
  cursor: pointer;
  user-select: none;
  transition: background 80ms ease-out;
  &:hover {
    background: ${(p) => (!p.$revealed ? theme.colors.surfaceAlt : undefined)};
  }
`;
const SRestart = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
