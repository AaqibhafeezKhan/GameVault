import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const SIZES = { Easy: 3, Medium: 4, Hard: 5 };

function createTiles(n) {
  const tiles = Array.from({ length: n * n - 1 }, (_, i) => i + 1);
  tiles.push(null);
  do {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles, n));
  return tiles;
}

function isSolvable(tiles, n) {
  const flat = tiles.filter(Boolean);
  let inv = 0;
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inv++;
    }
  }
  const emptyRow = Math.floor(tiles.indexOf(null) / n);
  if (n % 2 === 1) return inv % 2 === 0;
  return (inv + n - 1 - emptyRow) % 2 === 0;
}

function isSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === null;
}

export default function SlidingPuzzle() {
  const [difficulty, setDifficulty] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [n, setN] = useState(3);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (diff) => {
      const size = SIZES[diff];
      setDifficulty(diff);
      setN(size);
      setTiles(createTiles(size));
      setMoves(0);
      setScore(0);
    },
    [setScore],
  );

  const handleClick = useCallback(
    (idx) => {
      const emptyIdx = tiles.indexOf(null);
      const row = Math.floor(idx / n),
        col = idx % n;
      const eRow = Math.floor(emptyIdx / n),
        eCol = emptyIdx % n;
      const adjacent =
        (row === eRow && Math.abs(col - eCol) === 1) ||
        (col === eCol && Math.abs(row - eRow) === 1);
      if (!adjacent) return;
      const newTiles = [...tiles];
      [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
      const newMoves = moves + 1;
      setMoves(newMoves);
      setTiles(newTiles);
      if (isSolved(newTiles)) {
        const score = Math.max(0, 1000 - newMoves * 5);
        setScore(score);
        setGameOver(true);
      }
    },
    [tiles, n, moves, setScore, setGameOver],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Sliding Puzzle</SDiffTitle>
        <SDiffDesc>
          Click tiles adjacent to the empty space to slide them into order!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d} ({SIZES[d]}×{SIZES[d]})
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SMovesRow>
        Moves: <SMoves>{moves}</SMoves>
      </SMovesRow>
      <SGrid $n={n}>
        {tiles.map((val, idx) => (
          <STile
            key={idx}
            $empty={val === null}
            onClick={() => handleClick(idx)}
          >
            {val}
          </STile>
        ))}
      </SGrid>
      <SRestart onClick={() => start(difficulty)}>Shuffle</SRestart>
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
  max-width: 340px;
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
  gap: ${theme.space[3]}px;
`;
const SMovesRow = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SMoves = styled.span`
  color: ${theme.colors.accent};
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$n}, 1fr);
  gap: 4px;
`;
const STile = styled.div`
  width: ${(p) => (p.$n ? 80 : 80)}px;
  height: ${(p) => (p.$n ? 80 : 80)}px;
  width: 80px;
  height: 80px;
  background: ${(p) => (p.$empty ? "transparent" : theme.colors.surface)};
  border: ${(p) => (p.$empty ? "none" : `1px solid ${theme.colors.border}`)};
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-size: 1.4rem;
  font-weight: 500;
  color: ${theme.colors.text};
  cursor: ${(p) => (p.$empty ? "default" : "pointer")};
  transition: background 100ms ease-out;
  &:hover:not([data-empty]) {
    background: ${theme.colors.surfaceAlt};
  }
  user-select: none;
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
