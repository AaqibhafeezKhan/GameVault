import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const COLS = 7;
const ROWS = 6;
const EMPTY = null;
const P1 = "P1";
const P2 = "P2";
const PLAYER1_COLOR = "#7c5cfc";
const PLAYER2_COLOR = "#fc5c7d";

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function checkWinner(board) {
  const check = (cells) => {
    for (let i = 0; i <= cells.length - 4; i++) {
      const v = cells[i];
      if (v && cells[i + 1] === v && cells[i + 2] === v && cells[i + 3] === v) {
        return { winner: v, indices: [i, i + 1, i + 2, i + 3] };
      }
    }
    return null;
  };

  for (let r = 0; r < ROWS; r++) {
    const result = check(board[r]);
    if (result)
      return {
        winner: result.winner,
        cells: result.indices.map((c) => [r, c]),
      };
  }
  for (let c = 0; c < COLS; c++) {
    const col = board.map((r) => r[c]);
    const result = check(col);
    if (result)
      return {
        winner: result.winner,
        cells: result.indices.map((r) => [r, c]),
      };
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const diag = [0, 1, 2, 3].map((i) => board[r + i][c + i]);
      const result = check(diag);
      if (result)
        return {
          winner: result.winner,
          cells: result.indices.map((i) => [r + i, c + i]),
        };
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const diag = [0, 1, 2, 3].map((i) => board[r - i][c + i]);
      const result = check(diag);
      if (result)
        return {
          winner: result.winner,
          cells: result.indices.map((i) => [r - i, c + i]),
        };
    }
  }
  return null;
}

function getAIMove(board, difficulty) {
  const getValidCols = () => {
    return [...Array(COLS).keys()].filter((c) => board[0][c] === EMPTY);
  };
  const validCols = getValidCols();
  if (!validCols.length) return null;

  if (difficulty === "Easy")
    return validCols[Math.floor(Math.random() * validCols.length)];

  const dropPiece = (b, col, player) => {
    const nb = b.map((r) => [...r]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][col] === EMPTY) {
        nb[r][col] = player;
        break;
      }
    }
    return nb;
  };

  for (const col of validCols) {
    const test = dropPiece(board, col, P2);
    if (checkWinner(test)) return col;
  }
  for (const col of validCols) {
    const test = dropPiece(board, col, P1);
    if (checkWinner(test)) return col;
  }
  const center = Math.floor(COLS / 2);
  if (validCols.includes(center)) return center;
  return validCols[Math.floor(Math.random() * validCols.length)];
}

export default function Connect4() {
  const [board, setBoard] = useState(createBoard());
  const [turn, setTurn] = useState(P1);
  const [winner, setWinner] = useState(null);
  const [winCells, setWinCells] = useState([]);
  const [mode, setMode] = useState("ai");
  const [difficulty, setDifficulty] = useState("Medium");
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const { setScore, setGameOver } = useGameShell();

  const drop = useCallback((col, board, player) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) {
        const nb = board.map((row) => [...row]);
        nb[r][col] = player;
        return nb;
      }
    }
    return null;
  }, []);

  const handleDrop = useCallback(
    (col) => {
      if (winner || board[0][col] !== EMPTY) return;
      const nb = drop(col, board, turn);
      if (!nb) return;
      const result = checkWinner(nb);
      if (result) {
        setBoard(nb);
        setWinner(result.winner);
        setWinCells(result.cells);
        setScores((s) => ({ ...s, [result.winner]: s[result.winner] + 1 }));
        setScore(scores[result.winner] + 1);
        setGameOver(true);
        return;
      }
      if (nb.every((row) => row.every(Boolean))) {
        setBoard(nb);
        setGameOver(true);
        return;
      }
      const nextTurn = turn === P1 ? P2 : P1;
      setBoard(nb);
      setTurn(nextTurn);

      if (mode === "ai" && nextTurn === P2) {
        setTimeout(() => {
          const aiCol = getAIMove(nb, difficulty);
          if (aiCol === null) return;
          const aib = drop(aiCol, nb, P2);
          if (!aib) return;
          const aiResult = checkWinner(aib);
          if (aiResult) {
            setBoard(aib);
            setWinner(aiResult.winner);
            setWinCells(aiResult.cells);
            setScores((s) => ({
              ...s,
              [aiResult.winner]: s[aiResult.winner] + 1,
            }));
            setGameOver(true);
          } else {
            setBoard(aib);
            setTurn(P1);
          }
        }, 400);
      }
    },
    [
      board,
      turn,
      winner,
      mode,
      difficulty,
      drop,
      scores,
      setScore,
      setGameOver,
    ],
  );

  const reset = useCallback(() => {
    setBoard(createBoard());
    setTurn(P1);
    setWinner(null);
    setWinCells([]);
    setGameOver(false);
  }, [setGameOver]);

  const isWinCell = (r, c) => winCells.some(([wr, wc]) => wr === r && wc === c);

  return (
    <SWrapper>
      <SOptions>
        <SOptRow>
          {["ai", "human"].map((m) => (
            <SOptBtn
              key={m}
              $active={mode === m}
              onClick={() => {
                setMode(m);
                reset();
              }}
            >
              {m === "ai" ? "vs AI" : "vs Human"}
            </SOptBtn>
          ))}
        </SOptRow>
        {mode === "ai" && (
          <SOptRow>
            {["Easy", "Medium", "Hard"].map((d) => (
              <SOptBtn
                key={d}
                $active={difficulty === d}
                onClick={() => {
                  setDifficulty(d);
                  reset();
                }}
              >
                {d}
              </SOptBtn>
            ))}
          </SOptRow>
        )}
      </SOptions>
      <SScoreRow>
        <SPlayerScore $color={PLAYER1_COLOR}>P1: {scores.P1}</SPlayerScore>
        <SStatus>{winner ? `${winner} wins!` : `${turn}'s turn`}</SStatus>
        <SPlayerScore $color={PLAYER2_COLOR}>P2: {scores.P2}</SPlayerScore>
      </SScoreRow>
      <SGrid>
        {[...Array(COLS)].map((_, c) => (
          <SColBtn key={c} onClick={() => handleDrop(c)}>
            ▼
          </SColBtn>
        ))}
        {board.map((row, r) =>
          row.map((cell, c) => (
            <SDisc
              key={`${r}-${c}`}
              $player={cell}
              $win={isWinCell(r, c)}
              onClick={() => handleDrop(c)}
            />
          )),
        )}
      </SGrid>
      {winner && <SBtn onClick={reset}>New Game</SBtn>}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
`;
const SOptRow = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  justify-content: center;
`;
const SOptBtn = styled.button`
  background: ${(p) => (p.$active ? theme.colors.accent : "transparent")};
  border: 1px solid
    ${(p) => (p.$active ? theme.colors.accent : theme.colors.border)};
  color: ${(p) => (p.$active ? "#fff" : theme.colors.textMuted)};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${(p) => (p.$active ? "#fff" : theme.colors.accent)};
  }
`;
const SScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SPlayerScore = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) => p.$color};
`;
const SStatus = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${COLS}, 52px);
  gap: 4px;
  background: ${theme.colors.surfaceAlt};
  padding: 8px;
  border-radius: ${theme.radius.md};
  border: 1px solid ${theme.colors.border};
`;
const SColBtn = styled.button`
  height: 24px;
  background: transparent;
  border: none;
  color: ${theme.colors.textMuted};
  font-size: 0.7rem;
  cursor: pointer;
  transition: color 100ms;
  &:hover {
    color: ${theme.colors.accent};
  }
`;
const SDisc = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${(p) =>
    p.$player === P1
      ? PLAYER1_COLOR
      : p.$player === P2
        ? PLAYER2_COLOR
        : theme.colors.bg};
  border: ${(p) =>
    p.$win
      ? `3px solid ${theme.colors.warning}`
      : `2px solid ${theme.colors.border}`};
  cursor: pointer;
  transition: background 100ms;
`;
const SBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
