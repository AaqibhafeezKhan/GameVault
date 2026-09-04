import { useState, useCallback, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const COLORS = [
  { id: 0, hex: "#fc5c7d", label: "Red" },
  { id: 1, hex: "#f0c93e", label: "Yellow" },
  { id: 2, hex: "#3ef0a1", label: "Green" },
  { id: 3, hex: "#5cc8fc", label: "Blue" },
  { id: 4, hex: "#7c5cfc", label: "Purple" },
  { id: 5, hex: "#fc9c5c", label: "Orange" },
];

export default function SimonColorExt() {
  const [sequence, setSequence] = useState([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle, showing, input, gameover
  const [activeBtn, setActiveBtn] = useState(null);
  const { setScore, setGameOver } = useGameShell();

  const startRound = useCallback((newSeq) => {
    setSequence(newSeq);
    setPhase("showing");
    setPlayerIdx(0);
    let idx = 0;

    // Recursive timeout for precise sequencing
    const showNext = () => {
      if (idx >= newSeq.length) {
        setActiveBtn(null);
        setPhase("input");
        return;
      }
      setActiveBtn(newSeq[idx]);
      setTimeout(() => {
        setActiveBtn(null);
        idx++;
        setTimeout(showNext, 200); // Brief gap between flashing same color twice
      }, 500); // Flash duration
    };

    setTimeout(showNext, 600); // Initial delay
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setGameOver(false);
    const firstColor = Math.floor(Math.random() * COLORS.length);
    startRound([firstColor]);
  }, [setScore, setGameOver, startRound]);

  const handleInput = useCallback(
    (colorId) => {
      if (phase !== "input") return;

      // Visual feedback
      setActiveBtn(colorId);
      setTimeout(() => setActiveBtn(null), 200);

      if (colorId === sequence[playerIdx]) {
        // Correct
        const nextIdx = playerIdx + 1;
        setPlayerIdx(nextIdx);
        setScore((s) => s + 10);

        if (nextIdx === sequence.length) {
          setPhase("showing"); // Prevent early clicks
          setTimeout(() => {
            const nextColor = Math.floor(Math.random() * COLORS.length);
            startRound([...sequence, nextColor]);
          }, 800);
        }
      } else {
        // Wrong
        setPhase("gameover");
        setGameOver(true);
      }
    },
    [phase, sequence, playerIdx, setScore, setGameOver, startRound],
  );

  if (phase === "idle") {
    return (
      <SDiffScreen>
        <SDiffTitle>Simon Color Extended</SDiffTitle>
        <SDiffDesc>
          Watch the sequence of 6 colors and repeat it. No replays allowed!
        </SDiffDesc>
        <SDiffBtn onClick={start}>Start</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SInfo>Level: {sequence.length}</SInfo>
      <SBoard>
        {COLORS.map((c) => (
          <SButton
            key={c.id}
            $color={c.hex}
            $active={activeBtn === c.id}
            disabled={phase !== "input"}
            onClick={() => handleInput(c.id)}
          >
            <SButtonLabel>{c.label}</SButtonLabel>
          </SButton>
        ))}
      </SBoard>

      <SStatus>
        {phase === "showing"
          ? "👀 Watch..."
          : phase === "input"
            ? "👆 Your turn!"
            : "💥 Game Over"}
      </SStatus>

      {phase === "gameover" && <SNewBtn onClick={start}>Play Again</SNewBtn>}
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
  gap: ${theme.space[4]}px;
`;
const SInfo = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.2rem;
  color: ${theme.colors.text};
`;
const pulseAnim = keyframes`
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.5); }
  100% { transform: scale(1); filter: brightness(1); }
`;
const SBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.space[2]}px;
  background: ${theme.colors.surface};
  padding: ${theme.space[3]}px;
  border-radius: 50%;
  border: 4px solid ${theme.colors.border};
`;
const SButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid ${(p) => (p.$active ? "#fff" : p.$color)};
  background: ${(p) => p.$color}${(p) => (p.$active ? "ff" : "88")};
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  transition:
    background 150ms,
    border-color 150ms;
  box-shadow: ${(p) => (p.$active ? `0 0 20px ${p.$color}` : "none")};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const SButtonLabel = styled.span`
  opacity: 0;
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  color: #fff;
  pointer-events: none;
`;
const SStatus = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.4rem;
  color: ${theme.colors.accent};
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
