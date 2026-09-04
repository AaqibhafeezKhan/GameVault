import { useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useSound } from "../../hooks/useSound";

const BUTTON_COLORS = ["#fc5c7d", "#3ef0a1", "#7c5cfc", "#f0c93e"];
const BUTTON_LABELS = ["Red", "Green", "Blue", "Yellow"];
const BUTTON_FREQS = [262, 330, 392, 523];
const FLASH_DURATION_MS = 400;

function generateSequence(prev) {
  return [...prev, Math.floor(Math.random() * 4)];
}

export default function SimonSays() {
  const [sequence, setSequence] = useState([]);
  const [playerSeq, setPlayerSeq] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [lit, setLit] = useState(-1);
  const [difficulty, setDifficulty] = useState(null);
  const { setScore, setGameOver, soundEnabled } = useGameShell();
  const { playTone } = useSound(soundEnabled);
  const timeoutRefs = useRef([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const playSequence = useCallback(
    (seq) => {
      setPhase("showing");
      setPlayerSeq([]);
      let delay = 500;
      seq.forEach((btn, i) => {
        const t1 = setTimeout(() => {
          setLit(btn);
          playTone(BUTTON_FREQS[btn], 0.3);
        }, delay);
        const t2 = setTimeout(() => setLit(-1), delay + FLASH_DURATION_MS);
        timeoutRefs.current.push(t1, t2);
        delay += FLASH_DURATION_MS + 200;
      });
      const t3 = setTimeout(() => setPhase("input"), delay);
      timeoutRefs.current.push(t3);
    },
    [playTone],
  );

  const startGame = useCallback(
    (diff) => {
      setDifficulty(diff);
      clearTimeouts();
      const seq = generateSequence([]);
      setSequence(seq);
      setScore(0);
      playSequence(seq);
    },
    [playSequence, setScore],
  );

  const handlePress = useCallback(
    (btn) => {
      if (phase !== "input") return;
      const newPlayer = [...playerSeq, btn];
      const idx = newPlayer.length - 1;
      playTone(BUTTON_FREQS[btn], 0.2);

      if (newPlayer[idx] !== sequence[idx]) {
        setPhase("idle");
        setGameOver(true);
        return;
      }

      if (newPlayer.length === sequence.length) {
        if (difficulty === "Hard") {
          setPhase("idle");
        }
        const nextSeq = generateSequence(sequence);
        const newScore = nextSeq.length - 1;
        setScore(newScore);
        setSequence(nextSeq);
        setPlayerSeq([]);
        const t = setTimeout(() => playSequence(nextSeq), 800);
        timeoutRefs.current.push(t);
      } else {
        setPlayerSeq(newPlayer);
      }
    },
    [
      phase,
      playerSeq,
      sequence,
      difficulty,
      playTone,
      setScore,
      setGameOver,
      playSequence,
    ],
  );

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Simon Says</SDiffTitle>
        <SDiffDesc>Watch the sequence, then repeat it!</SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => startGame(d)}>
              {d}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SPhaseLabel>
        {phase === "showing"
          ? "Watch..."
          : phase === "input"
            ? "Your turn!"
            : ""}
      </SPhaseLabel>
      <SLength>Sequence length: {sequence.length}</SLength>
      <SButtonGrid>
        {BUTTON_COLORS.map((color, i) => (
          <SSimonBtn
            key={i}
            $color={color}
            $lit={lit === i}
            onClick={() => handlePress(i)}
            disabled={phase !== "input"}
          >
            {BUTTON_LABELS[i]}
          </SSimonBtn>
        ))}
      </SButtonGrid>
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
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
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
const SPhaseLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${theme.colors.textMuted};
  min-height: 1.5em;
`;
const SLength = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;
const litAnim = keyframes`
  0%   { opacity: 1; filter: brightness(2); }
  100% { opacity: 0.5; filter: brightness(1); }
`;
const SSimonBtn = styled.button`
  width: 130px;
  height: 130px;
  background: ${(p) => (p.$lit ? p.$color : p.$color + "44")};
  border: 2px solid ${(p) => p.$color};
  border-radius: ${theme.radius.md};
  font-family: ${theme.font.display};
  font-size: 1rem;
  font-weight: 500;
  color: ${(p) => (p.$lit ? "#0a0a0f" : p.$color)};
  cursor: pointer;
  transition:
    background 100ms ease-out,
    color 100ms ease-out;
  &:hover:not(:disabled) {
    background: ${(p) => p.$color + "88"};
  }
  &:disabled {
    cursor: default;
  }
`;
