import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { gamesData } from "../../data/gamesData";
import { ThemeModeContext } from "../../App";

const VAULT_LABEL = "GAMEVAULT";
const GAMES_COUNT = "50 GAMES";

export default function Navbar() {
  const location = useLocation();
  // const { isDark, setIsDark } = useContext(ThemeModeContext) || {}
  const isDark = false; // Forced to light theme for now

  const isGameRoute = location.pathname.startsWith("/game/");
  const slug = location.pathname.replace("/game/", "");
  const game = gamesData.find((g) => g.slug === slug);

  return (
    <SNav>
      <SInner>
        <SLogo to="/">{VAULT_LABEL}</SLogo>
        <SRight>
          {/* 
          <SThemeToggle onClick={() => setIsDark && setIsDark(prev => !prev)} title="Toggle Theme">
             {isDark ? '🌙' : '☀️'}
          </SThemeToggle> 
          */}
          {isGameRoute && game ? (
            <SBreadcrumb>
              <SBreadLink to="/">Home</SBreadLink>
              <SSlash>/</SSlash>
              <SBreadCurrent>{game.title}</SBreadCurrent>
            </SBreadcrumb>
          ) : (
            <SCount>{GAMES_COUNT}</SCount>
          )}
        </SRight>
      </SInner>
    </SNav>
  );
}

const SNav = styled.nav`
  width: 100%;
  background: ${theme.colors.surface};
  border-bottom: 1px solid ${theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const SInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${theme.space[4]}px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SLogo = styled(Link)`
  font-family: ${theme.font.display};
  font-weight: 700;
  font-size: 1.25rem;
  color: ${theme.colors.accent};
  letter-spacing: 0.05em;
  transition: opacity 150ms ease-out;
  &:hover {
    opacity: 0.8;
  }
`;

const SRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]}px;
`;

const SThemeToggle = styled.button`
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 150ms ease;
  &:hover {
    opacity: 1;
  }
`;

const SCount = styled.span`
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.08em;
`;

const SBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space[1]}px;
  font-family: ${theme.font.mono};
  font-size: 0.75rem;
`;

const SBreadLink = styled(Link)`
  color: ${theme.colors.textMuted};
  transition: color 150ms ease-out;
  &:hover {
    color: ${theme.colors.text};
  }
`;

const SSlash = styled.span`
  color: ${theme.colors.border};
`;

const SBreadCurrent = styled.span`
  color: ${theme.colors.text};
`;
