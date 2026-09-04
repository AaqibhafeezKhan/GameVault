import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function minimax(board, isMax, depth, alpha, beta, difficulty) {
  const result = checkWinner(board);
  if (result) return result.winner === "O" ? 10 - depth : depth - 10;
  if (board.every(Boolean)) return 0;
  if (difficulty === "Easy" && Math.random() < 0.4) {
    const empty = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = isMax ? "O" : "X";
    const score = minimax(board, !isMax, depth + 1, alpha, beta, difficulty);
    board[i] = null;
    if (isMax) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function getBestMove(board, difficulty) {
  let bestScore = -Infinity,
    bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = "O";
    if (difficulty === "Easy" && Math.random() < 0.5) {
      board[i] = null;
      bestMove = i;
      break;
    }
    const score = minimax(board, false, 0, -Infinity, Infinity, difficulty);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

export default function TicTacToe() {
  const { setScore, soundEnabled } = useGameShell();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [mode, setMode] = useState("ai");
  const [difficulty, setDifficulty] = useState("Medium");
  const [status, setStatus] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [wins, setWins] = useState({ X: 0, O: 0, D: 0 });

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setStatus(null);
    setWinLine([]);
  }, []);

  const handleClick = useCallback(
    (idx) => {
      if (status || board[idx]) return;
      const newBoard = [...board];
      const player = isXTurn ? "X" : "O";
      newBoard[idx] = player;
      const result = checkWinner(newBoard);

      if (result) {
        setWinLine(result.line);
        setStatus(`${result.winner} wins!`);
        setWins((w) => {
          const next = { ...w, [result.winner]: w[result.winner] + 1 };
          setScore(next.X * 10);
          return next;
        });
        setBoard(newBoard);
        return;
      }
      if (newBoard.every(Boolean)) {
        setStatus("Draw!");
        setWins((w) => ({ ...w, D: w.D + 1 }));
        setBoard(newBoard);
        return;
      }

      setBoard(newBoard);
      setIsXTurn((prev) => !prev);

      if (mode === "ai" && isXTurn) {
        setTimeout(() => {
          const aiMove = getBestMove([...newBoard], difficulty);
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = "O";
          const aiResult = checkWinner(aiBoard);
          if (aiResult) {
            setWinLine(aiResult.line);
            setStatus("O wins!");
            setWins((w) => ({ ...w, O: w.O + 1 }));
          } else if (aiBoard.every(Boolean)) {
            setStatus("Draw!");
            setWins((w) => ({ ...w, D: w.D + 1 }));
          } else {
            setIsXTurn(true);
          }
          setBoard(aiBoard);
        }, 300);
      }
    },
    [board, isXTurn, mode, status, difficulty, setScore],
  );

  return (
    <SWrapper>
      <SOptions>
        <SOptRow>
          <SLabel>Mode</SLabel>
          {["ai", "human"].map((m) => (
            <SOptBtn
              key={m}
              $active={mode === m}
              onClick={() => {
                setMode(m);
                resetBoard();
              }}
            >
              {m === "ai" ? "vs AI" : "vs Human"}
            </SOptBtn>
          ))}
        </SOptRow>
        {mode === "ai" && (
          <SOptRow>
            <SLabel>Difficulty</SLabel>
            {["Easy", "Medium", "Hard"].map((d) => (
              <SOptBtn
                key={d}
                $active={difficulty === d}
                onClick={() => {
                  setDifficulty(d);
                  resetBoard();
                }}
              >
                {d}
              </SOptBtn>
            ))}
          </SOptRow>
        )}
      </SOptions>
      <SScoreBoard>
        <SScoreItem>
          X <SScoreNum>{wins.X}</SScoreNum>
        </SScoreItem>
        <SScoreItem>
          Draw <SScoreNum>{wins.D}</SScoreNum>
        </SScoreItem>
        <SScoreItem>
          O <SScoreNum>{wins.O}</SScoreNum>
        </SScoreItem>
      </SScoreBoard>
      <SGrid>
        {board.map((cell, i) => (
          <SCell
            key={i}
            onClick={() => handleClick(i)}
            $win={winLine.includes(i)}
            $player={cell}
            disabled={!!status || !!cell}
          >
            {cell}
          </SCell>
        ))}
      </SGrid>
      <SStatus>{status || `${isXTurn ? "X" : "O"}'s turn`}</SStatus>
      {status && <SBtn onClick={resetBoard}>Play Again</SBtn>}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
  padding: ${theme.space[4]}px;
`;

const SOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
`;

const SOptRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]}px;
`;

const SLabel = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
  min-width: 70px;
`;

const SOptBtn = styled.button`
  background: ${(props) =>
    props.$active ? theme.colors.accent : "transparent"};
  border: 1px solid
    ${(props) => (props.$active ? theme.colors.accent : theme.colors.border)};
  color: ${(props) => (props.$active ? "#fff" : theme.colors.textMuted)};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;

const SScoreBoard = styled.div`
  display: flex;
  gap: ${theme.space[5]}px;
`;

const SScoreItem = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  display: flex;
  gap: ${theme.space[2]}px;
  align-items: center;
`;

const SScoreNum = styled.span`
  color: ${theme.colors.accent};
  font-size: 1.2rem;
`;

const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  background: ${theme.colors.border};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  overflow: hidden;
`;

const SCell = styled.button`
  width: 100px;
  height: 100px;
  background: ${(props) =>
    props.$win ? theme.colors.accent + "33" : theme.colors.surface};
  border: none;
  font-family: ${theme.font.display};
  font-size: 3rem;
  font-weight: 700;
  color: ${(props) =>
    props.$player === "X" ? theme.colors.accentAlt : theme.colors.accent};
  cursor: pointer;
  transition: background 150ms ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) {
    background: ${theme.colors.surfaceAlt};
  }
  &:disabled {
    cursor: default;
  }
`;

const SStatus = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${theme.colors.text};
`;

const SBtn = styled.button`
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
