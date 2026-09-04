import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const SIZE = 5;
const SCRAMBLE_MOVES = { Easy: 5, Medium: 12, Hard: 25 };

function createBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
}

function toggle(board, r, c) {
  const nb = board.map((row) => [...row]);
  for (const [dr, dc] of [
    [0, 0],
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]) {
    const nr = r + dr,
      nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) nb[nr][nc] = !nb[nr][nc];
  }
  return nb;
}

function createSolvable(moves) {
  let board = createBoard();
  for (let i = 0; i < moves; i++) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    board = toggle(board, r, c);
  }
  if (board.every((row) => row.every((v) => !v))) return createSolvable(moves);
  return board;
}

function isSolved(board) {
  return board.every((row) => row.every((v) => !v));
}

export default function LightsOut() {
  const [board, setBoard] = useState(null);
  const [moves, setMoves] = useState(0);
  const [difficulty, setDifficulty] = useState(null);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (diff) => {
      setDifficulty(diff);
      setBoard(createSolvable(SCRAMBLE_MOVES[diff]));
      setMoves(0);
      setScore(0);
    },
    [setScore],
  );

  const handleClick = useCallback(
    (r, c) => {
      if (!board || isSolved(board)) return;
      const nb = toggle(board, r, c);
      const newMoves = moves + 1;
      setMoves(newMoves);
      setBoard(nb);
      if (isSolved(nb)) {
        const pts = Math.max(0, 1000 - newMoves);
        setScore(pts);
        setGameOver(true);
      }
    },
    [board, moves, setScore, setGameOver],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Lights Out</SDiffTitle>
        <SDiffDesc>
          Click cells to toggle them and their neighbors — turn all lights OFF!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d} ({SCRAMBLE_MOVES[d]} scramble moves)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SMoves>
        Moves: <SMovesVal>{moves}</SMovesVal>
      </SMoves>
      <SGrid>
        {board &&
          board.map((row, r) =>
            row.map((on, c) => (
              <SLight
                key={`${r}-${c}`}
                $on={on}
                onClick={() => handleClick(r, c)}
              />
            )),
          )}
      </SGrid>
      <SRestart onClick={() => start(difficulty)}>New Puzzle</SRestart>
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
  padding: ${theme.space[2]}px ${theme.space[5]}px;
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
  gap: ${theme.space[4]}px;
`;
const SMoves = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
`;
const SMovesVal = styled.span`
  color: ${theme.colors.accent};
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${SIZE}, 1fr);
  gap: 6px;
`;
const SLight = styled.div`
  width: 70px;
  height: 70px;
  background: ${(p) =>
    p.$on ? theme.colors.warning : theme.colors.surfaceAlt};
  border: 1px solid
    ${(p) => (p.$on ? theme.colors.warning + "88" : theme.colors.border)};
  border-radius: ${theme.radius.sm};
  cursor: pointer;
  box-shadow: ${(p) => (p.$on ? `0 0 12px ${theme.colors.warning}66` : "none")};
  transition:
    background 100ms ease-out,
    box-shadow 100ms ease-out;
  &:hover {
    opacity: 0.8;
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
