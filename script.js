//Arcade.js
document.addEventListener('DOMContentLoaded', function () {
    let score = 0;
    let coins = 2;
    let boardSize = 20;
    const stickyBar = document.getElementById('sticky-bar');
    stickyBar.style.position = 'fixed';
    stickyBar.style.bottom = '0';
    let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(' '));
    const gridContainer = document.getElementById('grid');
    const pointsElement = document.getElementById('points');
    const coinsElement = document.getElementById('coins');

    let referrer = sessionStorage.getItem('referrer');
    let boardNotEmpty = false;
    let currentGameMode = 'arcade';
    let selectedLetter = ''; // Variable to hold the currently selected letter

    const demolishButton = document.createElement('button');
    demolishButton.textContent = 'Demolish';
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
                cell.addEventListener('click', function () {
                    if (demolishMode) {
                        demolishBuilding(r, c);
                        demolishButton.classList.remove('highlight');
                        demolishMode=false;
                        check = isBoardEmpty();
                        if (check === true){
                            boardNotEmpty = false;
                            console.log("HI")
                        }
                    } else if (board[r][c] === ' ') {
                        if (!isPlaceable(r, c)) {
                            alert("You can only build on squares that are connected to existing buildings.");
                        } else if (selectedLetter === '') {
                            alert('Please select a letter from the sticky bar.');
                        } else {
                            // Check if the game should end before placing the building
                            if (endGameIfNeeded()) {
                                return; // Exit the function if the game has ended
                            }
                
                            boardNotEmpty = true;
                            coins--;
                            board[r][c] = selectedLetter;
                            pointsElement.textContent = score;
                            coinsElement.textContent = coins;
                            updatePoints();
                            updateStickyBar();
                            printBoard();
                
                            // Check again if the game should end after placing the building
                            endGameIfNeeded();
                        }
                    } else {
                        alert("This cell is already occupied.");
                    }
                });
                gridContainer.appendChild(cell);
            }
        }
        highlightPlaceableCells();
    }
    //  function demolishBuilding(coord) {
    //     const [row, col] = convertCoord(coord);
    //     if (row !== null && col !== null && board[row][col] !== ' ') {
    //         if (coins > 1) {
    //             const building = board[row][col];
    //             board[row][col] = ' ';
    //             coins -= 1; // Deduct 1 coin for demolition

    //             pointsElement.textContent = score; // Update points display
    //             coinsElement.textContent = coins; // Update coins display
    //             printBoard();

    //             alert("Building demolished.");
    //         } else {
    //             alert("Not enough coins to demolish the building.");
    //         }
    //     } else {
    //         alert("No building detected at the given coordinates.");
    //     }
    // }
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
    function demolishBuilding(row, col) {
        if (board[row][col] !== ' ') {
            board[row][col] = ' ';
            updatePoints();
            printBoard();
        }else{
            alert('Cannot demolish an empty space!');
        }
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
        console.log(saveKey)
        alert('Game saved!');
        return true;
    }else{
        alert("Cannot have 2 same file names")
        return false;
    }
    }

    function loadGame() {
        const saveKey1 = localStorage.getItem('check')
        const gameState = JSON.parse(localStorage.getItem(saveKey1));
        if (gameState) {
            board = gameState.board;
            boardSize = gameState.boardSize;
            profit = gameState.profit;
            upkeep = gameState.upkeep;
            turnsExceeded = gameState.turnsExceeded;
            printBoard();
             highlightPlaceableCells();
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


    function isBoardFull() {
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] === ' ') {
                    return false; // Found an empty space, board is not full
                }
            }
        }
        return true; // No empty spaces found, board is full
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
        // Adjust sticky bar based on scroll position
        window.addEventListener('scroll', function () {
            const gridRect = gridContainer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
    
            if (gridRect.bottom < viewportHeight) {
                stickyBar.style.removeProperty('position');
                stickyBar.style.removeProperty('bottom');
            } else {
                stickyBar.style.position = 'fixed';
                stickyBar.style.bottom = '0';
            }
        });
        
        function endGameIfNeeded() {
            if (currentGameMode == 'arcade' && (coins <= 0 || isBoardFull())) {
                console.log("Game ending. Score:", score);
                alert(`Game Ended! Your score: ${score}`);
                UpdateLeaderBoard(score);
                return true; // Game has ended
            }
            return false; // Game continues
        }
    // Function to get 2 random letters from an array of 5 letters
    function getRandomLetters() {
        const letters = ['R', 'I', 'C', 'O', '*']; // Array of 5 letters
        const randomIndices = [];
        while (randomIndices.length < 2) {
            const randomIndex = Math.floor(Math.random() * letters.length);
            if (!randomIndices.includes(randomIndex)) {
                randomIndices.push(randomIndex);
            }
        }
        return [letters[randomIndices[0]], letters[randomIndices[1]]];
    }

    // Update sticky bar with random letters
    function updateStickyBar() {
        const [letter1, letter2] = getRandomLetters();
        stickyBar.innerHTML = ''; // Clear previous content
        const letterSpan1 = document.createElement('span');
        letterSpan1.textContent = letter1;
        letterSpan1.addEventListener('click', function () {
            letterSpan1.classList.toggle('selected-letter');
            letterSpan2.classList.remove('selected-letter');
            selectedLetter = letter1;
            demolishMode = false;
        });
        const letterSpan2 = document.createElement('span');
        letterSpan2.textContent = letter2;
        letterSpan2.addEventListener('click', function () {
            letterSpan2.classList.toggle('selected-letter');
            letterSpan1.classList.remove('selected-letter');
            selectedLetter = letter2;
            demolishMode = false;
        });
        stickyBar.appendChild(letterSpan1);
        stickyBar.appendChild(letterSpan2);
        // Add demolish button
        demolishButton.addEventListener('click', function () {
            document.querySelectorAll('.selected-letter').forEach(el => el.classList.remove('selected-letter'));
            demolishMode = true;
            selectedLetter = '';
            demolishButton.classList.add('highlight');

        });
        stickyBar.appendChild(demolishButton);

    }
    // Highlight Placeable tiles
    function isPlaceable(row, col) {
        if (!boardNotEmpty) {
            return true; // First building can be placed anywhere
        }
        return isAdjacentOccupied(row, col);
    }

    function highlightPlaceableCells() {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            if (board[row][col] === ' ' && isPlaceable(row, col)) {
                cell.classList.add('placeable');
            } else {
                cell.classList.remove('placeable');
            }
        });
    }

   async function UpdateLeaderBoard(score) {
    const APIKEY = '6598fa970b0868856f232bcb';
    const settings = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-apikey": APIKEY,
            "Cache-Control": "no-cache"
        }
    };

    try {
        const response = await fetch("https://frontenddev-975b.restdb.io/rest/ngee-ann-city-leaderboard", settings);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Fetched leaderboard data:", data);

        // Filter data where mode is "arcade"
        const arcadeEntries = data.filter(entry => entry.mode === "arcade");

        // Sort arcadeEntries from highest to lowest score
        arcadeEntries.sort((a, b) => b.score - a.score);

        // Check if the new score is high enough to be in the top 10
        const isTopScore = arcadeEntries.length < 10 || score > arcadeEntries[9].score;

        if (isTopScore) {
            // Prompt for username
            const username = prompt("Congratulations! You've made it to the top 10. Please enter your name:");
            
            if (username) {
                const newEntry = {
                    username: username,
                    score: score,
                    mode: "arcade"
                };

                const settings_Post = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-apikey": APIKEY,
                        "Cache-Control": "no-cache"
                    },
                    body: JSON.stringify(newEntry)
                };

                const postResponse = await fetch("https://frontenddev-975b.restdb.io/rest/ngee-ann-city-leaderboard", settings_Post);
                if (!postResponse.ok) {
                    throw new Error('Error updating leaderboard');
                }

                alert("Your score has been added to the leaderboard!");
                fadeOutAndNavigate('mainpage.html');
            }
        } else {
            alert("Great game! Unfortunately, your score didn't make it to the top 10 this time.");
        }

    } catch (error) {
        console.error("There was a problem updating the leaderboard:", error);
    }
}

updateStickyBar()
 printBoard()
    
});







