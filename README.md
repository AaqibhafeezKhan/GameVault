# GameVault

A comprehensive collection of 50+ classic arcade, strategy, puzzle, and word games fully mapped and built as a single-page React application without placeholders, TypeScript, or external game engines.

## Overview

This project serves as an offline-capable browser arcade. Rather than routing to external engines, every game's logic, collision detection, procedural generation, and UI is written purely in ES2022 JavaScript and React hooks intuitively built from scratch.

All 54 minigames are dynamically chunked through React Suspense, meaning you download exactly what you need to play when you need it. High scores and persistent states automatically run off the unified internal namespace using LocalStorage wrappers. 

## Features

* **54 Playable Minigames:** Ranging from memory challenges and typing speed tests to classic physics and word searches. Notable titles include Snake, Tetris, Asteroids, Minesweeper, Game 2048, and Checkers. 
* **Self-Contained Components:** Each game controls its own specific tick-rate loops via RequestAnimationFrame hooks, ensuring minimal main-thread blocking.
* **Unified UI Shell:** A persistent wrapper handles overarching routing, pause capabilities, volume, and score history. 
* **Zero Configuration Routing:** Utilizing a structural hash router ensures immediate interoperability with most simple CDN caching layers like GitHub Pages.

## Tech Stack

* React 18
* Vite
* Styled-Components (v6)
* React-Router-DOM 

## Development

To spin up GameVault locally:

1. Clone the repository.
2. Run `npm install`
3. Run `npm run dev` to launch the arcade locally.

If you wish to augment existing templates, look inside the `src/games/` folder where each game is cleanly siloed in its own architectural slice `index.jsx`.

## Deployment

The project can be instantly built and published to `gh-pages`:

```bash
npm run deploy
```

The script will handle outputting production minified bundles via Vite and distributing them directly to the `gh-pages` configuration without manual syncing.
