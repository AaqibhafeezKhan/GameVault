import { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { SENTENCES } from "../../utils/wordBank";
import { useTimer } from "../../hooks/useTimer";

const GAME_DURATION = 60;

export default function TypingSpeed() {
  const [started, setStarted] = useState(false);
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef(null);
  const { setScore, setGameOver } = useGameShell();
  const {
    elapsed,
    start: startTimer,
    stop: stopTimer,
  } = useTimer(true, GAME_DURATION);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  useEffect(() => {
    if (elapsed === 0 && started) {
      stopTimer();
      setScore(wpm);
      setGameOver(true);
    }
  }, [elapsed, started, wpm, stopTimer, setScore, setGameOver]);

  const begin = useCallback(() => {
    const p = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    setPassage(p);
    setTyped("");
    setWpm(0);
    setAccuracy(100);
    setStarted(true);
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [startTimer]);

  const handleInput = useCallback(
    (e) => {
      const pasted = e.nativeEvent?.inputType?.startsWith("insertFromPaste");
      if (pasted) {
        e.target.value = typed;
        return;
      }

      const val = e.target.value;
      setTyped(val);

      const elapsed = GAME_DURATION - elapsedRef.current + 1;
      const minutes = elapsed / 60;
      const correct = val.split("").filter((ch, i) => ch === passage[i]).length;
      const totalTyped = val.length;
      const acc =
        totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
      const words = val.slice(0, correct).split(" ").length;
      const newWpm = Math.round(words / minutes);
      setWpm(newWpm);
      setAccuracy(acc);
      setScore(newWpm);

      if (val === passage) {
        stopTimer();
        setScore(newWpm);
        setGameOver(true);
      }
    },
    [passage, typed, stopTimer, setScore, setGameOver],
  );

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Typing Speed Test</SDiffTitle>
        <SDiffDesc>
          Type the passage as fast and accurately as possible. 60 seconds!
        </SDiffDesc>
        <SDiffBtn onClick={() => begin()}>Start Typing</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SStats>
        <SStat>
          <SStatNum>{wpm}</SStatNum>
          <SStatLabel>WPM</SStatLabel>
        </SStat>
        <SStat>
          <SStatNum>{accuracy}%</SStatNum>
          <SStatLabel>ACCURACY</SStatLabel>
        </SStat>
        <SStat>
          <SStatNum $warn={elapsed <= 10}>{elapsed}</SStatNum>
          <SStatLabel>SECONDS</SStatLabel>
        </SStat>
      </SStats>
      <SPassage>
        {passage.split("").map((char, i) => {
          const state =
            i >= typed.length
              ? "pending"
              : typed[i] === char
                ? "correct"
                : "wrong";
          const isCurrent = i === typed.length;
          return (
            <SChar key={i} $state={state} $cursor={isCurrent}>
              {char}
            </SChar>
          );
        })}
      </SPassage>
      <SInput
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        onPaste={(e) => e.preventDefault()}
        placeholder="Start typing..."
        id="typing-input"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />
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
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[6]}px;
  font-family: ${theme.font.mono};
  font-size: 1rem;
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
  max-width: 640px;
  width: 100%;
`;
const SStats = styled.div`
  display: flex;
  gap: ${theme.space[6]}px;
`;
const SStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const SStatNum = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.6rem;
  font-weight: 600;
  color: ${(p) => (p.$warn ? theme.colors.danger : theme.colors.accent)};
`;
const SStatLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.1em;
`;
const SPassage = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  line-height: 1.8;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  padding: ${theme.space[4]}px;
  width: 100%;
  word-break: break-word;
`;
const SChar = styled.span`
  background: ${(p) =>
    p.$cursor ? theme.colors.accent + "44" : "transparent"};
  color: ${(p) =>
    p.$state === "correct"
      ? theme.colors.success
      : p.$state === "wrong"
        ? theme.colors.danger
        : theme.colors.textMuted};
  border-bottom: ${(p) =>
    p.$cursor ? `2px solid ${theme.colors.accent}` : "none"};
`;
const SInput = styled.input`
  width: 100%;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  padding: ${theme.space[3]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 1rem;
  outline: none;
  transition: border-color 150ms ease-out;
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;
