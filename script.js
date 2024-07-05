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

    // Define keys for saving game states
    const FREE_PLAY_KEY = 'freePlayGridGameState';
    const ARCADE_KEY = 'arcadeGridGameState';
    let currentGameMode = 'arcade';
    // Get initial random letters for the game
    let [randomLetter1, randomLetter2] = getRandomLetters();
    // Function to get random letters ['O', 'I', 'C', '*', 'R']
    function getRandomLetters() {
        const letters = ['I','R'];
        const randomLetters = [];
        while (randomLetters.length < 2) {
            const letter = letters[Math.floor(Math.random() * letters.length)];
            if (!randomLetters.includes(letter)) {
                randomLetters.push(letter);
            }
        }
        return randomLetters;
    }


    // Function to update and display random letters
    function updateRandomLetters() {
        [randomLetter1, randomLetter2] = getRandomLetters();
        randomLetter1Element.textContent = `Letter 1: ${randomLetter1}`;
        randomLetter2Element.textContent = `Letter 2: ${randomLetter2}`;
    }

    // Display initial random letters
    randomLetter1Element.textContent += randomLetter1;
    randomLetter2Element.textContent += randomLetter2;

    function printBoard() {
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
                    score = result.score; // Update score with result.score
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
            if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length) {
                if (board[newRow][newCol] === type) {
                    count++;
                }
            }
        }
        return count;
    }

    function calculateResidentialScore(board, row, col, score, coins) {
        const industryCount = countAdjacent(board, row, col, 'I');
        if (industryCount > 0) {
            score += 1;
        } else {
            const residentialCount = countAdjacent(board, row, col, 'R');
            const commercialCount = countAdjacent(board, row, col, 'C');
            const parkCount = countAdjacent(board, row, col, 'O');
            score += residentialCount + commercialCount + (2 * parkCount);
        }
        return { score, coins };
    }

    function calculateIndustryScore(board, row, col, score, coins) {
        const industryCount = countAdjacent(board, row, col, 'I');
        score += industryCount === 0 ? 1 : industryCount;
        coins += countAdjacent(board, row, col, 'R');
        return { score, coins };
    }

    function calculateCommercialScore(board, row, col, score, coins) {
        const commercialCount = countAdjacent(board, row, col, 'C');
        score += commercialCount;
        coins += countAdjacent(board, row, col, 'R');
        return { score, coins };
    }

    function calculateParkScore(board, row, col, score, coins) {
        score += countAdjacent(board, row, col, 'O');
        return { score, coins };
    }

    function calculateRoadScore(board, row, col, score, coins) {
        let connectedCount = 1;
        for (let i = col + 1; i < boardSize; i++) {
            if (board[row][i] === '*') {
                connectedCount++;
            } else {
                break;
            }
        }
        for (let i = col - 1; i >= 0; i--) {
            if (board[row][i] === '*') {
                connectedCount++;
            } else {
                break;
            }
        }
        score += connectedCount;
        return { score, coins };
    }

    placeLetterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const coordInput = document.getElementById('coordinate').value.trim();
        const letterInput = document.getElementById('letter').value.trim().toUpperCase();
        const result = placeLetter(coordInput, letterInput);
        if (result.bool) {
            score = result.info.score;
            coins = result.info.coins;
            pointsElement.textContent = score; // Update points display
            coinsElement.textContent = coins; // Update coins display
            printBoard();
        }
    });

    printBoard();
});

        // Save game state to local storage
        function saveGame() {
        const gameState = {
            mode: 'arcade',
            board,
            randomLetter1,
            randomLetter2
        };
        const saveKey = currentGameMode === 'arcade' ? FREE_PLAY_KEY : ARCADE_KEY;
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        alert('Game saved!');
    }

    // Load game state from local storage
    function loadGame() {
        const loadKey = currentGameMode === 'arcade' ? FREE_PLAY_KEY : ARCADE_KEY;//key for arcade, checks if loaded game is arcade mode
        const gameState = JSON.parse(localStorage.getItem(loadKey));
        if (gameState.mode !== currentGameMode) {
            alert('Error: Trying to load a game from a different mode!');
            return
        }
        if(!isBoardEmpty){//instance when you quit game and press continue, load empty board so its invalid
            alert('No saved game found!')
            window.location.href = 'mainpage.html'
            return
        }
        else if (gameState) {
            board = gameState.board;
            randomLetter1 = gameState.randomLetter1;
            randomLetter2 = gameState.randomLetter2;
            randomLetter1Element.textContent = `Letter 1: ${randomLetter1}`;
            randomLetter2Element.textContent = `Letter 2: ${randomLetter2}`;
            printBoard();
            alert('Game loaded!');
        } 
    }
    if (referrer === 'arcadeGame'){
        loadGame()
        sessionStorage.removeItem('referrer');
    }
    //save game button
    document.getElementById('saveGame').addEventListener('click', function () {
        // if (!isBoardEmpty){
        //     alert("Cannot save an empty board")
        // }else{
        saveGame();
        fadeOutAndNavigate('mainpage.html')
        //}
    });
    //load game button logic
    document.getElementById('loadGame').addEventListener('click', function () {
        loadGame();
    });
    document.getElementById('back').addEventListener('click', function () {
        fadeOutAndNavigate('mainpage.html')
    });
    function fadeOutAndNavigate(targetUrl) {
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        setTimeout(function () {
            window.location.href = targetUrl;
        }, 2000); // Wait for the transition to complete
    }



    function countAdjacent(board, row, col, type) {
            const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1], // up, down, left, right
        [-1, -1], [-1, 1], [1, -1], [1, 1] // diagonals
        ];
            let count = 0;
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length) {
                    if (board[newRow][newCol] === type) {
                        count++;
                    }
                }
            }
            return count;
        }
  
    // Function to calculate score for Industry (I) building
    function calculateIndustryScore(board, row, col,score,coins) {
        count = countAdjacent(board, row, col, 'I');
        if (count === 0){
            score+=1
        }
        else{
            score+=count
        }
        coins += countAdjacent(board, row, col, 'R');
        return{score, coins};
    }



    printBoard();
});


