import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { deckUtils } from "../../utils/deckUtils";

export default function CardWar() {
  const [deck1, setDeck1] = useState([]);
  const [deck2, setDeck2] = useState([]);
  const [top1, setTop1] = useState(null);
  const [top2, setTop2] = useState(null);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const { setScore, setGameOver } = useGameShell();

  const startGame = useCallback(() => {
    const full = deckUtils.shuffle(deckUtils.createDeck());
    const half = Math.floor(full.length / 2);
    setDeck1(full.slice(0, half));
    setDeck2(full.slice(half));
    setTop1(null);
    setTop2(null);
    setResult(null);
    setRound(0);
    setStarted(true);
    setFinished(false);
    setScore(0);
  }, [setScore]);

  const draw = useCallback(() => {
    if (!deck1.length || !deck2.length) {
      setFinished(true);
      setGameOver(true);
      return;
    }
    const c1 = deck1[0],
      c2 = deck2[0];
    const nd1 = deck1.slice(1),
      nd2 = deck2.slice(1);
    setTop1(c1);
    setTop2(c2);
    const newRound = round + 1;
    setRound(newRound);

    if (c1.numVal > c2.numVal) {
      nd1.push(c1, c2);
      setResult("win");
      setScore(Math.round(nd1.length / 2));
    } else if (c2.numVal > c1.numVal) {
      nd2.push(c1, c2);
      setResult("lose");
      setScore(Math.round(nd1.length / 2));
    } else {
      nd1.push(c1);
      nd2.push(c2);
      setResult("tie");
    }

    setDeck1(nd1);
    setDeck2(nd2);
    if (!nd1.length || !nd2.length || newRound >= 26) {
      setFinished(true);
      setGameOver(true);
      setScore(
        nd1.length > nd2.length ? 100 : nd1.length === nd2.length ? 50 : 0,
      );
    }
  }, [deck1, deck2, round, setScore, setGameOver]);

  const SUIT_COLOR = (suit) => deckUtils.cardColor(suit);

  if (!started) {
    return (
      <SDiffScreen>
        <SDiffTitle>Card War</SDiffTitle>
        <SDiffDesc>
          Each player reveals their top card — highest value wins the round and
          both cards! Play 26 rounds.
        </SDiffDesc>
        <SDiffBtn onClick={startGame}>Deal Cards</SDiffBtn>
      </SDiffScreen>
    );
  }

  return (
    <SWrapper>
      <SScoreboard>
        <SPile $lead={deck1.length > deck2.length}>
          You: {deck1.length} cards
        </SPile>
        <SRound>Round {round}/26</SRound>
        <SRound>CPU: {deck2.length} cards</SRound>
      </SScoreboard>
      <SBattleArea>
        <SSlot>
          <SSlotLabel>Your card</SSlotLabel>
          {top1 && (
            <SCard $suit={top1.suit}>
              <SCardTop>{top1.value}</SCardTop>
              <SCardSuit>{top1.suit}</SCardSuit>
            </SCard>
          )}
          {!top1 && <SCardBack>🂠</SCardBack>}
        </SSlot>
        <SVs $res={result}>
          {result === "win"
            ? "⬆"
            : result === "lose"
              ? "⬇"
              : result === "tie"
                ? "="
                : "vs"}
        </SVs>
        <SSlot>
          <SSlotLabel>CPU card</SSlotLabel>
          {top2 && (
            <SCard $suit={top2.suit}>
              <SCardTop>{top2.value}</SCardTop>
              <SCardSuit>{top2.suit}</SCardSuit>
            </SCard>
          )}
          {!top2 && <SCardBack>🂠</SCardBack>}
        </SSlot>
      </SBattleArea>
      {result && (
        <SResult $res={result}>
          {result === "win"
            ? "✓ You win this round!"
            : result === "lose"
              ? "✗ CPU wins this round"
              : "= Tie — cards returned"}
        </SResult>
      )}
      {!finished ? (
        <SDrawBtn onClick={draw}>Draw Card</SDrawBtn>
      ) : (
        <SFinished>
          {deck1.length > deck2.length
            ? "🎉 You win the war!"
            : deck1.length < deck2.length
              ? "😞 CPU wins the war"
              : "🤝 It's a draw!"}
          <SNewBtn onClick={startGame}>Play Again</SNewBtn>
        </SFinished>
      )}
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
`;
const SScoreboard = styled.div`
  display: flex;
  gap: ${theme.space[4]}px;
  align-items: center;
`;
const SRound = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SPile = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${(p) => (p.$lead ? theme.colors.success : theme.colors.textMuted)};
`;
const SBattleArea = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[4]}px;
`;
const SSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SSlotLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
`;
const SCard = styled.div`
  width: 80px;
  height: 110px;
  background: ${theme.colors.surface};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(p) => deckUtils.cardColor(p.$suit)};
  gap: ${theme.space[1]}px;
`;
const SCardTop = styled.div`
  font-family: ${theme.font.mono};
  font-size: 1.4rem;
  font-weight: 700;
`;
const SCardSuit = styled.div`
  font-size: 1.8rem;
`;
const SCardBack = styled.div`
  width: 80px;
  height: 110px;
  background: ${theme.colors.surfaceAlt};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
`;
const SVs = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.8rem;
  font-weight: 700;
  color: ${(p) =>
    p.$res === "win"
      ? theme.colors.success
      : p.$res === "lose"
        ? theme.colors.danger
        : theme.colors.textMuted};
`;
const SResult = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${(p) =>
    p.$res === "win"
      ? theme.colors.success
      : p.$res === "lose"
        ? theme.colors.danger
        : theme.colors.textMuted};
`;
const SDrawBtn = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px ${theme.space[6]}px;
  font-family: ${theme.font.mono};
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    opacity: 0.85;
  }
`;
const SFinished = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
  font-family: ${theme.font.display};
  font-size: 1.1rem;
  color: ${theme.colors.text};
`;
const SNewBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
