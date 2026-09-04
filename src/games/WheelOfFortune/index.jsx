import { useState, useCallback, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { WHEEL_PHRASES } from "../../utils/triviaBank";

const SPIN_AMOUNTS = [
  200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 2000, 2500, 0,
];
const SEGMENTS = 14;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function pickPhrase() {
  return WHEEL_PHRASES[Math.floor(Math.random() * WHEEL_PHRASES.length)];
}

export default function WheelOfFortune() {
  const [phraseData, setPhraseData] = useState(null);
  const [guessed, setGuessed] = useState(new Set());
  const [purse, setPurse] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastSpin, setLastSpin] = useState(null);
  const [solved, setSolved] = useState(false);
  const [vowelMode, setVowelMode] = useState(false);
  const [angle, setAngle] = useState(0);
  const { setScore, setGameOver } = useGameShell();
  const animRef = useRef(null);

  const start = useCallback(() => {
    setPhraseData(pickPhrase());
    setGuessed(new Set());
    setPurse(0);
    setSpinning(false);
    setLastSpin(null);
    setSolved(false);
    setVowelMode(false);
    setScore(0);
    setGameOver(false);
  }, [setScore, setGameOver]);

  const spinWheel = useCallback(() => {
    if (spinning || solved) return;
    setSpinning(true);
    setVowelMode(false);
    const target = Math.random() * 360 * 5 + 720;
    const start = angle;
    const duration = 2500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const cur = start + target * eased;
      setAngle(cur);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const seg = Math.floor(((cur % 360) / 360) * SEGMENTS);
        const val = SPIN_AMOUNTS[seg % SPIN_AMOUNTS.length];
        setLastSpin(val);
        setSpinning(false);
        if (val > 0) setVowelMode(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [spinning, solved, angle]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const guessLetter = useCallback(
    (letter) => {
      if (!phraseData || solved || spinning) return;
      const VOWELS = "AEIOU";
      const isVowel = VOWELS.includes(letter);
      if (isVowel && purse < 250) return;
      if (!isVowel && lastSpin === 0) return;
      if (!isVowel && !lastSpin && !vowelMode) return;
      const newGuessed = new Set(guessed);
      newGuessed.add(letter);
      setGuessed(newGuessed);
      const phrase = phraseData.phrase.replace(/[^A-Z ]/g, "");
      const count = phrase.split("").filter((c) => c === letter).length;
      if (isVowel) setPurse((p) => Math.max(0, p - 250));
      else if (count > 0 && lastSpin > 0) {
        const earn = count * lastSpin;
        const newPurse = purse + earn;
        setPurse(newPurse);
        setScore(newPurse);
        setLastSpin(null);
      }
      const allRevealed = phrase
        .split("")
        .every((c) => c === " " || newGuessed.has(c));
      if (allRevealed) {
        setSolved(true);
        setScore(purse);
        setGameOver(true);
      }
    },
    [
      phraseData,
      solved,
      spinning,
      guessed,
      lastSpin,
      purse,
      vowelMode,
      setScore,
      setGameOver,
    ],
  );

  const VOWELS = "AEIOU";

  if (!phraseData) {
    return (
      <SDiffScreen>
        <SDiffTitle>Wheel of Fortune</SDiffTitle>
        <SDiffDesc>
          Spin the wheel, then guess consonants to earn money. Pay $250 to buy a
          vowel!
        </SDiffDesc>
        <SDiffBtn onClick={start}>Start Game</SDiffBtn>
      </SDiffScreen>
    );
  }

  const phrase = phraseData.phrase.replace(/[^A-Z ]/g, "");

  return (
    <SWrapper>
      <SHint>Hint: {phraseData.hint}</SHint>
      <SWheelOuter>
        <SWheel style={{ transform: `rotate(${angle}deg)` }}>
          {SPIN_AMOUNTS.slice(0, SEGMENTS).map((val, i) => (
            <SSegLabel
              key={i}
              style={{
                transform: `rotate(${(i / SEGMENTS) * 360}deg)`,
                position: "absolute",
                top: 8,
                left: "50%",
                transformOrigin: "0 80px",
              }}
            >
              {val === 0 ? "BANKRUPT" : `$${val}`}
            </SSegLabel>
          ))}
        </SWheel>
        <SPointer>▼</SPointer>
      </SWheelOuter>
      {lastSpin !== null && (
        <SSpinResult $bankrupt={lastSpin === 0}>
          {lastSpin === 0 ? "💀 BANKRUPT!" : `$${lastSpin} — pick a consonant`}
        </SSpinResult>
      )}
      <SPurse>Purse: ${purse}</SPurse>
      <SPhrase>
        {phrase.split("").map((c, i) => (
          <SLetterBox key={i} $space={c === " "}>
            {c === " " ? "\u00A0" : guessed.has(c) ? c : "_"}
          </SLetterBox>
        ))}
      </SPhrase>
      <SLetters>
        {LETTERS.map((l) => {
          const isVowel = VOWELS.includes(l);
          const disabled =
            guessed.has(l) ||
            spinning ||
            solved ||
            (isVowel && purse < 250) ||
            (!isVowel && (lastSpin === null || lastSpin === 0));
          return (
            <SLetterBtn
              key={l}
              $used={guessed.has(l)}
              $vowel={isVowel}
              disabled={disabled}
              onClick={() => guessLetter(l)}
            >
              {l}
            </SLetterBtn>
          );
        })}
      </SLetters>
      <SActions>
        <SSpinBtn
          onClick={spinWheel}
          disabled={spinning || solved || (lastSpin !== null && lastSpin !== 0)}
        >
          {spinning ? "Spinning..." : "Spin Wheel"}
        </SSpinBtn>
        {solved && <SNewBtn onClick={start}>New Puzzle</SNewBtn>}
      </SActions>
    </SWrapper>
  );
}

const spinAnim = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

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
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SHint = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
`;
const SWheelOuter = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const SWheel = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: conic-gradient(
    #fc5c7d,
    #f0c93e,
    #7c5cfc,
    #3ef0a1,
    #fc9c5c,
    #5cc8fc,
    #fc5c7d,
    #f0c93e,
    #7c5cfc,
    #3ef0a1,
    #fc9c5c,
    #5cc8fc,
    #2a2a3d,
    #fc5c7d
  );
  transition: transform 100ms ease-out;
  position: relative;
`;
const SSegLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.45rem;
  color: #0a0a0f;
  font-weight: 700;
  white-space: nowrap;
`;
const SPointer = styled.div`
  position: absolute;
  top: -14px;
  font-size: 1.2rem;
  color: ${theme.colors.text};
`;
const SSpinResult = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) => (p.$bankrupt ? theme.colors.danger : theme.colors.success)};
`;
const SPurse = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${theme.colors.warning};
`;
const SPhrase = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  max-width: 540px;
`;
const SLetterBox = styled.div`
  width: ${(p) => (p.$space ? "20px" : "32px")};
  height: 38px;
  background: ${(p) => (p.$space ? "transparent" : theme.colors.surface)};
  border-bottom: ${(p) =>
    p.$space ? "none" : `2px solid ${theme.colors.border}`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.display};
  font-size: 1.1rem;
  font-weight: 700;
  color: ${theme.colors.text};
`;
const SLetters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  max-width: 380px;
`;
const SLetterBtn = styled.button`
  width: 30px;
  height: 30px;
  background: ${(p) =>
    p.$used
      ? theme.colors.surfaceAlt
      : p.$vowel
        ? theme.colors.warning + "22"
        : "transparent"};
  border: 1px solid
    ${(p) =>
      p.$used
        ? theme.colors.border + "44"
        : p.$vowel
          ? theme.colors.warning
          : theme.colors.border};
  color: ${(p) =>
    p.$used
      ? theme.colors.textMuted + "44"
      : p.$vowel
        ? theme.colors.warning
        : theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  font-family: ${theme.font.mono};
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 100ms;
  &:disabled {
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;
const SActions = styled.div`
  display: flex;
  gap: ${theme.space[3]}px;
`;
const SSpinBtn = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
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
