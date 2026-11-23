(() => {
  const SIZE = 9;
  const MINE_COUNT = 10;
  const windowElement = document.querySelector('#minesweeper-window');
  const boardElement = document.querySelector('#minesweeper-board');
  const mineCounter = document.querySelector('#minesweeper-mines');
  const timerDisplay = document.querySelector('#minesweeper-timer');
  const resetButton = document.querySelector('#minesweeper-reset');
  const closeButton = windowElement.querySelector('.minesweeper-close');

  let cells = [];
  let flags = 0;
  let revealedSafeCells = 0;
  let elapsedSeconds = 0;
  let gameState = 'ready';
  let timerId = null;

  const formatCounter = (value) => {
    const sign = value < 0 ? '-' : '';
    return `${sign}${String(Math.abs(value)).padStart(3, '0')}`;
  };

  const updateCounters = () => {
    mineCounter.value = formatCounter(MINE_COUNT - flags);
    mineCounter.textContent = formatCounter(MINE_COUNT - flags);
    timerDisplay.value = formatCounter(Math.min(elapsedSeconds, 999));
    timerDisplay.textContent = formatCounter(Math.min(elapsedSeconds, 999));
  };

  const stopTimer = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = () => {
    if (timerId !== null) return;
    timerId = window.setInterval(() => {
      elapsedSeconds = Math.min(elapsedSeconds + 1, 999);
      timerDisplay.value = formatCounter(elapsedSeconds);
      timerDisplay.textContent = formatCounter(elapsedSeconds);
      if (elapsedSeconds === 999) stopTimer();
    }, 1000);
  };

  const neighborsOf = (index) => {
    const row = Math.floor(index / SIZE);
    const column = index % SIZE;
    const neighbors = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) continue;
        const neighborRow = row + rowOffset;
        const neighborColumn = column + columnOffset;
        if (neighborRow >= 0 && neighborRow < SIZE && neighborColumn >= 0 && neighborColumn < SIZE) {
          neighbors.push(neighborRow * SIZE + neighborColumn);
        }
      }
    }
    return neighbors;
  };

  const renderCell = (index) => {
    const cell = cells[index];
    const button = boardElement.children[index];
    button.classList.toggle('is-open', cell.revealed);
    button.classList.toggle('is-flagged', cell.flagged);
    button.classList.toggle('is-mine', cell.revealed && cell.mine);
    button.disabled = cell.revealed || gameState === 'lost' || gameState === 'won';

    let label = `숨겨진 칸 ${Math.floor(index / SIZE) + 1}, ${index % SIZE + 1}`;
    let content = '';
    if (cell.flagged && !cell.revealed) {
      content = '🚩';
      label = `깃발 표시된 칸 ${Math.floor(index / SIZE) + 1}, ${index % SIZE + 1}`;
    } else if (cell.revealed && cell.mine) {
      content = '💣';
      label = '지뢰';
    } else if (cell.revealed && cell.adjacentMines > 0) {
      content = String(cell.adjacentMines);
      label = `인접 지뢰 ${cell.adjacentMines}개`;
      button.dataset.number = String(cell.adjacentMines);
    } else {
      delete button.dataset.number;
      if (cell.revealed) label = '빈 칸';
    }
    button.textContent = content;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-selected', String(cell.revealed));
  };

  const renderBoard = () => {
    boardElement.replaceChildren();
    cells.forEach((_, index) => {
      const button = document.createElement('button');
      button.className = 'minesweeper-cell';
      button.type = 'button';
      button.setAttribute('role', 'gridcell');
      button.dataset.index = String(index);
      button.addEventListener('click', () => revealCell(index));
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        toggleFlag(index);
      });
      boardElement.append(button);
      renderCell(index);
    });
  };

  const createBoard = () => {
    cells = Array.from({ length: SIZE * SIZE }, () => ({
      mine: false,
      adjacentMines: 0,
      revealed: false,
      flagged: false
    }));
    const minePositions = new Set();
    while (minePositions.size < MINE_COUNT) {
      minePositions.add(Math.floor(Math.random() * cells.length));
    }
    minePositions.forEach((index) => {
      cells[index].mine = true;
    });
    cells.forEach((cell, index) => {
      if (!cell.mine) {
        cell.adjacentMines = neighborsOf(index).filter((neighbor) => cells[neighbor].mine).length;
      }
    });
  };

  const setFace = (face) => {
    resetButton.textContent = face;
  };

  const finishGame = (result) => {
    gameState = result;
    stopTimer();
    if (result === 'lost') {
      setFace('😵');
      cells.forEach((cell) => {
        if (cell.mine) cell.revealed = true;
      });
    } else {
      setFace('😎');
    }
    cells.forEach((_, index) => renderCell(index));
  };

  const revealEmptyRegion = (startIndex) => {
    const pending = [startIndex];
    const visited = new Set();
    while (pending.length > 0) {
      const index = pending.pop();
      if (visited.has(index)) continue;
      visited.add(index);
      const cell = cells[index];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      revealedSafeCells += 1;
      if (cell.adjacentMines === 0) {
        neighborsOf(index).forEach((neighbor) => {
          if (!visited.has(neighbor)) pending.push(neighbor);
        });
      }
    }
  };

  function revealCell(index) {
    if (gameState === 'lost' || gameState === 'won') return;
    const cell = cells[index];
    if (cell.revealed || cell.flagged) return;
    if (gameState === 'ready') {
      gameState = 'playing';
      startTimer();
    }
    if (cell.mine) {
      cell.revealed = true;
      finishGame('lost');
      return;
    }
    if (cell.adjacentMines === 0) {
      revealEmptyRegion(index);
    } else {
      cell.revealed = true;
      revealedSafeCells += 1;
    }
    cells.forEach((_, cellIndex) => renderCell(cellIndex));
    if (revealedSafeCells === SIZE * SIZE - MINE_COUNT) finishGame('won');
  }

  const toggleFlag = (index) => {
    if (gameState === 'lost' || gameState === 'won') return;
    const cell = cells[index];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    updateCounters();
    renderCell(index);
  };

  const reset = () => {
    stopTimer();
    flags = 0;
    revealedSafeCells = 0;
    elapsedSeconds = 0;
    gameState = 'ready';
    setFace('🙂');
    createBoard();
    renderBoard();
    updateCounters();
  };

  const close = () => {
    windowElement.style.display = 'none';
    windowElement.setAttribute('aria-hidden', 'true');
    stopTimer();
  };

  const open = () => {
    reset();
    windowElement.style.display = 'grid';
    windowElement.setAttribute('aria-hidden', 'false');
  };

  resetButton.addEventListener('click', reset);
  closeButton.addEventListener('click', close);
  windowElement.addEventListener('click', (event) => {
    if (event.target === windowElement) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && windowElement.style.display !== 'none') close();
  });

  reset();
  window.Minesweeper = Object.freeze({ open, close, reset });
})();
