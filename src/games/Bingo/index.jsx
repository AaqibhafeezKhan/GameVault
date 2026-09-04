import { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useTimer } from "../../hooks/useTimer";

const COLS = 75;
const GAME_DURATION = 60;
const BINGO_SIZE = 5;

function generateCard() {
  const card = [];
  const colRanges = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];
  for (let c = 0; c < 5; c++) {
    const [lo, hi] = colRanges[c];
    const nums = [];
    while (nums.length < 5) {
      const n = lo + Math.floor(Math.random() * (hi - lo + 1));
      if (!nums.includes(n)) nums.push(n);
    }
    for (let r = 0; r < 5; r++) card.push({ n: nums[r], r, c, marked: false });
  }
  card[12].n = "FREE";
  card[12].marked = true;
  return card;
}

function checkBingo(card) {
  const marked = (r, c) => card.find((cl) => cl.r === r && cl.c === c)?.marked;
  for (let i = 0; i < 5; i++) {
    if ([0, 1, 2, 3, 4].every((j) => marked(i, j))) return true;
    if ([0, 1, 2, 3, 4].every((j) => marked(j, i))) return true;
  }
  if ([0, 1, 2, 3, 4].every((i) => marked(i, i))) return true;
  if ([0, 1, 2, 3, 4].every((i) => marked(i, 4 - i))) return true;
  return false;
}

export default function Bingo() {
  const [card, setCard] = useState(generateCard);
  const [bag, setBag] = useState(() =>
    Array.from({ length: COLS }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5,
    ),
  );
  const [drawn, setDrawn] = useState([]);
  const [current, setCurrent] = useState(null);
  const [bingo, setBingo] = useState(false);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
  } = useTimer(true, GAME_DURATION);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (elapsed === 0 && started && !bingo) {
      stopTimer();
      setGameOver(true);
    }
  }, [elapsed, started, bingo, stopTimer, setGameOver]);

  const begin = useCallback(() => {
    setCard(generateCard());
    const newBag = Array.from({ length: COLS }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5,
    );
    setBag(newBag);
    setDrawn([]);
    setCurrent(null);
    setBingo(false);
    setStarted(true);
    setScore(0);
    startTimer();
  }, [setScore, startTimer]);

  const drawNumber = useCallback(() => {
    if (!bag.length || bingo) return;
    const n = bag[0];
    const newBag = bag.slice(1);
    setBag(newBag);
    setDrawn((d) => [n, ...d]);
    setCurrent(n);
  }, [bag, bingo]);

  const markCell = useCallback(
    (idx) => {
      if (bingo || !card[idx].n || card[idx].n === "FREE") return;
      const num = card[idx].n;
      if (!drawn.includes(num)) return;
      const newCard = card.map((cl, i) =>
        i === idx ? { ...cl, marked: !cl.marked } : cl,
      );
      setCard(newCard);
      if (checkBingo(newCard)) {
        setBingo(true);
        stopTimer();
        setScore(Math.max(0, elapsed) * 5);
        setGameOver(true);
      }
    },
    [card, drawn, bingo, elapsed, setScore, stopTimer, setGameOver],
  );

  const LETTERS = "BINGO";

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Bingo</SDiffTitle>
        <SDiffDesc>
          Draw numbers and mark your card — get BINGO before time runs out!
        </SDiffDesc>
        <SDiffBtn onClick={begin}>Start Game</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <STopRow>
        <STimer $warn={elapsed <= 10}>{elapsed}s</STimer>
        <SDrawnCount>{drawn.length} numbers drawn</SDrawnCount>
      </STopRow>
      <SCurrentNumber>{current ? current : "—"}</SCurrentNumber>
      <SCard>
        <SHeaderRow>
          {LETTERS.split("").map((l) => (
            <SHeader key={l}>{l}</SHeader>
          ))}
        </SHeaderRow>
        {[0, 1, 2, 3, 4].map((r) => (
          <SRow key={r}>
            {[0, 1, 2, 3, 4].map((c) => {
              const cell = card.find((cl) => cl.r === r && cl.c === c);
              const isDrawn = cell.n === "FREE" || drawn.includes(cell.n);
              return (
                <SCell
                  key={c}
                  $marked={cell.marked}
                  $free={cell.n === "FREE"}
                  $callable={isDrawn && !cell.marked && cell.n !== "FREE"}
                  onClick={() => markCell(card.indexOf(cell))}
                >
                  {cell.n}
                </SCell>
              );
            })}
          </SRow>
        ))}
      </SCard>
      {bingo && <SBingo>🎉 BINGO!</SBingo>}
      <SRecentRow>
        {drawn.slice(0, 10).map((n, i) => (
          <SRecent key={i} $first={i === 0}>
            {n}
          </SRecent>
        ))}
      </SRecentRow>
      <SDrawBtn onClick={drawNumber} disabled={!bag.length || bingo}>
        Draw Number
      </SDrawBtn>
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
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[6]}px;
  font-family: ${theme.font.mono};
  font-size: 1rem;
  cursor: pointer;
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
const STopRow = styled.div`
  display: flex;
  gap: ${theme.space[4]}px;
  align-items: center;
`;
const STimer = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.textMuted)};
`;
const SDrawnCount = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SCurrentNumber = styled.div`
  font-family: ${theme.font.display};
  font-size: 3rem;
  font-weight: 700;
  color: ${theme.colors.accent};
`;
const SCard = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  padding: ${theme.space[2]}px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const SHeaderRow = styled.div`
  display: flex;
  gap: 2px;
`;
const SHeader = styled.div`
  width: 52px;
  height: 28px;
  background: ${theme.colors.accent}22;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-size: 1rem;
  font-weight: 700;
  color: ${theme.colors.accent};
`;
const SRow = styled.div`
  display: flex;
  gap: 2px;
`;
const SCell = styled.div`
  width: 52px;
  height: 44px;
  background: ${(p) =>
    p.$marked
      ? theme.colors.accent + "44"
      : p.$callable
        ? theme.colors.success + "22"
        : theme.colors.surfaceAlt};
  border: 1px solid
    ${(p) => (p.$marked ? theme.colors.accent : theme.colors.border)};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) =>
    p.$marked
      ? theme.colors.accent
      : p.$free
        ? theme.colors.success
        : theme.colors.text};
  cursor: pointer;
  transition: all 100ms;
  &:hover {
    border-color: ${theme.colors.accent};
  }
`;
const SBingo = styled.div`
  font-family: ${theme.font.display};
  font-size: 2rem;
  font-weight: 700;
  color: ${theme.colors.success};
`;
const SRecentRow = styled.div`
  display: flex;
  gap: ${theme.space[1]}px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 320px;
`;
const SRecent = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.72rem;
  color: ${(p) => (p.$first ? theme.colors.accent : theme.colors.textMuted)};
`;
const SDrawBtn = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`;
