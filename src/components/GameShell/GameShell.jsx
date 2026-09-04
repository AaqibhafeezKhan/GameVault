import { createContext, useContext, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const GameShellContext = createContext(null);

export function useGameShell() {
  return useContext(GameShellContext);
}

const MODAL_OVERLAY_Z = 200;

export default function GameShell({ title, children }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [best, setBest] = useLocalStorage(`gv_best_${title}`, 0);

  const handleSetScore = useCallback(
    (val) => {
      const newScore = typeof val === "function" ? val(score) : val;
      setScore(newScore);
      if (newScore > best) setBest(newScore);
    },
    [score, best, setBest],
  );

  const handleSetGameOver = useCallback((val) => {
    setGameOver(val);
    if (val) setPaused(true);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setPaused(false);
  }, []);

  const ctx = {
    score,
    setScore: handleSetScore,
    best,
    gameOver,
    setGameOver: handleSetGameOver,
    paused,
    setPaused,
    soundEnabled,
  };

  return (
    <GameShellContext.Provider value={ctx}>
      <SShell>
        <STopBar>
          <SGameTitle>{title}</SGameTitle>
          <SMetaRow>
            <SMetaItem>
              <SMetaLabel>SCORE</SMetaLabel>
              <SMetaValue>{score}</SMetaValue>
            </SMetaItem>
            <SMetaItem>
              <SMetaLabel>BEST</SMetaLabel>
              <SMetaValue>{best}</SMetaValue>
            </SMetaItem>
          </SMetaRow>
          <SControls>
            <SIconBtn
              title={soundEnabled ? "Mute" : "Unmute"}
              onClick={() => setSoundEnabled((e) => !e)}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </SIconBtn>
            <SIconBtn
              title={paused ? "Resume" : "Pause"}
              onClick={() => setPaused((p) => !p)}
              disabled={gameOver}
            >
              {paused && !gameOver ? "▶" : "⏸"}
            </SIconBtn>
            <SIconBtn title="Restart" onClick={handleRestart}>
              ↺
            </SIconBtn>
            <SBackBtn as={Link} to="/">
              ⬅ Home
            </SBackBtn>
          </SControls>
        </STopBar>
        <SContent>{children}</SContent>
        {gameOver && (
          <SModalOverlay>
            <SModal>
              <SModalTitle>Game Over</SModalTitle>
              <SModalScore>{score}</SModalScore>
              <SModalLabel>SCORE</SModalLabel>
              {score >= best && score > 0 && <SNewBest>NEW BEST!</SNewBest>}
              <SModalBest>Best: {best}</SModalBest>
              <SModalActions>
                <SModalBtn onClick={handleRestart}>Play Again</SModalBtn>
                <SModalBtn as={Link} to="/" $secondary>
                  Home
                </SModalBtn>
              </SModalActions>
            </SModal>
          </SModalOverlay>
        )}
        {paused && !gameOver && (
          <SPausedOverlay onClick={() => setPaused(false)}>
            <SPausedText>PAUSED — click to resume</SPausedText>
          </SPausedOverlay>
        )}
      </SShell>
    </GameShellContext.Provider>
  );
}

const SShell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 56px);
`;

const STopBar = styled.div`
  background: ${theme.colors.surface};
  border-bottom: 1px solid ${theme.colors.border};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  display: flex;
  align-items: center;
  gap: ${theme.space[4]}px;
  flex-wrap: wrap;
`;

const SGameTitle = styled.h1`
  font-family: ${theme.font.display};
  font-size: 1rem;
  font-weight: 700;
  color: ${theme.colors.text};
  margin-right: auto;
`;

const SMetaRow = styled.div`
  display: flex;
  gap: ${theme.space[4]}px;
`;

const SMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SMetaLabel = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.08em;
`;

const SMetaValue = styled.span`
  font-family: ${theme.font.mono};
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.accent};
`;

const SControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]}px;
`;

const SIconBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
  &:hover:not(:disabled) {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SBackBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: 0 ${theme.space[2]}px;
  height: 32px;
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: ${theme.space[1]}px;
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
  text-decoration: none;
  &:hover {
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
  }
`;

const SContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.space[4]}px;
`;

const SModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${MODAL_OVERLAY_Z};
`;

const SModal = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[6]}px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;

const SModalTitle = styled.h2`
  font-family: ${theme.font.display};
  font-size: 1.5rem;
  color: ${theme.colors.text};
`;

const SModalScore = styled.div`
  font-family: ${theme.font.mono};
  font-size: 3rem;
  font-weight: 600;
  color: ${theme.colors.accent};
  line-height: 1;
`;

const SModalLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.1em;
`;

const SNewBest = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.success};
  letter-spacing: 0.1em;
`;

const SModalBest = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;

const SModalActions = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  margin-top: ${theme.space[2]}px;
`;

const SModalBtn = styled.button`
  background: transparent;
  border: 1px solid
    ${(props) => (props.$secondary ? theme.colors.border : theme.colors.accent)};
  color: ${(props) =>
    props.$secondary ? theme.colors.textMuted : theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition:
    background 150ms ease-out,
    color 150ms ease-out;
  &:hover {
    background: ${(props) =>
      props.$secondary ? theme.colors.surfaceAlt : theme.colors.accent};
    color: ${(props) => (props.$secondary ? theme.colors.text : "#fff")};
  }
`;

const SPausedOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${MODAL_OVERLAY_Z - 1};
  cursor: pointer;
`;

const SPausedText = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.2rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.05em;
`;
