import { useState, useCallback } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { deckUtils } from "../../utils/deckUtils";

const VALUES = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 10,
  Q: 10,
  K: 10,
};
const VALUE_ACE_HIGH = 11;

function cardValue(card, total) {
  if (card.value === "A")
    return total + VALUE_ACE_HIGH <= 21 ? VALUE_ACE_HIGH : 1;
  return VALUES[card.value];
}

function handTotal(cards) {
  let total = 0,
    aces = 0;
  for (const card of cards) {
    if (card.value === "A") {
      aces++;
      total += 11;
    } else total += VALUES[card.value];
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function cardLabel(card) {
  return `${card.value}${card.suit}`;
}

const SUITS = {
  "♥": "#fc5c7d",
  "♦": "#f0c93e",
  "♠": "#e8e8f0",
  "♣": "#3ef0a1",
};

export default function Blackjack() {
  const [deck, setDeck] = useState(null);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [chips, setChips] = useState(200);
  const [bet, setBet] = useState(10);
  const { setScore } = useGameShell();

  const deal = useCallback(() => {
    if (bet > chips) return;
    const newDeck = deckUtils.shuffle(deckUtils.createDeck());
    const p = [newDeck[0], newDeck[2]];
    const d = [newDeck[1], newDeck[3]];
    setDeck(newDeck.slice(4));
    setPlayer(p);
    setDealer(d);
    setPhase("player");
    setResult(null);
    setChips((c) => c - bet);
    if (handTotal(p) === 21) {
      endRound(d, p, newDeck.slice(4), true);
    }
  }, [bet, chips]);

  const endRound = useCallback(
    (dealerHand, playerHand, remainDeck, isBlackjack = false) => {
      let dHand = [...dealerHand];
      let rDeck = [...remainDeck];
      while (handTotal(dHand) < 17) {
        dHand = [...dHand, rDeck[0]];
        rDeck = rDeck.slice(1);
      }
      setDealer(dHand);
      setDeck(rDeck);

      const pTotal = handTotal(playerHand);
      const dTotal = handTotal(dHand);
      const bust = pTotal > 21 ? "bust" : dTotal > 21 ? "dealer_bust" : null;
      let res;

      if (isBlackjack) {
        res = "blackjack";
        setChips((c) => c + Math.floor(bet * 2.5));
      } else if (bust === "bust") res = "lose";
      else if (bust === "dealer_bust") {
        res = "win";
        setChips((c) => c + bet * 2);
      } else if (pTotal > dTotal) {
        res = "win";
        setChips((c) => c + bet * 2);
      } else if (pTotal === dTotal) {
        res = "push";
        setChips((c) => c + bet);
      } else res = "lose";

      setResult(res);
      setPhase("done");
      setScore(
        (prev) =>
          prev +
          (res === "win" || res === "blackjack"
            ? bet
            : res === "push"
              ? 0
              : -bet),
      );
    },
    [bet, setScore],
  );

  const hit = useCallback(() => {
    if (!deck || phase !== "player") return;
    const card = deck[0];
    const newPlayer = [...player, card];
    const newDeck = deck.slice(1);
    setPlayer(newPlayer);
    setDeck(newDeck);
    if (handTotal(newPlayer) >= 21) endRound(dealer, newPlayer, newDeck);
  }, [deck, phase, player, dealer, endRound]);

  const stand = useCallback(() => {
    if (phase !== "player") return;
    setPhase("dealer");
    endRound(dealer, player, deck);
  }, [phase, dealer, player, deck, endRound]);

  const doubleDown = useCallback(() => {
    if (phase !== "player" || player.length !== 2 || bet > chips) return;
    setChips((c) => c - bet);
    const card = deck[0];
    const newPlayer = [...player, card];
    const newDeck = deck.slice(1);
    setPlayer(newPlayer);
    setDeck(newDeck);
    endRound(dealer, newPlayer, newDeck);
  }, [phase, player, deck, dealer, bet, chips, endRound]);

  const RESULT_LABELS = {
    win: "🎉 You Win!",
    lose: "😞 Dealer Wins",
    push: "🤝 Push",
    blackjack: "🃏 Blackjack! 2.5x",
    bust: "💥 Busted!",
  };

  return (
    <SWrapper>
      <SChips>
        Chips: <SChipVal>{chips}</SChipVal>
      </SChips>
      <SBetRow>
        <SBetLabel>Bet:</SBetLabel>
        {[5, 10, 25, 50, 100].map((b) => (
          <SBetBtn
            key={b}
            $active={bet === b}
            onClick={() => setBet(b)}
            disabled={phase === "player"}
          >
            {b}
          </SBetBtn>
        ))}
      </SBetRow>
      {result && <SResult $res={result}>{RESULT_LABELS[result]}</SResult>}
      {phase !== "idle" && (
        <SGame>
          <SHandSection>
            <SHandTitle>
              Dealer{" "}
              {phase === "done"
                ? `(${handTotal(dealer)})`
                : `(${VALUES[dealer[0]?.value] || "?"}+?)`}
            </SHandTitle>
            <SCards>
              {dealer.map((card, i) => (
                <SCard
                  key={i}
                  $suit={card.suit}
                  $hidden={i === 1 && phase === "player"}
                >
                  {i === 1 && phase === "player" ? "🂠" : cardLabel(card)}
                </SCard>
              ))}
            </SCards>
          </SHandSection>
          <SHandSection>
            <SHandTitle>You ({handTotal(player)})</SHandTitle>
            <SCards>
              {player.map((card, i) => (
                <SCard key={i} $suit={card.suit}>
                  {cardLabel(card)}
                </SCard>
              ))}
            </SCards>
          </SHandSection>
          {phase === "player" && (
            <SActions>
              <SActionBtn onClick={hit}>Hit</SActionBtn>
              <SActionBtn onClick={stand}>Stand</SActionBtn>
              <SActionBtn
                onClick={doubleDown}
                disabled={player.length !== 2 || bet > chips}
              >
                Double
              </SActionBtn>
            </SActions>
          )}
          {phase === "done" && (
            <SActions>
              <SActionBtn onClick={deal} disabled={chips <= 0}>
                Deal Again
              </SActionBtn>
            </SActions>
          )}
        </SGame>
      )}
      {phase === "idle" && (
        <SDealBtn onClick={deal} disabled={chips <= 0}>
          Deal
        </SDealBtn>
      )}
    </SWrapper>
  );
}

const SWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
  min-height: 400px;
`;
const SChips = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;
const SChipVal = styled.span`
  color: ${theme.colors.warning};
  font-weight: 600;
`;
const SBetRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SBetLabel = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SBetBtn = styled.button`
  background: ${(p) => (p.$active ? theme.colors.accent : "transparent")};
  border: 1px solid
    ${(p) => (p.$active ? theme.colors.accent : theme.colors.border)};
  color: ${(p) => (p.$active ? "#fff" : theme.colors.textMuted)};
  width: 40px;
  height: 34px;
  border-radius: ${theme.radius.sm};
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 150ms ease-out;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
const SResult = styled.div`
  font-family: ${theme.font.display};
  font-size: 1.3rem;
  color: ${(p) =>
    p.$res === "win" || p.$res === "blackjack"
      ? theme.colors.success
      : p.$res === "push"
        ? theme.colors.textMuted
        : theme.colors.danger};
`;
const SGame = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[3]}px;
`;
const SHandSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]}px;
`;
const SHandTitle = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;
const SCards = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
`;
const SCard = styled.div`
  width: 52px;
  height: 72px;
  background: ${(p) =>
    p.$hidden ? theme.colors.surfaceAlt : theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(p) => SUITS[p.$suit] || theme.colors.text};
`;
const SActions = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
`;
const SActionBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[4]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 150ms ease-out;
  &:hover:not(:disabled) {
    background: ${theme.colors.accent};
    color: #fff;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const SDealBtn = styled.button`
  background: ${theme.colors.accent};
  border: none;
  color: #fff;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]}px ${theme.space[6]}px;
  font-family: ${theme.font.display};
  font-size: 1.1rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
