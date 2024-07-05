document.addEventListener('DOMContentLoaded', function () {
    let score = 0;
    let coins = 16;
    let boardSize = 20;
    let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(' '));
    const gridContainer = document.getElementById('grid');
    const placeLetterForm = document.getElementById('placeLetterForm');
    const randomLetter1Element = document.getElementById('randomLetter1');
    const randomLetter2Element = document.getElementById('randomLetter2');
    const pointsElement = document.getElementById('points');
    const coinsElement = document.getElementById('coins');

    let referrer = sessionStorage.getItem('referrer');
    let boardNotEmpty = false;

    const FREE_PLAY_KEY = 'freePlayGridGameState';
    const ARCADE_KEY = 'arcadeGridGameState';
    let currentGameMode = 'arcade';

    let [randomLetter1, randomLetter2] = getRandomLetters();

    function getRandomLetters() {
        const letters = ['R', 'I', 'C', 'O', '*'];
        const randomLetters = [];
        while (randomLetters.length < 2) {
            const letter = letters[Math.floor(Math.random() * letters.length)];
            if (!randomLetters.includes(letter)) {
                randomLetters.push(letter);
            }
        }
        return randomLetters;
    }

    function updateRandomLetters() {
        [randomLetter1, randomLetter2] = getRandomLetters();
        randomLetter1Element.textContent = `Letter 1: ${randomLetter1}`;
        randomLetter2Element.textContent = `Letter 2: ${randomLetter2}`;
    }

    randomLetter1Element.textContent += randomLetter1;
    randomLetter2Element.textContent += randomLetter2;

    function printBoard() {
        console.log("Printing board...");
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${boardSize + 1}, 30px)`;

        const columnHeaders = document.createElement('div');
        columnHeaders.classList.add('grid-header');
        columnHeaders.textContent = ' ';
        gridContainer.appendChild(columnHeaders);

        for (let i = 0; i < boardSize; i++) {
            const headerCell = document.createElement('div');
            headerCell.classList.add('grid-header');
            headerCell.textContent = i + 1;
            gridContainer.appendChild(headerCell);
        }

        for (let r = 0; r < boardSize; r++) {
            const rowHeader = document.createElement('div');
            rowHeader.classList.add('grid-header');
            rowHeader.textContent = String.fromCharCode(65 + r);
            gridContainer.appendChild(rowHeader);

            for (let c = 0; c < boardSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.textContent = board[r][c];
                gridContainer.appendChild(cell);
            }
        }
    }

    function convertCoord(coord) {
        const regex = /^([A-Za-z])(\d+)$/;
        const match = coord.match(regex);
        if (!match) return [null, null];
        const row = match[1].toUpperCase().charCodeAt(0) - 65;
        const col = parseInt(match[2], 10) - 1;
        if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
            return [row, col];
        } else {
            return [null, null];
        }
    }

    function placeLetter(coord, letter) {
        let result = { score, coins };
        const [row, col] = convertCoord(coord);
        if (row !== null && col !== null && board[row][col] === ' ') {
            if (letter === randomLetter1 || letter === randomLetter2) {
                if (!boardNotEmpty || isAdjacentOccupied(row, col)) {
                    boardNotEmpty = true;
                    coins--; // Deduct 1 coin per construction
                    let prevScore = score;
                    if (letter === "R") {
                        result = calculateResidentialScore(board, row, col, score, coins);
                    } else if (letter === "I") {
                        result = calculateIndustryScore(board, row, col, score, coins);
                    } else if (letter === "C") {
                        result = calculateCommercialScore(board, row, col, score, coins);
                    } else if (letter === "O") {
                        result = calculateParkScore(board, row, col, score, coins);
                    } else if (letter === "*") {
                        result = calculateRoadScore(board, row, col, score, coins);
                    }
                    score = prevScore + result.score; // Add new score to previous score
                    coins = result.coins;
                    board[row][col] = letter;
                    updateRandomLetters();
                    pointsElement.textContent = score; // Update points display
                    coinsElement.textContent = coins; // Update coins display
                    printBoard();
                    return { info: result, bool: true };
                } else {
                    alert("Letter must be placed adjacent to a previously placed letter.");
                }
            } else {
                alert("Invalid letter selected.");
            }
        } else {
            alert("Invalid coordinate or cell already occupied.");
        }
        return { bool: false };
    }

    function isBoardEmpty() {
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] !== ' ') {
                    return false;
                }
            }
        }
        return true;
    }

    function isAdjacentOccupied(row, col) {
        if (isBoardEmpty()) {
            return false;
        }
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                if (board[newRow][newCol] !== ' ') {
                    return true;
                }
            }
        }
        return false;
    }

    function countAdjacent(board, row, col, type) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        let count = 0;
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                if (board[newRow][newCol] === type) {
                    count++;
                }
            }
        }
        return count;
    }

    function calculateResidentialScore(board, row, col, score, coins) {
        let adjacentIndustryCount = countAdjacent(board, row, col, 'I');
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');
        let adjacentCommercialCount = countAdjacent(board, row, col, 'C');
        let adjacentParkCount = countAdjacent(board, row, col, 'O');

        if (adjacentIndustryCount > 0) {
            score += 1;
        } else {
            score += adjacentResidentialCount;
            score += adjacentCommercialCount;
            score += adjacentParkCount * 2;
        }
        return { score, coins };
    }

    function calculateIndustryScore(board, row, col, score, coins) {
        score += board.flat().filter(cell => cell === 'I').length;
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');
        coins += adjacentResidentialCount;
        return { score, coins };
    }

    function calculateCommercialScore(board, row, col, score, coins) {
        let adjacentCommercialCount = countAdjacent(board, row, col, 'C');
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');

        score += adjacentCommercialCount;
        coins += adjacentResidentialCount;
        return { score, coins };
    }

    function calculateParkScore(board, row, col, score, coins) {
        let adjacentParkCount = countAdjacent(board, row, col, 'O');
        score += adjacentParkCount;
        return { score, coins };
    }

    function calculateRoadScore(board, row, col, score, coins) {
        let roadCount = 0;
        for (let c = 0; c < boardSize; c++) {
            if (board[row][c] === '*') {
                roadCount++;
            }
        }
        score += roadCount;
        return { score, coins };
    }

    printBoard();

    placeLetterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const coordInput = document.getElementById('coordinate');
        const letterInput = document.getElementById('letter');
        const coord = coordInput.value.trim().toUpperCase();
        const letter = letterInput.value.trim().toUpperCase();
        if (coord && letter) {
            placeLetter(coord, letter);
        }
        coordInput.value = '';
        letterInput.value = '';
    });

    const saveGameButton = document.getElementById('saveGame');
    saveGameButton.addEventListener('click', function () {
        saveGame(currentGameMode);
        window.location.href = "mainpage.html";
    });

    const loadGameButton = document.getElementById('loadGame');
    loadGameButton.addEventListener('click', function () {
        loadGame(currentGameMode);
        printBoard();
    });

    const backButton = document.getElementById('back');
    backButton.addEventListener('click', function () {
        window.location.href = "mainpage.html";
    });

    function saveGame(mode) {
        const gameState = {
            board: board,
            score: score,
            coins: coins,
            randomLetter1: randomLetter1,
            randomLetter2: randomLetter2,
        };
        const key = mode === 'arcade' ? ARCADE_KEY : FREE_PLAY_KEY;
        localStorage.setItem(key, JSON.stringify(gameState));
    }

    function loadGame(mode) {
        const key = mode === 'arcade' ? ARCADE_KEY : FREE_PLAY_KEY;
        const gameState = JSON.parse(localStorage.getItem(key));
        if (gameState) {
            board = gameState.board;
            score = gameState.score;
            coins = gameState.coins;
            randomLetter1 = gameState.randomLetter1;
            randomLetter2 = gameState.randomLetter2;
            pointsElement.textContent = score; // Update points display
            coinsElement.textContent = coins; // Update coins display
        }
    }

    console.log('Game initialized.');
});
