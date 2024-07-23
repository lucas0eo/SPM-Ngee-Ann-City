//Freeplay
document.addEventListener('DOMContentLoaded', function () {
    let boardSize = 5;
    let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(' '));
    let gridContainer = document.getElementById('grid');
    let profitElement = document.getElementById('profit');
    let upkeepElement = document.getElementById('upkeep');
    let turnsExceededElement = document.getElementById('turnsExceeded');
    const scoreElement = document.getElementById('score');
    let referrer = sessionStorage.getItem('referrer');
    let boardNotEmpty = false;

    const stickyBar = document.getElementById('sticky-bar');
    stickyBar.style.position = 'fixed';
    stickyBar.style.bottom = '0';

    let selectedLetter = ''; // Variable to hold the currently selected letter
    let demolishMode = false; // Variable to track if demolish mode is active

    const FREE_PLAY_KEY = 'freePlayGridGameState';
    const ARCADE_KEY = 'arcadeGridGameState';
    let currentGameMode = 'freePlay';

    let score = 0;
    let profit = 0;
    let upkeep = 0;
    let turnsExceeded = 20;
    const demolishButton = document.createElement('button');
    demolishButton.textContent = 'Demolish';
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
                    } else if (selectedLetter !== '' && board[r][c] === ' ') {
                        board[r][c] = selectedLetter;
                        updateProfitAndUpkeep();
                        updateStickyBar();
                        printBoard();
                        if (currentGameMode == 'arcade' && coins == 0) {
                            alert(`Game Ended! Your score: ${score}`);
                        }
                    } else {
                        alert('Please select a letter from the sticky bar.');
                    }

                    if (r === boardSize - 1 || c === boardSize - 1) {
                        expandBoard();
                        printBoard();
                    }
                });
                gridContainer.appendChild(cell);
            }
        }
    }

    function expandBoard() {
        board.forEach(row => {
            row.push(...Array(5).fill(' '));
        });
        for (let i = 0; i < 5; i++) {
            board.push(Array(board[0].length).fill(' '));
        }
        boardSize += 5;
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
    function demolishBuilding(row, col) {
        if (board[row][col] !== ' ') {
            board[row][col] = ' ';
            updateProfitAndUpkeep();
            printBoard();
        }else{
            alert('Cannot demolish an empty space!');
        }
    }

    function updateProfitAndUpkeep() {
        profit = 0;
        upkeep = 0;
        score = 0;
        let residentialUpkeep = 0;
        let visited = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                let building = board[r][c];
                if (building === 'R' && !visited[r][c]) {
                    let clusterSize = findResidentialCluster(r, c, building, visited);
                    profit += clusterSize;
                    residentialUpkeep += 1;
                    score += calculateResidentialScore(board, r, c);
                }
    
                switch (building) {
                    case 'I':
                        profit += 2;
                        upkeep += 1;
                        score += calculateIndustryScore(board, r, c);
                        break;
                    case 'C':
                        profit += 3;
                        upkeep += 2;
                        score += calculateCommercialScore(board, r, c);
                        break;
                    case 'O':
                        upkeep += 1;
                        score += calculateParkScore(board, r, c);
                        break;
                    case '*':
                        if (!isConnected(r, c)) {
                            upkeep += 1;
                        }
                        score += calculateRoadScore(board, r, c);
                        break;
                }
            }
        }
    
        upkeep += residentialUpkeep;
        profitElement.textContent = `Profit: ${profit}`;
        upkeepElement.textContent = `Upkeep: ${upkeep}`;
        scoreElement.textContent = `Score: ${score}`;
    
        if (upkeep > profit) {
            turnsExceeded--;
            if (turnsExceeded > 0) {
                turnsExceededElement.textContent = `Upkeep > Profit: ${turnsExceeded} turns left`;
            }
        } else {
            // Reset the count if profit is greater than or equal to upkeep
            turnsExceeded = 20;
            turnsExceededElement.textContent = ''; // Clear the message
        }
    
        if (endGameIfNeeded()) {
            // Game has ended, handle accordingly
            return;
        }
    }

    function findResidentialCluster(row, col, type, visited) {
        let clusterSize = 0;
        let stack = [[row, col]];
        let directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [1, 1], [-1, 1], [1, -1]
        ];

        while (stack.length > 0) {
            let [r, c] = stack.pop();
            if (visited[r][c]) continue;
            visited[r][c] = true;

            if (board[r][c] === type) {
                clusterSize++;
                for (let [dr, dc] of directions) {
                    let nr = r + dr;
                    let nc = c + dc;
                    if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && !visited[nr][nc]) {
                        stack.push([nr, nc]);
                    }
                }
            }
        }

        return clusterSize;
    }

    function isConnected(row, col) {
        let directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];
        for (let [dr, dc] of directions) {
            let nr = row + dr;
            let nc = col + dc;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                if (board[nr][nc] !== ' ' && (board[nr][nc] === '*' || isBuilding(board[nr][nc]))) {
                    return true;
                }
            }
        }
        return false;
    }

    function isBuilding(cell) {
        return ['R', 'I', 'C', 'O'].includes(cell);
    }

    function resetGame() {
        board = Array.from({ length: 5 }, () => Array(5).fill(' '));
        boardSize = 5;
        profit = 0;
        upkeep = 0;
        turnsExceeded = 20;
        score = 0;
        printBoard();
        updateProfitAndUpkeep();
        turnsExceededElement.textContent = ''; // Clear the message
    }

    function saveGame() {
        const fileName = prompt('Enter a file name to save the game:');
        
        if (!fileName) {
            alert('File name cannot be empty!');
            return false;
        }
        
        const check = localStorage.getItem('check');
        const saveKey = `${fileName}`;
        
        // Check if file name already exists and is different from the current save
        if (localStorage.getItem(saveKey) && fileName !== check) {
            if (!confirm("A file with this name already exists. Do you want to overwrite it?")) {
                return false; // Exit if user chooses not to overwrite
            }
        }
    
        // Save the game state
        const gameState = {
            mode: 'freePlay',
            board,
            boardSize,
            profit,
            upkeep,
            turnsExceeded,
            score,
        };
        
        localStorage.setItem('check', fileName); // Update the 'check' entry to the new file name
        localStorage.setItem(saveKey, JSON.stringify(gameState)); // Save or overwrite the file
        
        alert('Game saved!');
        return true;
    }
    


    function loadGame() {
        const saveKey1 = localStorage.getItem('check');
        const gameState = JSON.parse(localStorage.getItem(saveKey1));
        // if (gameState.mode !== currentGameMode) {
        //     alert('Error: Trying to load a game from a different mode!');
        //     return;
        // }
        if (gameState) {
            board = gameState.board;
            boardSize = gameState.boardSize;
            profit = gameState.profit;
            upkeep = gameState.upkeep;
            turnsExceeded = gameState.turnsExceeded;
            score = gameState.score || 0; // Default to 0 if not present in older saves
            printBoard();
            updateProfitAndUpkeep();
            alert('Game loaded!');
        }
    }

    if (referrer === 'freePlayGame') {
        loadGame();
        sessionStorage.removeItem('referrer');
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

    document.getElementById('saveGame').addEventListener('click', function () {
            if (saveGame()) {
                fadeOutAndNavigate('mainpage.html');
            }
            sessionStorage.setItem('from', 'fp');
        
    });

    document.getElementById('back').addEventListener('click', function () {
        fadeOutAndNavigate('mainpage.html');
    });

    // Update sticky bar with random letters
    function updateStickyBar() {
        const letters = ['R', 'I', 'C', 'O', '*'];
        stickyBar.innerHTML = ''; // Clear previous content

        letters.forEach(letter => {
            const letterSpan = document.createElement('span');
            letterSpan.textContent = letter;
            letterSpan.addEventListener('click', function () {
                document.querySelectorAll('.selected-letter').forEach(el => el.classList.remove('selected-letter'));
                letterSpan.classList.toggle('selected-letter');
                selectedLetter = letter;
                demolishMode = false;
            });
            stickyBar.appendChild(letterSpan);
        });

        // Add demolish button
        // const demolishButton = document.createElement('button');
        // demolishButton.textContent = 'Demolish';
        demolishButton.addEventListener('click', function () {
            document.querySelectorAll('.selected-letter').forEach(el => el.classList.remove('selected-letter'));
            demolishMode = true;
            selectedLetter = '';
            //document.querySelectorAll('#sticky-bar button').forEach(btn => btn.classList.remove('selected-letter'));
            demolishButton.classList.add('highlight');

        });
        stickyBar.appendChild(demolishButton);
    }

    function fadeOutAndNavigate(targetUrl) {
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        setTimeout(function () {
            window.location.href = targetUrl;
        }, 2000);
    }

    //Point logic
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
        return board.flat().filter(cell => cell === 'I').length;
    }
    
    function calculateCommercialScore(board, row, col) {
        return countAdjacent(board, row, col, 'C');
    }
    
    function calculateParkScore(board, row, col) {
        return countAdjacent(board, row, col, 'O');
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

    function endGameIfNeeded() {
        if (turnsExceeded === 0) {
            alert(`Game Over: Upkeep has exceeded profit for 20 turns! Final Score: ${score}`);
            UpdateLeaderBoard(score);
            resetGame();
            return true;
        }
        return false;
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
    
            // Filter data where mode is "freeplay"
            const freeplayEntries = data.filter(entry => entry.mode === "freeplay");
    
            // Sort freeplayEntries from highest to lowest score
            freeplayEntries.sort((a, b) => b.score - a.score);
    
            // Check if the new score is high enough to be in the top 10
            const isTopScore = freeplayEntries.length < 10 || score > freeplayEntries[9].score;
    
            if (isTopScore) {
                // Prompt for username
                const username = prompt("Congratulations! You've made it to the top 10. Please enter your name:");
                
                if (username) {
                    const newEntry = {
                        username: username,
                        score: score,
                        mode: "freeplay"
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

    updateStickyBar();
    printBoard();
});
