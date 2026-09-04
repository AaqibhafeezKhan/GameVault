import { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { WORD_SEARCH_WORDS } from "../../utils/wordBank";
import { useTimer } from "../../hooks/useTimer";

const GRID_SIZES = { Easy: 10, Medium: 12, Hard: 15 };
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

function buildGrid(size, words) {
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const placements = [];

  for (const word of words) {
    let placed = false;
    for (let tries = 0; tries < 100 && !placed; tries++) {
      const [dr, dc] =
        DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const cells = [];
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i,
          c = col + dc * i;
        if (r < 0 || r >= size || c < 0 || c >= size) {
          valid = false;
          break;
        }
        if (grid[r][c] && grid[r][c] !== word[i]) {
          valid = false;
          break;
        }
        cells.push([r, c]);
      }
      if (valid) {
        cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
        placements.push({ word, cells });
        placed = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c])
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
  }
  return { grid, placements };
}

export default function WordSearch() {
  const [difficulty, setDifficulty] = useState(null);
  const [grid, setGrid] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [words, setWords] = useState([]);
  const [found, setFound] = useState([]);
  const [selecting, setSelecting] = useState([]);
  const [mouseDown, setMouseDown] = useState(false);
  const { setScore, setGameOver } = useGameShell();
  const { elapsed, start: startTimer } = useTimer();

  const start = useCallback(
    (diff) => {
      const size = GRID_SIZES[diff];
      const wordList =
        WORD_SEARCH_WORDS[Math.floor(Math.random() * WORD_SEARCH_WORDS.length)];
      const { grid, placements } = buildGrid(size, wordList);
      setDifficulty(diff);
      setGrid(grid);
      setPlacements(placements);
      setWords(wordList);
      setFound([]);
      setSelecting([]);
      setScore(0);
      startTimer();
    },
    [setScore, startTimer],
  );

  const getCellKey = (r, c) => `${r}-${c}`;

  const checkSelection = useCallback(
    (cells) => {
      const str = cells.map(([r, c]) => grid[r]?.[c] || "").join("");
      const rstr = str.split("").reverse().join("");
      for (const p of placements) {
        if (found.includes(p.word)) continue;
        const pStr = p.cells.map(([r, c]) => grid[r][c]).join("");
        if (str === pStr || rstr === pStr) {
          const newFound = [...found, p.word];
          setFound(newFound);
          const pts = Math.max(0, 1000 - elapsed * 10);
          setScore((s) => s + pts);
          if (newFound.length === words.length) setGameOver(true);
          return true;
        }
      }
      return false;
    },
    [grid, placements, found, elapsed, words, setScore, setGameOver],
  );

  const isHighlighted = (r, c) =>
    selecting.some(([sr, sc]) => sr === r && sc === c);
  const isFound = (r, c) => {
    for (const p of placements) {
      if (
        found.includes(p.word) &&
        p.cells.some(([pr, pc]) => pr === r && pc === c)
      )
        return true;
    }
    return false;
  };

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Word Search</SDiffTitle>
        <SDiffDesc>
          Find all hidden words — horizontal, vertical, and diagonal!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d} ({GRID_SIZES[d]}×{GRID_SIZES[d]})
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  const cellSize =
    difficulty === "Hard" ? 24 : difficulty === "Medium" ? 28 : 32;

  return (
    <SWrapper>
      <SLayout>
        <SGridWrap>
          <SGrid
            $cols={grid[0]?.length || 10}
            $cell={cellSize}
            onMouseLeave={() => {
              if (mouseDown) {
                checkSelection(selecting);
                setSelecting([]);
                setMouseDown(false);
              }
            }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => (
                <SCell
                  key={getCellKey(r, c)}
                  $size={cellSize}
                  $highlighted={isHighlighted(r, c)}
                  $found={isFound(r, c)}
                  onMouseDown={() => {
                    setMouseDown(true);
                    setSelecting([[r, c]]);
                  }}
                  onMouseEnter={() => {
                    if (mouseDown) setSelecting((prev) => [...prev, [r, c]]);
                  }}
                  onMouseUp={() => {
                    checkSelection(selecting);
                    setSelecting([]);
                    setMouseDown(false);
                  }}
                >
                  {letter}
                </SCell>
              )),
            )}
          </SGrid>
        </SGridWrap>
        <SWordList>
          <SListTitle>WORDS</SListTitle>
          {words.map((w) => (
            <SWordItem key={w} $found={found.includes(w)}>
              {w}
            </SWordItem>
          ))}
        </SWordList>
      </SLayout>
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
`;
const SLayout = styled.div`
  display: flex;
  gap: ${theme.space[4]}px;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
`;
const SGridWrap = styled.div`
  overflow: auto;
  max-width: 90vw;
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, ${(p) => p.$cell}px);
  gap: 2px;
  user-select: none;
`;
const SCell = styled.div`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  background: ${(p) =>
    p.$found
      ? theme.colors.success + "33"
      : p.$highlighted
        ? theme.colors.accent + "44"
        : "transparent"};
  border: 1px solid
    ${(p) =>
      p.$found ? theme.colors.success + "66" : theme.colors.border + "44"};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: ${(p) => (p.$size > 28 ? "0.85rem" : "0.7rem")};
  color: ${(p) => (p.$found ? theme.colors.success : theme.colors.text)};
  cursor: pointer;
`;
const SWordList = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px;
  min-width: 120px;
`;
const SListTitle = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.1em;
  margin-bottom: ${theme.space[2]}px;
`;
const SWordItem = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${(p) => (p.$found ? theme.colors.success : theme.colors.textMuted)};
  text-decoration: ${(p) => (p.$found ? "line-through" : "none")};
  padding: 2px 0;
`;
