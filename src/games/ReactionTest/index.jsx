import { useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const ROUNDS = 5;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 4000;
const EARLY_PENALTY_MS = 1000;

export default function ReactionTest() {
  const [phase, setPhase] = useState("idle");
  const [times, setTimes] = useState([]);
  const [round, setRound] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);
  const { setScore } = useGameShell();
  const [topTimes, setTopTimes] = useLocalStorage("gv_reaction_top5", []);

  const startRound = useCallback(() => {
    setPhase("waiting");
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      setPhase("ready");
      startRef.current = Date.now();
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "idle" || phase === "done") {
      setTimes([]);
      setRound(0);
      startRound();
      return;
    }
    if (phase === "waiting") {
      clearTimeout(timerRef.current);
      const penaltyMs = EARLY_PENALTY_MS;
      const newTimes = [...times, penaltyMs];
      setTimes(newTimes);
      const newRound = round + 1;
      setRound(newRound);
      if (newRound >= ROUNDS) {
        finishGame(newTimes);
      } else {
        setTimeout(startRound, 500);
      }
      return;
    }
    if (phase === "ready") {
      const ms = Date.now() - startRef.current;
      const newTimes = [...times, ms];
      setTimes(newTimes);
      const newRound = round + 1;
      setRound(newRound);
      setPhase("idle");
      if (newRound >= ROUNDS) {
        finishGame(newTimes);
      } else {
        setTimeout(startRound, 800);
      }
    }
  }, [phase, times, round, startRound]); // eslint-disable-line

  const finishGame = useCallback(
    (allTimes) => {
      const avg = Math.round(
        allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
      );
      const score = Math.max(0, Math.round((1000 - avg) / 10) * 10);
      setScore(score);
      setPhase("done");
      setTopTimes((prev) => {
        const next = [...prev, avg].sort((a, b) => a - b).slice(0, 5);
        return next;
      });
    },
    [setScore, setTopTimes],
  );

  const stateColor =
    phase === "ready"
      ? theme.colors.success
      : phase === "waiting"
        ? theme.colors.surface
        : theme.colors.surfaceAlt;

  return (
    <SWrapper>
      <SBox $color={stateColor} onClick={handleClick}>
        {phase === "idle" && <SText>Click to Start</SText>}
        {phase === "waiting" && <SText $muted>Wait for it...</SText>}
        {phase === "ready" && <SText>CLICK NOW!</SText>}
        {phase === "done" && (
          <SResultScreen>
            <SResultTitle>Results</SResultTitle>
            {times.map((t, i) => (
              <SResultLine key={i}>
                Round {i + 1}:{" "}
                {t >= EARLY_PENALTY_MS && t === EARLY_PENALTY_MS
                  ? "⚡ Too early (+1000ms)"
                  : `${t}ms`}
              </SResultLine>
            ))}
            <SAvg>
              Avg: {Math.round(times.reduce((a, b) => a + b, 0) / times.length)}
              ms
            </SAvg>
            <SRestartHint>Click to play again</SRestartHint>
          </SResultScreen>
        )}
      </SBox>
      <SRound>
        {round < ROUNDS ? `Round ${round + 1} / ${ROUNDS}` : "Done!"}
      </SRound>
      {topTimes.length > 0 && (
        <SLeaderboard>
          <SLBTitle>TOP 5 AVERAGES</SLBTitle>
          {topTimes.map((t, i) => (
            <SLBRow key={i}>
              {i + 1}. {t}ms
            </SLBRow>
          ))}
        </SLeaderboard>
      )}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SBox = styled.div`
  width: min(80vw, 400px);
  height: 280px;
  background: ${(p) => p.$color};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 150ms ease-out;
  flex-direction: column;
  gap: ${theme.space[2]}px;
`;
const SText = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.8rem;
  font-weight: 700;
  color: ${(p) => (p.$muted ? theme.colors.textMuted : theme.colors.text)};
  user-select: none;
`;
const SResultScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SResultTitle = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.2rem;
  color: ${theme.colors.text};
`;
const SResultLine = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SAvg = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  color: ${theme.colors.accent};
  margin-top: ${theme.space[1]}px;
`;
const SRestartHint = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
const SRound = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SLeaderboard = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px;
  min-width: 200px;
`;
const SLBTitle = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.1em;
  margin-bottom: ${theme.space[2]}px;
`;
const SLBRow = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.text};
`;
