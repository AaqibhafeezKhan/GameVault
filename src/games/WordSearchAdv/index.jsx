import { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { WORD_SEARCH_WORDS } from "../../utils/wordBank";

const GRID_SIZE = 12;

function getDirs() {
  return [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, -1],
  ];
}

function generateGrid(words) {
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(""),
  );
  const placedInfo = [];

  for (const word of words) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const dir = getDirs()[Math.floor(Math.random() * getDirs().length)];
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const nr = r + dir[0] * i,
          nc = c + dir[1] * i;
        if (
          nr < 0 ||
          nr >= GRID_SIZE ||
          nc < 0 ||
          nc >= GRID_SIZE ||
          (grid[nr][nc] !== "" && grid[nr][nc] !== word[i])
        ) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) {
        const path = [];
        for (let i = 0; i < word.length; i++) {
          const nr = r + dir[0] * i,
            nc = c + dir[1] * i;
          grid[nr][nc] = word[i];
          path.push([nr, nc]);
        }
        placedInfo.push({ word, path });
        placed = true;
      }
      attempts++;
    }
    if (!placed) return generateGrid(words); // Retry full generation if fitting fails
  }

  // Fill remaining blanks
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "")
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }

  return { grid, placedInfo };
}

export default function WordSearchAdv() {
  const [words, setWords] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [foundLines, setFoundLines] = useState([]);
  const [selection, setSelection] = useState([]); // [ {r,c}, ... ]
  const [isSelecting, setIsSelecting] = useState(false);
  const [foundWords, setFoundWords] = useState(new Set());
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(() => {
    const listInfo =
      WORD_SEARCH_WORDS[Math.floor(Math.random() * WORD_SEARCH_WORDS.length)];
    const newWords = [...listInfo];
    setWords(newWords);
    setGridData(generateGrid(newWords));
    setFoundLines([]);
    setFoundWords(new Set());
    setScore(0);
    setGameOver(false);
  }, [setScore, setGameOver]);

  useEffect(() => {
    start();
  }, []); // eslint-disable-line

  const getLineCells = (r1, c1, r2, c2) => {
    const cells = [];
    const dr = Math.sign(r2 - r1),
      dc = Math.sign(c2 - c1);
    const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    // Ensure it's a straight line (horiz, vert, or perfectly diagonal)
    if (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) {
      for (let i = 0; i <= len; i++) {
        cells.push({ r: r1 + dr * i, c: c1 + dc * i });
      }
    }
    return cells;
  };

  const handlePointerDown = (r, c) => {
    setIsSelecting(true);
    setSelection([{ r, c }]);
  };

  const handlePointerEnter = (r, c) => {
    if (!isSelecting || selection.length === 0) return;
    const startCell = selection[0];
    setSelection(getLineCells(startCell.r, startCell.c, r, c));
  };

  const handlePointerUp = () => {
    setIsSelecting(false);
    if (!selection.length || !gridData) return;

    let selectedStr = "";
    let revStr = "";
    for (const cell of selection) {
      selectedStr += gridData.grid[cell.r][cell.c];
      revStr = gridData.grid[cell.r][cell.c] + revStr;
    }

    // Check against placed info
    const match = gridData.placedInfo.find(
      (info) =>
        !foundWords.has(info.word) &&
        (info.word === selectedStr || info.word === revStr),
    );

    if (match) {
      setFoundWords((prev) => new Set(prev).add(match.word));
      setFoundLines((prev) => [...prev, selection]);
      setScore((s) => s + match.word.length * 10);
      if (foundWords.size + 1 === words.length) {
        // all found
        setGameOver(true);
      }
    }
    setSelection([]);
  };

  // Handle global mouse up to clear selection if dragged off grid
  useEffect(() => {
    const up = () => setIsSelecting(false);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  if (!gridData) return null;

  // Helper to check if a cell is in an array of cell objects
  const isInCells = (r, c, cellArr) =>
    cellArr.some((cell) => cell.r === r && cell.c === c);
  const isFound = (r, c) => foundLines.some((line) => isInCells(r, c, line));

  return (
    <SWrapper>
      <SWordList>
        {words.map((w) => (
          <SWord key={w} $found={foundWords.has(w)}>
            {w}
          </SWord>
        ))}
      </SWordList>

      <SGrid
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchEnd={handlePointerUp}
      >
        {gridData.grid.map((row, r) =>
          row.map((letter, c) => {
            const selected = isInCells(r, c, selection);
            const found = isFound(r, c);
            return (
              <SCell
                key={`${r}-${c}`}
                $selected={selected}
                $found={found && !selected}
                onMouseDown={() => handlePointerDown(r, c)}
                onMouseEnter={() => handlePointerEnter(r, c)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handlePointerDown(r, c);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const target = document.elementFromPoint(
                    touch.clientX,
                    touch.clientY,
                  );
                  if (target && target.dataset.r !== undefined) {
                    handlePointerEnter(
                      Number(target.dataset.r),
                      Number(target.dataset.c),
                    );
                  }
                }}
                data-r={r}
                data-c={c}
              >
                {letter}
              </SCell>
            );
          }),
        )}
      </SGrid>

      <SHint>Drag across letters to find words</SHint>
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SWordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space[3]}px;
  justify-content: center;
  max-width: 500px;
`;
const SWord = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) => (p.$found ? theme.colors.success : theme.colors.text)};
  text-decoration: ${(p) => (p.$found ? "line-through" : "none")};
  opacity: ${(p) => (p.$found ? 0.6 : 1)};
  transition: all 200ms;
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_SIZE}, 32px);
  gap: 2px;
  background: ${theme.colors.surface};
  padding: ${theme.space[2]}px;
  border-radius: ${theme.radius.md};
  border: 1px solid ${theme.colors.border};
  user-select: none;
  touch-action: none;
`;
const SCell = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(p) =>
    p.$selected ? "#fff" : p.$found ? theme.colors.success : theme.colors.text};
  background: ${(p) =>
    p.$selected
      ? theme.colors.accent
      : p.$found
        ? theme.colors.success + "22"
        : "transparent"};
  border-radius: ${theme.radius.sm};
  cursor: pointer;
  transition:
    background 150ms,
    color 150ms;
`;
const SHint = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
