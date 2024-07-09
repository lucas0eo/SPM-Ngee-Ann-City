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
                    board[row][col] = letter;
                    updatePoints(); // Update points after placing the letter
                    updateRandomLetters();
                    pointsElement.textContent = score; // Update points display
                    coinsElement.textContent = coins; // Update coins display
                    printBoard();

                    // Check if arcade / free mode should end after placing this letter
                    if (currentGameMode == 'arcade'){
                        if (coins == 0){
                            alert(`Game Ended! Your score: ${score}`);
                        }
                    } 

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

     function demolishBuilding(coord) {
        const [row, col] = convertCoord(coord);
        if (row !== null && col !== null && board[row][col] !== ' ') {
            if (coins > 1) {
                const building = board[row][col];
                board[row][col] = ' ';
                coins -= 1; // Deduct 1 coin for demolition

                pointsElement.textContent = score; // Update points display
                coinsElement.textContent = coins; // Update coins display
                printBoard();

                alert("Building demolished.");
            } else {
                alert("Not enough coins to demolish the building.");
            }
        } else {
            alert("No building detected at the given coordinates.");
        }
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

    function calculateResidentialScore(board, row, col) {
        let adjacentIndustryCount = countAdjacent(board, row, col, 'I');
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');
        let adjacentCommercialCount = countAdjacent(board, row, col, 'C');
        let adjacentParkCount = countAdjacent(board, row, col, 'O');

        if (adjacentIndustryCount > 0) {
            return 1;
        } else {
            return adjacentResidentialCount + adjacentCommercialCount + (adjacentParkCount * 2);
        }
    }

    function calculateIndustryScore(board, row, col) {
        let score = board.flat().filter(cell => cell === 'I').length;
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');
        coins += adjacentResidentialCount;
        return score;
    }

    function calculateCommercialScore(board, row, col) {
        let adjacentCommercialCount = countAdjacent(board, row, col, 'C');
        let adjacentResidentialCount = countAdjacent(board, row, col, 'R');

        
        coins += adjacentResidentialCount;
        return adjacentCommercialCount;
    }

    function calculateParkScore(board, row, col) {
        let adjacentParkCount = countAdjacent(board, row, col, 'O');
        return adjacentParkCount;
    }

    function calculateRoadScore(board, row, col) {
        let roadCount = 0;
        for (let c = 0; c < boardSize; c++) {
            if (board[row][c] === '*') {
                roadCount++;
            }
        }
        return roadCount;
    }

    function updatePoints() {
        score = 0; // Reset score before recalculating

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] != ' ') {
                    switch (board[r][c]) {
                        case 'R':
                            score += calculateResidentialScore(board, r, c);
                            break;
                        case 'I':
                            score += calculateIndustryScore(board, r, c);
                            break;
                        case 'C':
                            score += calculateCommercialScore(board, r, c);
                            break;
                        case 'O':
                            score += calculateParkScore(board, r, c);
                            break;
                        case '*':
                            score += calculateRoadScore(board, r, c);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    placeLetterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const coord = document.getElementById('coordinate').value.trim();
        const letter = document.getElementById('letter').value.trim();
    
        const result = placeLetter(coord, letter);
        if (result.bool) {
            sessionStorage.setItem(FREE_PLAY_KEY, JSON.stringify({
                score,
                coins,
                board
            }));
            sessionStorage.setItem(ARCADE_KEY, JSON.stringify({
                score,
                coins,
                board
            }));
        }
    });

    // function loadGame() {
    //     const freePlayState = sessionStorage.getItem(FREE_PLAY_KEY);
    //     const arcadeState = sessionStorage.getItem(ARCADE_KEY);

    //     if (referrer === 'freeplay.html' && freePlayState) {
    //         const { score: loadedScore, coins: loadedCoins, board: loadedBoard } = JSON.parse(freePlayState);
    //         score = loadedScore;
    //         coins = loadedCoins;
    //         board = loadedBoard;
    //         pointsElement.textContent = score;
    //         coinsElement.textContent = coins;
    //         currentGameMode = 'freeplay';
    //     } else if (referrer === 'arcade.html' && arcadeState) {
    //         const { score: loadedScore, coins: loadedCoins, board: loadedBoard } = JSON.parse(arcadeState);
    //         score = loadedScore;
    //         coins = loadedCoins;
    //         board = loadedBoard;
    //         pointsElement.textContent = score;
    //         coinsElement.textContent = coins;
    //         currentGameMode = 'arcade';
    //     }
    //     printBoard();
    // }
    function saveGame() {
        const check = localStorage.getItem('check')
        const fileName = prompt('Enter a file name to save the game:');
        if (fileName !== check){
        if (!fileName) {
            alert('File name cannot be empty!');
            return;
        }
        const gameState = {
            mode: 'arcade',
            board,
            boardSize,
            score,
            coins,
        };
        const saveKey = `${fileName}`;
        localStorage.setItem('check',fileName)
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        alert('Game saved!');
        return true;
    }else{
        alert("Cannot have 2 same file names")
        return false;
    }
    }

    function loadGame() {
        const saveKey1 = localStorage.getItem('name')
        const gameState = JSON.parse(localStorage.getItem(saveKey1));
        if (gameState) {
            board = gameState.board;
            boardSize = gameState.boardSize;
            profit = gameState.profit;
            upkeep = gameState.upkeep;
            turnsExceeded = gameState.turnsExceeded;
            printBoard();
            alert('Game loaded!');
        }
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


    document.getElementById('saveGame').addEventListener('click', function () {
        if (isBoardEmpty()) {
            alert("Cannot save an empty board");
            return;
        } else {
            if(saveGame()){
                fadeOutAndNavigate('mainpage.html');
            }
            sessionStorage.setItem('from','a')
            }
    });

    document.getElementById('loadGame').addEventListener('click', function () {
        loadGame();
    });

    document.getElementById('back').addEventListener('click', function () {
        fadeOutAndNavigate('mainpage.html');
    });


    if (referrer === 'arcadeGame') {
        loadGame();
        sessionStorage.removeItem('referrer');
    }

    function fadeOutAndNavigate(targetUrl) {
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        setTimeout(function () {
            window.location.href = targetUrl;
        }, 2000);
    }
 
    
    printBoard();

});




