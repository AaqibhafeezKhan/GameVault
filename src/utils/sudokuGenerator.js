function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solve(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
          () => Math.random() - 0.5,
        );
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSudoku(clues) {
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  solve(solution);
  const puzzle = solution.map((row) => [...row]);
  let removed = 81 - clues;
  const positions = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) positions.push([r, c]);
  const shuffled = positions.sort(() => Math.random() - 0.5);
  for (let i = 0; i < removed; i++) {
    const [r, c] = shuffled[i];
    puzzle[r][c] = 0;
  }
  return { puzzle, solution };
}

export function validateSudoku(board) {
  const conflicts = Array.from({ length: 9 }, () => Array(9).fill(false));
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val === 0) continue;
      for (let i = 0; i < 9; i++) {
        if (i !== col && board[row][i] === val) {
          conflicts[row][col] = true;
          conflicts[row][i] = true;
        }
        if (i !== row && board[i][col] === val) {
          conflicts[row][col] = true;
          conflicts[i][col] = true;
        }
      }
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if ((r !== row || c !== col) && board[r][c] === val) {
            conflicts[row][col] = true;
            conflicts[r][c] = true;
          }
        }
      }
    }
  }
  return conflicts;
}
