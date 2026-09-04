import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { generateSudoku, validateSudoku } from "../../utils/sudokuGenerator";
import { useTimer } from "../../hooks/useTimer";

const CLUES = { Easy: 36, Medium: 28, Hard: 22 };

export default function Sudoku() {
  const [difficulty, setDifficulty] = useState(null);
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const { setScore, setGameOver } = useGameShell();
  const { elapsed, start: startTimer } = useTimer();

  const startGame = useCallback(
    (diff) => {
      const { puzzle, solution: sol } = generateSudoku(CLUES[diff]);
      const fixedCells = puzzle.map((row) => row.map((v) => v !== 0));
      setDifficulty(diff);
      setBoard(puzzle.map((row) => [...row]));
      setSolution(sol);
      setFixed(fixedCells);
      setConflicts(Array.from({ length: 9 }, () => Array(9).fill(false)));
      setSelected(null);
      setScore(0);
      startTimer();
    },
    [setScore, startTimer],
  );

  const handleCellClick = useCallback((r, c) => {
    setSelected([r, c]);
  }, []);

  const handleKey = useCallback(
    (e) => {
      if (!selected) return;
      const [r, c] = selected;
      if (fixed[r]?.[c]) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = num;
        setBoard(newBoard);
        setConflicts(validateSudoku(newBoard));
        const complete = newBoard.every((row, ri) =>
          row.every((val, ci) => val === solution[ri][ci]),
        );
        if (complete) {
          const pts = Math.max(0, 1000 - elapsed * 2);
          setScore(pts);
          setGameOver(true);
        }
      }
      if (e.key === "Backspace" || e.key === "0" || e.key === "Delete") {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = 0;
        setBoard(newBoard);
        setConflicts(validateSudoku(newBoard));
      }
    },
    [selected, fixed, board, solution, elapsed, setScore, setGameOver],
  );

  const hint = useCallback(() => {
    if (!board.length) return;
    const empty = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (board[r][c] === 0) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    setConflicts(validateSudoku(newBoard));
    setScore((s) => Math.max(0, s - 50));
  }, [board, solution, setScore]);

  const isSelected = (r, c) =>
    selected && selected[0] === r && selected[1] === c;
  const isSameNum = (r, c) =>
    selected &&
    board[r][c] !== 0 &&
    board[r][c] === board[selected[0]][selected[1]];
  const isRelated = (r, c) =>
    selected &&
    (r === selected[0] ||
      c === selected[1] ||
      (Math.floor(r / 3) === Math.floor(selected[0] / 3) &&
        Math.floor(c / 3) === Math.floor(selected[1] / 3)));

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Sudoku</SDiffTitle>
        <SDiffDesc>
          Fill every row, column, and 3×3 box with numbers 1-9
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => startGame(d)}>
              {d} ({CLUES[d]} clues)
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper onKeyDown={handleKey} tabIndex={0}>
      <SGrid>
        {board.map((row, r) =>
          row.map((val, c) => (
            <SCell
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              $selected={isSelected(r, c)}
              $related={isRelated(r, c)}
              $sameNum={isSameNum(r, c)}
              $conflict={conflicts[r]?.[c]}
              $fixed={fixed[r]?.[c]}
              $borderRight={c % 3 === 2 && c !== 8}
              $borderBottom={r % 3 === 2 && r !== 8}
            >
              {val || ""}
            </SCell>
          )),
        )}
      </SGrid>
      <SNumpad>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <SNumBtn
            key={n}
            onClick={() => {
              if (!selected || fixed[selected[0]]?.[selected[1]]) return;
              const newBoard = board.map((row) => [...row]);
              newBoard[selected[0]][selected[1]] = n;
              setBoard(newBoard);
              setConflicts(validateSudoku(newBoard));
            }}
          >
            {n}
          </SNumBtn>
        ))}
        <SNumBtn
          onClick={() => {
            if (!selected || fixed[selected[0]]?.[selected[1]]) return;
            const newBoard = board.map((row) => [...row]);
            newBoard[selected[0]][selected[1]] = 0;
            setBoard(newBoard);
            setConflicts(validateSudoku(newBoard));
          }}
        >
          ✕
        </SNumBtn>
      </SNumpad>
      <SActions>
        <SHintBtn onClick={hint}>Hint (-50pts)</SHintBtn>
        <STimer>Time: {elapsed}s</STimer>
      </SActions>
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
  gap: ${theme.space[3]}px;
  outline: none;
`;
const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 44px);
  border: 2px solid ${theme.colors.textMuted};
`;
const SCell = styled.div`
  width: 44px;
  height: 44px;
  background: ${(p) =>
    p.$selected
      ? theme.colors.accent + "33"
      : p.$conflict
        ? theme.colors.danger + "22"
        : p.$sameNum
          ? theme.colors.accent + "22"
          : p.$related
            ? theme.colors.surfaceAlt
            : theme.colors.surface};
  border-right: ${(p) =>
    p.$borderRight
      ? `2px solid ${theme.colors.textMuted}`
      : `1px solid ${theme.colors.border}`};
  border-bottom: ${(p) =>
    p.$borderBottom
      ? `2px solid ${theme.colors.textMuted}`
      : `1px solid ${theme.colors.border}`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  cursor: pointer;
  color: ${(p) =>
    p.$conflict
      ? theme.colors.danger
      : p.$fixed
        ? theme.colors.text
        : theme.colors.accent};
  font-weight: ${(p) => (p.$fixed ? "700" : "400")};
  transition: background 100ms ease-out;
`;
const SNumpad = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 400px;
`;
const SNumBtn = styled.button`
  width: 38px;
  height: 38px;
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 100ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
const SActions = styled.div`
  display: flex;
  gap: ${theme.space[4]}px;
  align-items: center;
`;
const SHintBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.warning};
  color: ${theme.colors.warning};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.warning}22;
  }
`;
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
