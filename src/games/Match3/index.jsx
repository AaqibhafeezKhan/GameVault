import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const COLS = 8;
const ROWS = 8;
const COLORS = 6;
const GEM_COLORS = [
  "#fc5c7d",
  "#7c5cfc",
  "#f0c93e",
  "#3ef0a1",
  "#5cc8fc",
  "#fc9c5c",
];

function randomGem() {
  return Math.floor(Math.random() * COLORS);
}
function createBoard() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, randomGem),
  );
}

function findMatches(board) {
  const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const v = board[r][c];
      if (v !== null && v === board[r][c + 1] && v === board[r][c + 2]) {
        let k = c;
        while (k < COLS && board[r][k] === v) {
          matched[r][k] = true;
          k++;
        }
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      const v = board[r][c];
      if (v !== null && v === board[r + 1][c] && v === board[r + 2][c]) {
        let k = r;
        while (k < ROWS && board[k][c] === v) {
          matched[k][c] = true;
          k++;
        }
      }
    }
  }
  return matched;
}

function hasAnyMatches(board) {
  return findMatches(board).some((row) => row.some(Boolean));
}

function applyGravity(board) {
  const nb = board.map((r) => [...r]);
  for (let c = 0; c < COLS; c++) {
    let fill = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][c] !== null) {
        nb[fill][c] = nb[r][c];
        if (fill !== r) nb[r][c] = null;
        fill--;
      }
    }
    for (let r = fill; r >= 0; r--) nb[r][c] = randomGem();
  }
  return nb;
}

function processMatches(board) {
  const matched = findMatches(board);
  const count = matched.flat().filter(Boolean).length;
  if (!count) return { board, count: 0 };
  const nb = board.map((row, r) =>
    row.map((v, c) => (matched[r][c] ? null : v)),
  );
  return { board: applyGravity(nb), count };
}

export default function Match3() {
  const [board, setBoard] = useState(createBoard);
  const [selected, setSelected] = useState(null);
  const [cascade, setCascade] = useState(0);
  const { setScore, setGameOver } = useGameShell();

  const handleClick = useCallback(
    (r, c) => {
      if (!selected) {
        setSelected([r, c]);
        return;
      }
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }
      const adj =
        (Math.abs(sr - r) === 1 && sc === c) ||
        (Math.abs(sc - c) === 1 && sr === r);
      if (!adj) {
        setSelected([r, c]);
        return;
      }
      setSelected(null);

      const nb = board.map((row) => [...row]);
      [nb[sr][sc], nb[r][c]] = [nb[r][c], nb[sr][sc]];

      let cur = nb,
        totalScore = 0,
        level = 1;
      let { board: next, count } = processMatches(cur);
      if (!count) return;
      let cascadeMult = 1;

      const runCascade = (b, mult) => {
        const { board: next2, count: cnt } = processMatches(b);
        if (!cnt) {
          setScore((s) => s + totalScore);
          return;
        }
        totalScore += cnt * 10 * mult;
        setTimeout(() => {
          setBoard(next2);
          runCascade(next2, mult + 1);
        }, 200);
      };

      totalScore += count * 10;
      setBoard(next);
      setTimeout(() => runCascade(next, 2), 200);
    },
    [board, selected, setScore],
  );

  return (
    <SWrapper>
      <SGrid>
        {board.map((row, r) =>
          row.map((gem, c) => (
            <SGem
              key={`${r}-${c}`}
              $color={GEM_COLORS[gem]}
              $selected={selected && selected[0] === r && selected[1] === c}
              onClick={() => handleClick(r, c)}
            />
          )),
        )}
      </SGrid>
      <SHint>Click a gem, then click an adjacent gem to swap</SHint>
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${COLS}, 52px);
  gap: 4px;
`;
const SGem = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    ${(p) => p.$color}ff,
    ${(p) => p.$color}88
  );
  border: ${(p) =>
    p.$selected ? `3px solid #fff` : `2px solid ${p.$color}66`};
  cursor: pointer;
  transition: transform 100ms ease-out;
  &:hover {
    transform: scale(1.1);
  }
`;
const SHint = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
