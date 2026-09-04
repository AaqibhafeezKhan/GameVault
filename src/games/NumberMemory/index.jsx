import { useState, useCallback, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const START_DIGITS = 3;
const DISPLAY_MS = 800;
const LIVES = 3;

export default function NumberMemory() {
  const [phase, setPhase] = useState("idle");
  const [sequence, setSequence] = useState([]);
  const [displayIdx, setDisplayIdx] = useState(-1);
  const [input, setInput] = useState("");
  const [lives, setLives] = useState(LIVES);
  const [level, setLevel] = useState(START_DIGITS);
  const [feedback, setFeedback] = useState(null);
  const { setScore, setGameOver } = useGameShell();
  const timeoutRef = useRef(null);

  const generateSequence = useCallback((len) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
  }, []);

  const startRound = useCallback(
    (len) => {
      const seq = generateSequence(len);
      setSequence(seq);
      setPhase("showing");
      setDisplayIdx(0);
      setInput("");
      setFeedback(null);
      let i = 0;
      const showNext = () => {
        setDisplayIdx(i);
        i++;
        if (i < seq.length) {
          timeoutRef.current = setTimeout(showNext, DISPLAY_MS + 100);
        } else {
          timeoutRef.current = setTimeout(() => {
            setDisplayIdx(-1);
            setPhase("input");
          }, DISPLAY_MS + 100);
        }
      };
      timeoutRef.current = setTimeout(showNext, 400);
    },
    [generateSequence],
  );

  const start = useCallback(() => {
    setLives(LIVES);
    setLevel(START_DIGITS);
    setScore(0);
    setGameOver(false);
    startRound(START_DIGITS);
  }, [setScore, setGameOver, startRound]);

  const submit = useCallback(() => {
    if (phase !== "input") return;
    const correct = input === sequence.join("");
    if (correct) {
      setFeedback("correct");
      const newLevel = level + 1;
      setLevel(newLevel);
      setScore(newLevel - START_DIGITS);
      setTimeout(() => startRound(newLevel), 800);
    } else {
      setFeedback("wrong");
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 600);
      } else {
        setTimeout(() => startRound(level), 800);
      }
    }
    setPhase("feedback");
  }, [phase, input, sequence, level, lives, setScore, setGameOver, startRound]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <SWrapper>
      {phase === "idle" ? (
        <SDiffScreen>
          <SDiffTitle>Number Memory</SDiffTitle>
          <SDiffDesc>
            Watch the digits, then type the full sequence from memory!
          </SDiffDesc>
          <SDiffBtn onClick={start}>Start</SDiffBtn>
        </SDiffScreen>
      ) : (
        <>
          <SInfo>
            <SLevel>
              Level {level - START_DIGITS + 1} — {level} digits
            </SLevel>
            <SLives>{Array(lives).fill("♥").join(" ")}</SLives>
          </SInfo>
          <SDisplayBox>
            {phase === "showing" && displayIdx >= 0 ? (
              <SDigit key={displayIdx}>{sequence[displayIdx]}</SDigit>
            ) : phase === "input" ? (
              <SInputRow>
                <SInput
                  autoFocus
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value.replace(/\D/g, "").slice(0, level))
                  }
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={`Type ${level} digits`}
                  id="number-memory-input"
                />
                <SSubmit onClick={submit}>OK</SSubmit>
              </SInputRow>
            ) : phase === "feedback" ? (
              <SFeedback $ok={feedback === "correct"}>
                {feedback === "correct"
                  ? "✓ Correct!"
                  : `✗ Answer was: ${sequence.join("")}`}
              </SFeedback>
            ) : (
              <SWaiting>Get ready...</SWaiting>
            )}
          </SDisplayBox>
          {phase !== "idle" && (
            <SRestartBtn onClick={start}>Restart</SRestartBtn>
          )}
        </>
      )}
    </SWrapper>
  );
}

const digitFlash = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  20% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

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
  display: flex;
  gap: ${theme.space[5]}px;
  align-items: center;
`;
const SLevel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SLives = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.danger};
`;
const SDisplayBox = styled.div`
  width: 300px;
  height: 180px;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const SDigit = styled.div`
  font-family: ${theme.font.display};
  font-size: 6rem;
  font-weight: 700;
  color: ${theme.colors.accent};
  animation: ${digitFlash} ${DISPLAY_MS}ms ease-out;
`;
const SInputRow = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
`;
const SInput = styled.input`
  background: ${theme.colors.surfaceAlt};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  padding: ${theme.space[2]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 1.4rem;
  outline: none;
  width: 160px;
  text-align: center;
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;
const SSubmit = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${(p) => (p.$ok ? theme.colors.success : theme.colors.danger)};
  text-align: center;
`;
const SWaiting = styled.div`
  font-family: ${theme.font.mono};
  color: ${theme.colors.textMuted};
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
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
