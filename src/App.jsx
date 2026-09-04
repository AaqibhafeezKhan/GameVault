import { Suspense, lazy, createContext, useMemo } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "./styles/theme";
import GlobalStyle from "./styles/GlobalStyle";
import Navbar from "./components/Navbar/Navbar";
import HomePage from "./components/HomePage/HomePage";
import GameShell from "./components/GameShell/GameShell";
import { gamesData } from "./data/gamesData";
import { useLocalStorage } from "./hooks/useLocalStorage";

export const ThemeModeContext = createContext(null);

const GameComponents = {
  "tic-tac-toe": lazy(() => import("./games/TicTacToe")),
  "rock-paper-scissors": lazy(() => import("./games/RPSLizardSpock")),
  snake: lazy(() => import("./games/Snake")),
  "memory-game": lazy(() => import("./games/MemoryGame")),
  "whack-a-mole": lazy(() => import("./games/WhackAMole")),
  pong: lazy(() => import("./games/Pong")),
  "flappy-bird": lazy(() => import("./games/FlappyBird")),
  2048: lazy(() => import("./games/Game2048")),
  breakout: lazy(() => import("./games/Breakout")),
  "simon-says": lazy(() => import("./games/SimonSays")),
  hangman: lazy(() => import("./games/Hangman")),
  "quiz-game": lazy(() => import("./games/QuizGame")),
  "platform-jumper": lazy(() => import("./games/PlatformJumper")),
  "catch-falling": lazy(() => import("./games/CatchFalling")),
  "maze-game": lazy(() => import("./games/MazeGame")),
  "space-invaders": lazy(() => import("./games/SpaceInvaders")),
  tetris: lazy(() => import("./games/Tetris")),
  "guess-number": lazy(() => import("./games/GuessNumber")),
  "balloon-pop": lazy(() => import("./games/BalloonPop")),
  "color-match": lazy(() => import("./games/ColorMatch")),
  "sliding-puzzle": lazy(() => import("./games/SlidingPuzzle")),
  "reaction-test": lazy(() => import("./games/ReactionTest")),
  "word-search": lazy(() => import("./games/WordSearch")),
  sudoku: lazy(() => import("./games/Sudoku")),
  connect4: lazy(() => import("./games/Connect4")),
  "lights-out": lazy(() => import("./games/LightsOut")),
  "typing-speed": lazy(() => import("./games/TypingSpeed")),
  asteroids: lazy(() => import("./games/Asteroids")),
  "racing-game": lazy(() => import("./games/RacingGame")),
  match3: lazy(() => import("./games/Match3")),
  "rps-lizard-spock": lazy(() => import("./games/RPSLizardSpock")),
  "number-memory": lazy(() => import("./games/NumberMemory")),
  pinball: lazy(() => import("./games/Pinball")),
  "spelling-bee": lazy(() => import("./games/SpellingBee")),
  "shape-shooter": lazy(() => import("./games/ShapeShooter")),
  "word-scramble": lazy(() => import("./games/WordScramble")),
  "virtual-pet": lazy(() => import("./games/VirtualPet")),
  frogger: lazy(() => import("./games/Frogger")),
  helicopter: lazy(() => import("./games/Helicopter")),
  bingo: lazy(() => import("./games/Bingo")),
  "wheel-of-fortune": lazy(() => import("./games/WheelOfFortune")),
  "trivia-quiz": lazy(() => import("./games/TriviaQuiz")),
  minesweeper: lazy(() => import("./games/Minesweeper")),
  checkers: lazy(() => import("./games/Checkers")),
  "card-war": lazy(() => import("./games/CardWar")),
  "infinite-runner": lazy(() => import("./games/InfiniteRunner")),
  "bouncing-ball": lazy(() => import("./games/BouncingBall")),
  "catch-butterfly": lazy(() => import("./games/CatchButterfly")),
  "number-sequence": lazy(() => import("./games/NumberSequence")),
  "word-search-adv": lazy(() => import("./games/WordSearchAdv")),
  "simon-color": lazy(() => import("./games/SimonColor")),
  blackjack: lazy(() => import("./games/Blackjack")),
  "math-challenge": lazy(() => import("./games/MathChallenge")),
  wordle: lazy(() => import("./games/Wordle")),
  "dino-run": lazy(() => import("./games/DinoRun")),
};

function GameRoute({ game }) {
  const Component = GameComponents[game.slug];
  if (!Component) return null;
  return (
    <GameShell title={game.title}>
      <Suspense fallback={<SuspenseFallback />}>
        <Component />
      </Suspense>
    </GameShell>
  );
}

function SuspenseFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 300,
      }}
    >
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          color: "#6b6b8a",
          fontSize: "0.875rem",
        }}
      >
        Loading...
      </span>
    </div>
  );
}

export default function App() {
  // Forced to false for now as per user request to keep theme bright
  const [isDark, setIsDark] = useLocalStorage("gv_theme_dark", false);
  const forcedIsDark = false;
  const activeTheme = useMemo(
    () => (forcedIsDark ? darkTheme : lightTheme),
    [forcedIsDark],
  );

  return (
    <ThemeModeContext.Provider value={{ isDark, setIsDark }}>
      <ThemeProvider theme={activeTheme}>
        <GlobalStyle />
        <HashRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            {gamesData.map((game) => (
              <Route
                key={game.slug}
                path={`/game/${game.slug}`}
                element={<GameRoute game={game} />}
              />
            ))}
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
