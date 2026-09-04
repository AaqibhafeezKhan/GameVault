import { useRef, useEffect, useCallback, useState } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useGameShell } from "../../components/GameShell/GameShell";
import { useGameLoop } from "../../hooks/useGameLoop";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const BASKET_W = 80;
const BASKET_H = 20;
const ITEM_R = 16;
const LIVES = 5;
const POINTS = { Easy: 1, Medium: 2, Hard: 3 };
const BASE_SPEED = { Easy: 2, Medium: 3, Hard: 4 };

const ITEM_COLORS = ["#f0c93e", "#fc5c7d", "#3ef0a1", "#5cc8fc", "#fc9c5c"];
const ITEM_LABELS = ["🍎", "🍊", "🍋", "🍇", "🍓"];

function initialState(difficulty) {
  return {
    basket: { x: CANVAS_WIDTH / 2 - BASKET_W / 2, mouseX: CANVAS_WIDTH / 2 },
    items: [],
    lives: LIVES,
    score: 0,
    frame: 0,
    speed: BASE_SPEED[difficulty],
    caught: 0,
    keys: {},
    difficulty,
    alive: true,
  };
}

function spawnItem(state) {
  const colorIdx = Math.floor(Math.random() * ITEM_COLORS.length);
  state.items.push({
    x: ITEM_R + Math.random() * (CANVAS_WIDTH - ITEM_R * 2),
    y: -ITEM_R,
    colorIdx,
  });
}

function update(state, setScore, setGameOver) {
  state.frame++;
  const interval = Math.max(30, 60 - Math.floor(state.caught / 10) * 5);
  if (state.frame % interval === 0) spawnItem(state);

  if (state.keys["ArrowLeft"] || state.keys["KeyA"])
    state.basket.x = Math.max(0, state.basket.x - 6);
  if (state.keys["ArrowRight"] || state.keys["KeyD"])
    state.basket.x = Math.min(CANVAS_WIDTH - BASKET_W, state.basket.x + 6);
  state.basket.x = Math.max(
    0,
    Math.min(CANVAS_WIDTH - BASKET_W, state.basket.mouseX - BASKET_W / 2),
  );

  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    item.y += state.speed + Math.floor(state.caught / 10) * 0.3;

    const bx = state.basket.x;
    if (
      item.y + ITEM_R > CANVAS_HEIGHT - 50 &&
      item.x > bx &&
      item.x < bx + BASKET_W
    ) {
      state.items.splice(i, 1);
      state.caught++;
      state.score += POINTS[state.difficulty];
      setScore(state.score);
    } else if (item.y > CANVAS_HEIGHT + ITEM_R) {
      state.items.splice(i, 1);
      state.lives--;
      if (state.lives <= 0) {
        state.alive = false;
        setGameOver(true);
      }
    }
  }
}

function draw(ctx, state) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const item of state.items) {
    const c = ITEM_COLORS[item.colorIdx];
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(item.x, item.y, ITEM_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${ITEM_R * 1.4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ITEM_LABELS[item.colorIdx], item.x, item.y);
  }

  ctx.fillStyle = "#7c5cfc";
  ctx.beginPath();
  ctx.roundRect(state.basket.x, CANVAS_HEIGHT - 50, BASKET_W, BASKET_H, 6);
  ctx.fill();
  ctx.fillStyle = "#5a3dcc";
  ctx.fillRect(state.basket.x, CANVAS_HEIGHT - 50 + BASKET_H, BASKET_W, 10);

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = "#fc5c7d";
    ctx.beginPath();
    ctx.arc(16 + i * 22, 20, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textBaseline = "alphabetic";
}

export default function CatchFalling() {
  const [difficulty, setDifficulty] = useState(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const { setScore, setGameOver, paused } = useGameShell();

  const start = useCallback(
    (diff) => {
      stateRef.current = initialState(diff);
      setDifficulty(diff);
      setScore(0);
    },
    [setScore],
  );

  useGameLoop(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!paused && stateRef.current.alive)
      update(stateRef.current, setScore, setGameOver);
    draw(ctx, stateRef.current);
  }, !!difficulty);

  useEffect(() => {
    if (!difficulty) return;
    const onDown = (e) => {
      if (stateRef.current) stateRef.current.keys[e.code] = true;
    };
    const onUp = (e) => {
      if (stateRef.current) stateRef.current.keys[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      if (!stateRef.current) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.basket.mouseX = e.clientX - rect.left;
    };
    const onTouch = (e) => {
      e.preventDefault();
      if (!stateRef.current) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.basket.mouseX = e.touches[0].clientX - rect.left;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onTouch);
    };
  }, []);

  if (!difficulty) {
    return (
      <SDiffScreen>
        <SDiffTitle>Catch Falling Objects</SDiffTitle>
        <SDiffDesc>
          Move the basket to catch fruit before they hit the ground!
        </SDiffDesc>
        <SDiffButtons>
          {["Easy", "Medium", "Hard"].map((d) => (
            <SDiffBtn key={d} onClick={() => start(d)}>
              {d}
            </SDiffBtn>
          ))}
        </SDiffButtons>
      </SDiffScreen>
    );
  }

  return (
    <SCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
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
  max-width: 320px;
`;
const SDiffButtons = styled.div`
  display: flex;
  gap: ${theme.space[3]}px;
`;
const SDiffBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[2]}px ${theme.space[5]}px;
  font-family: ${theme.font.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 150ms ease-out;
  &:hover {
    background: ${theme.colors.accent};
    color: #fff;
  }
`;
const SCanvas = styled.canvas`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  touch-action: none;
`;
