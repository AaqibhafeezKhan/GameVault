import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

// Simplified checkers logic
const SIZE = 8;
const EMPTY = 0;
const RED = 1;
const BLACK = 2;
const RED_KING = 3;
const BLACK_KING = 4;

function initialBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = BLACK;
    }
  }
  for (let r = 5; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = RED;
    }
  }
  return board;
}

function getValidMoves(board, player) {
  const moves = [];
  const isKing = (piece) => piece === RED_KING || piece === BLACK_KING;
  const forward = player === RED ? -1 : 1;
  const dirs = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (
        piece === player ||
        (piece === RED_KING && player === RED) ||
        (piece === BLACK_KING && player === BLACK)
      ) {
        if (isKing(piece)) dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        else dirs.push([forward, -1], [forward, 1]);

        for (const [dr, dc] of dirs) {
          // Normal move
          let nr = r + dr,
            nc = c + dc;
          if (
            nr >= 0 &&
            nr < SIZE &&
            nc >= 0 &&
            nc < SIZE &&
            board[nr][nc] === EMPTY
          ) {
            moves.push({ from: [r, c], to: [nr, nc], jump: null });
          }
          // Jump move
          let jr = nr + dr,
            jc = nc + dc;
          if (
            jr >= 0 &&
            jr < SIZE &&
            jc >= 0 &&
            jc < SIZE &&
            board[jr][jc] === EMPTY &&
            board[nr][nc] !== EMPTY &&
            board[nr][nc] !== piece &&
            board[nr][nc] !== (player === RED ? RED_KING : BLACK_KING)
          ) {
            moves.push({ from: [r, c], to: [jr, jc], jump: [nr, nc] });
          }
        }
        dirs.length = 0;
      }
    }
  }
  // If jumps are available, must take a jump (simplified requirement)
  const jumps = moves.filter((m) => m.jump);
  return jumps.length > 0 ? jumps : moves;
}

function applyMove(board, move, player) {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[move.from[0]][move.from[1]];
  newBoard[move.from[0]][move.from[1]] = EMPTY;

  let newPiece = piece;
  // King promotion
  if (player === RED && move.to[0] === 0) newPiece = RED_KING;
  if (player === BLACK && move.to[0] === SIZE - 1) newPiece = BLACK_KING;

  newBoard[move.to[0]][move.to[1]] = newPiece;
  if (move.jump) newBoard[move.jump[0]][move.jump[1]] = EMPTY;
  return newBoard;
}

// Very basic random AI
function makeAiMove(board) {
  const moves = getValidMoves(board, BLACK);
  if (moves.length === 0) return null;
  // Pick jump if available, otherwise random
  const jumps = moves.filter((m) => m.jump);
  if (jumps.length > 0) return jumps[Math.floor(Math.random() * jumps.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

function checkWin(board) {
  let red = 0,
    black = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === RED || board[r][c] === RED_KING) red++;
      if (board[r][c] === BLACK || board[r][c] === BLACK_KING) black++;
    }
  }
  if (red === 0) return BLACK;
  if (black === 0) return RED;
  if (getValidMoves(board, RED).length === 0) return BLACK;
  if (getValidMoves(board, BLACK).length === 0) return RED;
  return null;
}

export default function Checkers() {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(RED); // RED is player
  const [winner, setWinner] = useState(null);
  const { setScore, setGameOver } = useGameShell();

  const validMoves = getValidMoves(board, RED);

  const handleSquareClick = useCallback(
    (r, c) => {
      if (winner || turn !== RED) return;

      const piece = board[r][c];

      // Select piece
      if (piece === RED || piece === RED_KING) {
        if (validMoves.some((m) => m.from[0] === r && m.from[1] === c)) {
          setSelected([r, c]);
        }
        return;
      }

      // Move piece
      if (selected && piece === EMPTY) {
        const move = validMoves.find(
          (m) =>
            m.from[0] === selected[0] &&
            m.from[1] === selected[1] &&
            m.to[0] === r &&
            m.to[1] === c,
        );
        if (move) {
          let newBoard = applyMove(board, move, RED);
          setBoard(newBoard);
          setSelected(null);
          setScore((s) => s + (move.jump ? 50 : 10));

          // Basic multi-jump check omitted for simplicity, turn passes immediately
          const winResult = checkWin(newBoard);
          if (winResult) {
            setWinner(winResult);
            if (winResult === RED) setScore((s) => s + 500);
            setGameOver(true);
          } else {
            setTurn(BLACK);
            setTimeout(() => {
              const aiMove = makeAiMove(newBoard);
              if (aiMove) {
                const boardAfterAi = applyMove(newBoard, aiMove, BLACK);
                setBoard(boardAfterAi);
                const nextWin = checkWin(boardAfterAi);
                if (nextWin) {
                  setWinner(nextWin);
                  setGameOver(true);
                } else {
                  setTurn(RED);
                }
              } else {
                setWinner(RED);
                setScore((s) => s + 500);
                setGameOver(true);
              }
            }, 600);
          }
        }
      }
    },
    [board, selected, turn, winner, validMoves, setScore, setGameOver],
  );

  const newGame = useCallback(() => {
    setBoard(initialBoard());
    setSelected(null);
    setTurn(RED);
    setWinner(null);
    setScore(0);
    setGameOver(false);
  }, [setScore, setGameOver]);

  return (
    <SWrapper>
      <SInfo>
        {winner
          ? winner === RED
            ? "🎉 You Win!"
            : "💻 AI Wins"
          : turn === RED
            ? "Your Turn (Red)"
            : "AI Turn (Black)"}
      </SInfo>
      <SBoard>
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected =
              selected && selected[0] === r && selected[1] === c;
            const isTarget =
              selected &&
              validMoves.some(
                (m) =>
                  m.from[0] === selected[0] &&
                  m.from[1] === selected[1] &&
                  m.to[0] === r &&
                  m.to[1] === c,
              );
            return (
              <SSquare
                key={`${r}-${c}`}
                $dark={isDark}
                onClick={() => handleSquareClick(r, c)}
              >
                {isTarget && <STargetIndicator />}
                {piece !== EMPTY && (
                  <SPiece
                    $player={piece === RED || piece === RED_KING ? RED : BLACK}
                    $selected={isSelected}
                  >
                    {(piece === RED_KING || piece === BLACK_KING) && "♔"}
                  </SPiece>
                )}
              </SSquare>
            );
          }),
        )}
      </SBoard>
      {winner && <SNewBtn onClick={newGame}>Play Again</SNewBtn>}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SInfo = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.5rem;
  color: ${theme.colors.text};
`;
const SBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${SIZE}, 40px);
  border: 4px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  overflow: hidden;
  @media (min-width: 500px) {
    grid-template-columns: repeat(${SIZE}, 50px);
  }
`;
const SSquare = styled.div`
  width: 40px;
  height: 40px;
  background: ${(p) => (p.$dark ? "#2a2a3d" : "#e8e8f0")};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  @media (min-width: 500px) {
    width: 50px;
    height: 50px;
  }
`;
const SPiece = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) =>
    p.$player === RED ? theme.colors.danger : theme.colors.surface};
  border: 2px solid
    ${(p) =>
      p.$selected
        ? theme.colors.warning
        : p.$player === RED
          ? "#aa2d45"
          : theme.colors.textMuted};
  box-shadow:
    inset 0 3px 5px rgba(255, 255, 255, 0.2),
    0 3px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #fff;
  transition: transform 150ms ease-out;
  transform: ${(p) => (p.$selected ? "scale(1.1)" : "scale(1)")};
  @media (min-width: 500px) {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
`;
const STargetIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${theme.colors.warning}88;
`;
const SNewBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
