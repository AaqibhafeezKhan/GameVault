import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { gamesData } from "../../data/gamesData";

const CATEGORIES = [
  "All",
  "Arcade",
  "Puzzle",
  "Card",
  "Word",
  "Reflex",
  "Strategy",
];
const DIFFICULTY_COLORS = {
  Easy: theme.colors.success,
  Medium: theme.colors.warning,
  Hard: theme.colors.danger,
};
const PLACEHOLDER_BEST_KEY = "gv_best_";

function getBest(title) {
  try {
    const val = localStorage.getItem(`${PLACEHOLDER_BEST_KEY}${title}`);
    return val ? JSON.parse(val) : 0;
  } catch {
    return 0;
  }
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return gamesData.filter((g) => {
      const matchCat = category === "All" || g.category === category;
      const matchSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <SPage>
      <SControls>
        <SSearch
          id="game-search"
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SFilterRow>
          {CATEGORIES.map((cat) => (
            <SFilterBtn
              key={cat}
              $active={category === cat}
              $color={theme.categories[cat] || theme.colors.accent}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </SFilterBtn>
          ))}
        </SFilterRow>
      </SControls>
      <SResultCount>
        {filtered.length} game{filtered.length !== 1 ? "s" : ""}
      </SResultCount>
      <SGrid>
        {filtered.map((game) => {
          const catColor =
            theme.categories[game.category] || theme.colors.accent;
          const best = getBest(game.title);
          return (
            <SCard
              key={game.slug}
              as={Link}
              to={`/game/${game.slug}`}
              $color={catColor}
            >
              <SCardTop>
                <SCardTitle>{game.title}</SCardTitle>
                <SDiffBadge $diff={game.difficulty}>
                  {game.difficulty}
                </SDiffBadge>
              </SCardTop>
              <SCardDesc>{game.description}</SCardDesc>
              <SCardBottom>
                <SCategoryTag $color={catColor}>{game.category}</SCategoryTag>
                {best > 0 && <SBestScore>BEST {best}</SBestScore>}
              </SCardBottom>
            </SCard>
          );
        })}
      </SGrid>
      {filtered.length === 0 && <SEmpty>No games match your search.</SEmpty>}
    </SPage>
  );
}

const SPage = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${theme.space[4]}px ${theme.space[4]}px ${theme.space[7]}px;
  width: 100%;
`;

const SControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[3]}px;
  margin-bottom: ${theme.space[3]}px;
`;

const SSearch = styled.input`
  width: 100%;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.text};
  padding: ${theme.space[3]}px ${theme.space[4]}px;
  font-size: 1rem;
  transition: border-color 150ms ease-out;
  outline: none;
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;

const SFilterRow = styled.div`
  display: flex;
  gap: ${theme.space[2]}px;
  flex-wrap: wrap;
`;

const SFilterBtn = styled.button`
  background: transparent;
  border: 1px solid
    ${(props) => (props.$active ? props.$color : theme.colors.border)};
  color: ${(props) => (props.$active ? props.$color : theme.colors.textMuted)};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]}px ${theme.space[3]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  transition:
    border-color 150ms ease-out,
    color 150ms ease-out;
  &:hover {
    border-color: ${(props) => props.$color};
    color: ${(props) => props.$color};
  }
`;

const SResultCount = styled.div`
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
  margin-bottom: ${theme.space[3]}px;
  letter-spacing: 0.05em;
`;

const SGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.space[3]}px;
  @media (max-width: 1199px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 899px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 599px) {
    grid-template-columns: 1fr;
  }
`;

const SCard = styled.article`
  background: ${theme.colors.surface};
  border-left: 3px solid ${(props) => props.$color};
  border-top: 1px solid ${theme.colors.border};
  border-right: 1px solid ${theme.colors.border};
  border-bottom: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[4]}px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]}px;
  text-decoration: none;
  transition:
    background 150ms ease-out,
    border-left-width 150ms ease-out;
  &:hover {
    background: ${theme.colors.surfaceAlt};
    border-left-width: 6px;
  }
`;

const SCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.space[2]}px;
`;

const SCardTitle = styled.h2`
  font-family: ${theme.font.display};
  font-weight: 500;
  font-size: 1rem;
  color: ${theme.colors.text};
  line-height: 1.3;
`;

const SDiffBadge = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: ${theme.radius.sm};
  background: ${(props) => DIFFICULTY_COLORS[props.$diff] + "22"};
  color: ${(props) => DIFFICULTY_COLORS[props.$diff]};
  white-space: nowrap;
  flex-shrink: 0;
`;

const SCardDesc = styled.p`
  font-family: ${theme.font.body};
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
  line-height: 1.5;
  flex: 1;
`;

const SCardBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SCategoryTag = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${(props) => props.$color};
`;

const SBestScore = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.08em;
`;

const SEmpty = styled.div`
  text-align: center;
  padding: ${theme.space[7]}px;
  color: ${theme.colors.textMuted};
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
`;
