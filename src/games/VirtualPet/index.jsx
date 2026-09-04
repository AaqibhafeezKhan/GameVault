import { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const STAT_MAX = 100;
const HUNGER_DECAY = 2; // per minute
const HAPPY_DECAY = 1;
const ENERGY_DECAY = 1.5;
const TICK_MS = 3000;

function getMood(state) {
  const min = Math.min(state.hunger, state.happiness, state.energy);
  if (min >= 80) return { label: "Thriving", color: theme.colors.success };
  if (min >= 60) return { label: "Happy", color: theme.colors.accent };
  if (min >= 40) return { label: "Okay", color: theme.colors.warning };
  if (min >= 20) return { label: "Sad", color: theme.colors.accentAlt };
  return { label: "Critical", color: theme.colors.danger };
}

const DEFAULT_PET = {
  hunger: 70,
  happiness: 70,
  energy: 70,
  name: "Blobby",
  lastSaved: Date.now(),
};

export default function VirtualPet() {
  const [pet, setPet] = useLocalStorage("gv_virtual_pet", DEFAULT_PET);
  const [anim, setAnim] = useState(null);
  const { setScore } = useGameShell();

  useEffect(() => {
    const interval = setInterval(() => {
      setPet((prev) => {
        const elapsed = (Date.now() - (prev.lastSaved || Date.now())) / 60000;
        const hours = Math.min(elapsed, 24);
        const hunger = Math.max(0, prev.hunger - HUNGER_DECAY * hours * 20);
        const happiness = Math.max(
          0,
          prev.happiness - HAPPY_DECAY * hours * 20,
        );
        const energy = Math.max(0, prev.energy - ENERGY_DECAY * hours * 20);
        const next = {
          ...prev,
          hunger,
          happiness,
          energy,
          lastSaved: Date.now(),
        };
        const mood = getMood(next);
        setScore(Math.round((next.hunger + next.happiness + next.energy) / 3));
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [setPet, setScore]);

  const feed = useCallback(() => {
    setPet((p) => ({
      ...p,
      hunger: Math.min(STAT_MAX, p.hunger + 30),
      lastSaved: Date.now(),
    }));
    setAnim("feed");
    setTimeout(() => setAnim(null), 600);
  }, [setPet]);

  const play = useCallback(() => {
    setPet((p) => ({
      ...p,
      happiness: Math.min(STAT_MAX, p.happiness + 30),
      energy: Math.max(0, p.energy - 10),
      lastSaved: Date.now(),
    }));
    setAnim("play");
    setTimeout(() => setAnim(null), 600);
  }, [setPet]);

  const sleep = useCallback(() => {
    setPet((p) => ({
      ...p,
      energy: Math.min(STAT_MAX, p.energy + 50),
      lastSaved: Date.now(),
    }));
    setAnim("sleep");
    setTimeout(() => setAnim(null), 600);
  }, [setPet]);

  const reset = useCallback(() => {
    setPet({ ...DEFAULT_PET, lastSaved: Date.now() });
  }, [setPet]);

  const mood = getMood(pet);
  const critical = mood.label === "Critical";

  return (
    <SWrapper>
      <SNameRow>
        <SPetName>{pet.name}</SPetName>
        <SMood $color={mood.color} $critical={critical}>
          {mood.label}
        </SMood>
      </SNameRow>
      <SPetDisplay $critical={critical} $anim={anim}>
        <SPetBody>
          <SEye $left />
          <SEye />
          {mood.label === "Critical" && <SMouth $sad />}
          {mood.label !== "Critical" && <SMouth />}
        </SPetBody>
        {anim === "feed" && <SActionLabel>😋</SActionLabel>}
        {anim === "play" && <SActionLabel>🎉</SActionLabel>}
        {anim === "sleep" && <SActionLabel>💤</SActionLabel>}
      </SPetDisplay>
      <SStats>
        <SStat>
          <SStatLabel>🍖 Hunger</SStatLabel>
          <SBar>
            <SBarFill
              $val={pet.hunger}
              $color={
                pet.hunger < 20 ? theme.colors.danger : theme.colors.success
              }
            />
          </SBar>
          <SStatVal>{Math.round(pet.hunger)}</SStatVal>
        </SStat>
        <SStat>
          <SStatLabel>😊 Happiness</SStatLabel>
          <SBar>
            <SBarFill
              $val={pet.happiness}
              $color={
                pet.happiness < 20 ? theme.colors.danger : theme.colors.accent
              }
            />
          </SBar>
          <SStatVal>{Math.round(pet.happiness)}</SStatVal>
        </SStat>
        <SStat>
          <SStatLabel>⚡ Energy</SStatLabel>
          <SBar>
            <SBarFill
              $val={pet.energy}
              $color={
                pet.energy < 20 ? theme.colors.danger : theme.colors.warning
              }
            />
          </SBar>
          <SStatVal>{Math.round(pet.energy)}</SStatVal>
        </SStat>
      </SStats>
      <SButtons>
        <SActionBtn onClick={feed} disabled={pet.hunger >= STAT_MAX}>
          🍗 Feed
        </SActionBtn>
        <SActionBtn
          onClick={play}
          disabled={pet.happiness >= STAT_MAX || pet.energy < 10}
        >
          🎮 Play
        </SActionBtn>
        <SActionBtn onClick={sleep} disabled={pet.energy >= STAT_MAX}>
          💤 Sleep
        </SActionBtn>
      </SButtons>
      <SResetBtn onClick={reset}>Reset Pet</SResetBtn>
      <SNote>Stats persist between sessions via localStorage</SNote>
    </SWrapper>
  );
}

const pulseRed = keyframes`
  0%, 100% { border-color: ${theme.colors.danger}; }
  50% { border-color: transparent; }
`;
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
  max-width: 400px;
  width: 100%;
`;
const SNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SPetName = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.5rem;
  color: ${theme.colors.text};
`;
const SMood = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) => p.$color};
  animation: ${(p) => (p.$critical ? pulseRed : "none")} 1s infinite;
`;
const SPetDisplay = styled.div`
  width: 160px;
  height: 160px;
  background: ${theme.colors.surface};
  border: 2px solid
    ${(p) => (p.$critical ? theme.colors.danger : theme.colors.border)};
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${(p) =>
    p.$critical
      ? pulseRed + " 1s infinite"
      : p.$anim
        ? bounce + " 0.5s ease"
        : "none"};
  transition: border-color 200ms;
`;
const SPetBody = styled.div`
  width: 80px;
  height: 80px;
  background: ${theme.colors.accent};
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const SEye = styled.div`
  width: 12px;
  height: 14px;
  background: ${theme.colors.bg};
  border-radius: 50%;
  position: absolute;
  top: 22px;
  left: ${(p) => (p.$left ? "15px" : "auto")};
  right: ${(p) => (p.$left ? "auto" : "15px")};
`;
const SMouth = styled.div`
  width: 30px;
  height: ${(p) => (p.$sad ? "12px" : "16px")};
  border: 3px solid ${theme.colors.bg};
  border-radius: ${(p) => (p.$sad ? "0 0 50% 50%" : "50% 50% 0 0")};
  position: absolute;
  bottom: 12px;
  border-top: ${(p) => (p.$sad ? "none" : "3px solid " + theme.colors.bg)};
  border-bottom: ${(p) => (p.$sad ? "3px solid " + theme.colors.bg : "none")};
  transform: ${(p) => (p.$sad ? "scaleY(-1)" : "none")};
`;
const SActionLabel = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.8rem;
`;
const SStats = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
`;
const SStat = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SStatLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
  min-width: 110px;
`;
const SBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${theme.colors.surfaceAlt};
  border-radius: 4px;
  overflow: hidden;
`;
const SBarFill = styled.div`
  height: 100%;
  width: ${(p) => p.$val}%;
  background: ${(p) => p.$color};
  border-radius: 4px;
  transition:
    width 500ms ease-out,
    background 500ms;
`;
const SStatVal = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
  min-width: 28px;
  text-align: right;
`;
const SButtons = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
`;
const SActionBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[3]}px;
  font-family: ${theme.font.body};
  font-size: 0.9rem;
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
const SResetBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.72rem;
  cursor: pointer;
  &:hover {
    border-color: ${theme.colors.danger};
    color: ${theme.colors.danger};
  }
`;
const SNote = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
`;
