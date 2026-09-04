import { useState, useCallback, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const SYMBOLS = [
  "★",
  "♠",
  "♥",
  "♦",
  "♣",
  "☀",
  "☽",
  "⚡",
  "♫",
  "❤",
  "✿",
  "◆",
  "▲",
  "●",
  "■",
  "◀",
  "▶",
  "☎",
  "✈",
  "♘",
  "✨",
  "⚽",
  "⚓",
  "⚑",
];
const GRID_SIZES = { Easy: 4, Medium: 6, Hard: 8 };

function buildDeck(gridSize) {
  const total = (gridSize * gridSize) / 2;
  const deck = [];
  for (let i = 0; i < total; i++) {
    const sym = SYMBOLS[i % SYMBOLS.length];
    deck.push({ id: i * 2, sym, matched: false, flipped: false });
    deck.push({ id: i * 2 + 1, sym, matched: false, flipped: false });
  }
  return deck.sort(() => Math.random() - 0.5);
}

export default function MemoryGame() {
  const [gridSize, setGridSize] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(
    (size) => {
      setGridSize(size);
      setCards(buildDeck(size));
      setFlipped([]);
      setMoves(0);
      setMatches(0);
      setLocked(false);
      setScore(0);
    },
    [setScore],
  );

  const handleFlip = useCallback(
    (idx) => {
      if (locked || cards[idx].flipped || cards[idx].matched) return;
      const newCards = cards.map((c, i) =>
        i === idx ? { ...c, flipped: true } : c,
      );
      const newFlipped = [...flipped, idx];
      setCards(newCards);
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setLocked(true);
        setMoves((m) => m + 1);
        const [a, b] = newFlipped;
        if (newCards[a].sym === newCards[b].sym) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === a || i === b ? { ...c, matched: true } : c,
              ),
            );
            const newMatches = matches + 1;
            setMatches(newMatches);
            const total = (gridSize * gridSize) / 2;
            const scoreVal = Math.max(0, (total - moves) * 10);
            setScore(scoreVal);
            if (newMatches === total) setGameOver(true);
            setFlipped([]);
            setLocked(false);
          }, 400);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === a || i === b ? { ...c, flipped: false } : c,
              ),
            );
            setFlipped([]);
            setLocked(false);
          }, 1000);
        }
      }
    },
    [locked, cards, flipped, matches, gridSize, moves, setScore, setGameOver],
  );

  if (!gridSize) {
    return (
      <SDiffScreen>
        <SDiffTitle>Memory Game</SDiffTitle>
        <SDiffDesc>Choose difficulty (grid size)</SDiffDesc>
        <SDiffButtons>
          {[
            ["Easy", "4×4"],
            ["Medium", "6×6"],
            ["Hard", "8×8"],
          ].map(([d, label]) => (
            <SDiffBtn key={d} onClick={() => start(GRID_SIZES[d])}>
              {d} — {label}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SStats>
        <SStat>
          Moves: <SStatVal>{moves}</SStatVal>
        </SStat>
        <SStat>
          Matches:{" "}
          <SStatVal>
            {matches}/{(gridSize * gridSize) / 2}
          </SStatVal>
        </SStat>
      </SStats>
      <SGrid $size={gridSize}>
        {cards.map((card, idx) => (
          <SCardWrapper key={card.id} onClick={() => handleFlip(idx)}>
            <SCardInner $flipped={card.flipped || card.matched}>
              <SCardBack />
              <SCardFront $matched={card.matched}>{card.sym}</SCardFront>
            </SCardInner>
          </SCardWrapper>
        ))}
      </SGrid>
      <SRestartBtn onClick={() => start(gridSize)}>Restart</SRestartBtn>
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
  flex-wrap: wrap;
  justify-content: center;
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

const SStats = styled.div`
  display: flex;
  gap: ${theme.space[5]}px;
`;

const SStat = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;

const SStatVal = styled.span`
  color: ${theme.colors.accent};
`;

const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$size}, 1fr);
  gap: 6px;
  max-width: min(90vw, 560px);
`;

const SCardWrapper = styled.div`
  aspect-ratio: 1;
  cursor: pointer;
  perspective: 600px;
`;

const SCardInner = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 300ms ease-out;
  transform: ${(p) => (p.$flipped ? "rotateY(180deg)" : "rotateY(0deg)")};
`;

const SCardBack = styled.div`
  position: absolute;
  inset: 0;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  color: ${theme.colors.border};
  &::after {
    content: "?";
  }
`;

const SCardFront = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.$matched ? theme.colors.accent + "22" : theme.colors.surfaceAlt};
  border: 1px solid
    ${(p) => (p.$matched ? theme.colors.accent : theme.colors.border)};
  border-radius: ${theme.radius.sm};
  backface-visibility: hidden;
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
`;
const SRestartBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
