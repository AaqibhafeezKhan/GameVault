import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";

const OPTIONS = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];
const OUTCOMES = {
  Rock: { beats: ["Scissors", "Lizard"], how: ["crushes", "crushes"] },
  Paper: { beats: ["Rock", "Spock"], how: ["covers", "disproves"] },
  Scissors: { beats: ["Paper", "Lizard"], how: ["cuts", "decapitates"] },
  Lizard: { beats: ["Spock", "Paper"], how: ["poisons", "eats"] },
  Spock: { beats: ["Rock", "Scissors"], how: ["vaporizes", "smashes"] },
};
const TOTAL_ROUNDS = 7;
const ICONS = {
  Rock: "🪨",
  Paper: "📄",
  Scissors: "✂️",
  Lizard: "🦎",
  Spock: "🖖",
};

function getResult(player, computer) {
  if (player === computer) return "draw";
  if (OUTCOMES[player].beats.includes(computer)) return "win";
  return "lose";
}

function getOutcomeText(player, computer) {
  if (player === computer) return "It's a tie!";
  if (OUTCOMES[player].beats.includes(computer)) {
    const idx = OUTCOMES[player].beats.indexOf(computer);
    return `${player} ${OUTCOMES[player].how[idx]} ${computer}`;
  }
  const idx = OUTCOMES[computer].beats.indexOf(player);
  return `${computer} ${OUTCOMES[computer].how[idx]} ${player}`;
}

export default function RPSLizardSpock() {
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [round, setRound] = useState(1);
  const [result, setResult] = useState(null);
  const [lastPlays, setLastPlays] = useState(null);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState(
    Object.fromEntries(OPTIONS.map((o) => [o, { wins: 0, total: 0 }])),
  );
  const { setScore, setGameOver } = useGameShell();

  const play = useCallback(
    (player) => {
      if (finished) return;
      const cpu = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
      const res = getResult(player, cpu);
      const text = getOutcomeText(player, cpu);
      setLastPlays({ player, cpu });
      setResult({ res, text });
      setStats((prev) => ({
        ...prev,
        [player]: {
          wins: prev[player].wins + (res === "win" ? 1 : 0),
          total: prev[player].total + 1,
        },
      }));

      let newPs = playerScore,
        newCs = cpuScore;
      if (res === "win") newPs++;
      else if (res === "lose") newCs++;
      setPlayerScore(newPs);
      setCpuScore(newCs);
      setScore(newPs);

      if (round >= TOTAL_ROUNDS) {
        setFinished(true);
        setGameOver(true);
      } else {
        setRound((r) => r + 1);
      }
    },
    [finished, playerScore, cpuScore, round, setScore, setGameOver],
  );

  const reset = useCallback(() => {
    setPlayerScore(0);
    setCpuScore(0);
    setRound(1);
    setResult(null);
    setLastPlays(null);
    setFinished(false);
    setStats(
      Object.fromEntries(OPTIONS.map((o) => [o, { wins: 0, total: 0 }])),
    );
    setScore(0);
    setGameOver(false);
  }, [setScore, setGameOver]);

  return (
    <SWrapper>
      <STitle>Rock Paper Scissors Lizard Spock</STitle>
      <SScoreboard>
        <SScore>You: {playerScore}</SScore>
        <SRound>
          Round {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
        </SRound>
        <SScore>CPU: {cpuScore}</SScore>
      </SScoreboard>
      {lastPlays && (
        <SResult $res={result?.res}>
          <SPlays>
            You: {ICONS[lastPlays.player]} vs CPU: {ICONS[lastPlays.cpu]}
          </SPlays>
          <SResultText>{result?.text}</SResultText>
        </SResult>
      )}
      <SOptions>
        {OPTIONS.map((opt) => (
          <SOptBtn
            key={opt}
            onClick={() => play(opt)}
            disabled={finished}
            title={`Beats: ${OUTCOMES[opt].beats.join(", ")}`}
          >
            <SOptIcon>{ICONS[opt]}</SOptIcon>
            <SOptLabel>{opt}</SOptLabel>
            <SOptBeats>{OUTCOMES[opt].beats.join(" & ")}</SOptBeats>
          </SOptBtn>
        ))}
      </SOptions>
      <SStats>
        {OPTIONS.map((o) => (
          <SStatRow key={o}>
            {o}: {stats[o].wins}/{stats[o].total} wins
          </SStatRow>
        ))}
      </SStats>
      {finished && <SResetBtn onClick={reset}>Play Again</SResetBtn>}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
  max-width: 600px;
`;
const STitle = styled.h2`
  font-family: ${theme.font.display};
  font-size: 1.2rem;
  color: ${theme.colors.text};
  text-align: center;
`;
const SScoreboard = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[5]}px;
`;
const SScore = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.1rem;
  color: ${theme.colors.accent};
`;
const SRound = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SResult = styled.div`
  background: ${(p) =>
    p.$res === "win"
      ? theme.colors.success + "22"
      : p.$res === "lose"
        ? theme.colors.danger + "22"
        : theme.colors.surfaceAlt};
  border: 1px solid
    ${(p) =>
      p.$res === "win"
        ? theme.colors.success
        : p.$res === "lose"
          ? theme.colors.danger
          : theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px ${theme.space[4]}px;
  text-align: center;
  min-width: 280px;
`;
const SPlays = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  color: ${theme.colors.text};
`;
const SResultText = styled.div`
  font-family: ${theme.font.body};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  margin-top: 4px;
`;
const SOptions = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  flex-wrap: wrap;
  justify-content: center;
`;
const SOptBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  padding: ${theme.space[3]}px;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition:
    border-color 150ms ease-out,
    background 150ms ease-out;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    background: ${theme.colors.surfaceAlt};
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
const SOptIcon = styled.div`
  font-size: 2rem;
`;
const SOptLabel = styled.div`
  font-family: ${theme.font.display};
  font-size: 0.85rem;
  color: ${theme.colors.text};
`;
const SOptBeats = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  color: ${theme.colors.textMuted};
`;
const SStats = styled.div`
  display: flex;
  gap: ${theme.space[3]}px;
  flex-wrap: wrap;
  justify-content: center;
`;
const SStatRow = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
const SResetBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
