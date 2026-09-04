function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function carve(maze, x, y, width, height) {
  const directions = shuffle([
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
  ]);
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      nx > 0 &&
      nx < width - 1 &&
      ny > 0 &&
      ny < height - 1 &&
      maze[ny][nx] === 1
    ) {
      maze[y + dy / 2][x + dx / 2] = 0;
      maze[ny][nx] = 0;
      carve(maze, nx, ny, width, height);
    }
  }
}

export function generateMaze(cols, rows) {
  const width = cols % 2 === 0 ? cols + 1 : cols;
  const height = rows % 2 === 0 ? rows + 1 : rows;
  const maze = Array.from({ length: height }, () => Array(width).fill(1));
  maze[1][1] = 0;
  carve(maze, 1, 1, width, height);
  maze[1][0] = 0;
  maze[height - 2][width - 1] = 0;
  return maze;
}

export function bfsPath(maze, startX, startY, endX, endY) {
  const rows = maze.length;
  const cols = maze[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue = [[startX, startY]];
  visited[startY][startX] = true;

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    if (cx === endX && cy === endY) {
      const path = [];
      let cur = [endX, endY];
      while (cur) {
        path.unshift(cur);
        cur = parent[cur[1]][cur[0]];
      }
      return path;
    }
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (
        nx >= 0 &&
        nx < cols &&
        ny >= 0 &&
        ny < rows &&
        !visited[ny][nx] &&
        maze[ny][nx] === 0
      ) {
        visited[ny][nx] = true;
        parent[ny][nx] = [cx, cy];
        queue.push([nx, ny]);
      }
    }
  }
  return [];
}
