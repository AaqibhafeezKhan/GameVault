import { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { SPELLING_WORDS } from "../../utils/wordBank";

const WORDS_PER_ROUND = 20;
const MAX_REPLAYS = 2;
const POINTS_CORRECT = 10;
const POINTS_MAX = WORDS_PER_ROUND * POINTS_CORRECT;

function speak(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

export default function SpellingBee() {
  const [words, setWords] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [replays, setReplays] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const { setScore, setGameOver } = useGameShell();

  const start = useCallback(() => {
    const shuffled = [...SPELLING_WORDS]
      .sort(() => Math.random() - 0.5)
      .slice(0, WORDS_PER_ROUND);
    setWords(shuffled);
    setIdx(0);
    setInput("");
    setReplays(0);
    setFeedback(null);
    setStarted(true);
    setFinished(false);
    setScore(0);
    speak(shuffled[0]);
  }, [setScore]);

  const submit = useCallback(() => {
    if (!words.length || idx >= words.length) return;
    const correct = input.toLowerCase().trim() === words[idx].toLowerCase();
    if (correct) {
      setScore((s) => s + POINTS_CORRECT);
      setFeedback({ type: "correct", text: "✓ Correct!" });
    } else {
      setFeedback({
        type: "wrong",
        text: `✗ The correct spelling is: ${words[idx]}`,
      });
    }
    setInput("");
    setReplays(0);
    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= words.length) {
        setFinished(true);
        setGameOver(true);
      } else {
        setIdx(nextIdx);
        setFeedback(null);
        speak(words[nextIdx]);
      }
    }, 1500);
  }, [words, idx, input, setScore, setGameOver]);

  const replay = useCallback(() => {
    if (replays >= MAX_REPLAYS || !words.length) return;
    speak(words[idx]);
    setReplays((r) => r + 1);
  }, [replays, words, idx]);

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Spelling Bee</SDiffTitle>
        <SDiffDesc>
          Listen to each word and type its correct spelling. {WORDS_PER_ROUND}{" "}
          words, {POINTS_CORRECT} pts each.
        </SDiffDesc>
        <SDiffBtn onClick={start}>Start</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SProgress>
        {idx + 1} / {WORDS_PER_ROUND}
      </SProgress>
      <SWordBox>
        <SWordLabel>Word #{idx + 1}</SWordLabel>
        <SReplayBtn onClick={replay} disabled={replays >= MAX_REPLAYS}>
          🔊 Hear Again ({MAX_REPLAYS - replays} left)
        </SReplayBtn>
      </SWordBox>
      {feedback && <SFeedback $type={feedback.type}>{feedback.text}</SFeedback>}
      <SInputRow>
        <SInput
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type the spelling..."
          disabled={!!feedback}
          id="spelling-input"
          spellCheck={false}
          autoCorrect="off"
        />
        <SSubmitBtn onClick={submit} disabled={!input || !!feedback}>
          Submit
        </SSubmitBtn>
      </SInputRow>
      <SScore>Max possible: {POINTS_MAX}</SScore>
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
  max-width: 480px;
  width: 100%;
`;
const SProgress = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SWordBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SWordLabel = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.2rem;
  color: ${theme.colors.text};
`;
const SReplayBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const SFeedback = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  color: ${(p) =>
    p.$type === "correct" ? theme.colors.success : theme.colors.danger};
`;
const SInputRow = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  width: 100%;
`;
const SInput = styled.input`
  flex: 1;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  color: ${theme.colors.text};
  padding: ${theme.space[3]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  outline: none;
  transition: border-color 150ms ease-out;
  &:focus {
    border-color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const SSubmitBtn = styled.button`
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
const SScore = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
