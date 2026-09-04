const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const RANK_VALUES = {
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
  A: 11,
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of RANKS) {
      deck.push({ suit, value, numVal: RANK_VALUES[value] });
    }
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function dealCards(deck, count) {
  return { hand: deck.slice(0, count), remaining: deck.slice(count) };
}

function cardColor(suit) {
  return suit === "♥" || suit === "♦" ? "#fc5c7d" : "#e8e8f0";
}

export const deckUtils = { createDeck, shuffle, dealCards, cardColor };
export { createDeck, shuffle as shuffleDeck, dealCards, cardColor };
