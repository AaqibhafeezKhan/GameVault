const shared = {
  categories: {
    Arcade: "#fc5c7d",
    Puzzle: "#7c5cfc",
    Card: "#3ef0a1",
    Word: "#f0c93e",
    Reflex: "#5cc8fc",
    Strategy: "#fc9c5c",
  },
  font: {
    display: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
    body: "'Inter', sans-serif",
  },
  radius: { sm: "4px", md: "8px", lg: "16px" },
  space: [0, 4, 8, 16, 24, 32, 48, 64],
};

export const lightTheme = {
  ...shared,
  colors: {
    bg: "#f4f4f8",
    surface: "#ffffff",
    surfaceAlt: "#eaeaf0",
    border: "#d0d0db",
    accent: "#6a4cee",
    accentAlt: "#eb486a",
    text: "#111116",
    textMuted: "#5a5a75",
    success: "#1cb875",
    warning: "#d6a715",
    danger: "#e23e3e",
  },
};

export const darkTheme = {
  ...shared,
  colors: {
    bg: "#0a0a0f",
    surface: "#13131a",
    surfaceAlt: "#1c1c27",
    border: "#2a2a3d",
    accent: "#7c5cfc",
    accentAlt: "#fc5c7d",
    text: "#e8e8f0",
    textMuted: "#6b6b8a",
    success: "#3ef0a1",
    warning: "#f0c93e",
    danger: "#f05c5c",
  },
};

// Fallback for any direct imports of 'theme' just in case (though styled-components should use the Provider)
export const theme = darkTheme;
