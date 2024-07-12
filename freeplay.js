
document.addEventListener('DOMContentLoaded', function () {
    let boardSize = 100;
    let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(' '));
    let gridContainer = document.getElementById('grid');
    let placeLetterForm = document.getElementById('placeLetterForm');
    let profitElement = document.getElementById('profit');
    let upkeepElement = document.getElementById('upkeep');
    let turnsExceededElement = document.getElementById('turnsExceeded');
    let referrer = sessionStorage.getItem('referrer');

    const FREE_PLAY_KEY = 'freePlayGridGameState';
    const ARCADE_KEY = 'arcadeGridGameState';
    let currentGameMode = 'freePlay';

    let profit = 0;
    let upkeep = 0;
    let turnsExceeded = 0;

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

    function expandBoard() {
        board.forEach(row => {
            row.push(...Array(5).fill(' '));
        });
        for (let i = 0; i < 5; i++) {
            board.push(Array(board[0].length).fill(' '));
        }
        boardSize += 5;
    }

    function placeLetter(coord, letter) {
        const [row, col] = convertCoord(coord);
        if (row !== null && col !== null && board[row][col] === ' ') {
            if (row === board.length - 1 || col === board[0].length - 1) {
                expandBoard();
            }
            board[row][col] = letter;
            updateProfitAndUpkeep();
            return true;
        }
        return false;
    }

    function demolishBuilding(coord) {
        const [row, col] = convertCoord(coord);
        if (row !== null && col !== null && board[row][col] !== ' ') {
            board[row][col] = ' ';
            updateProfitAndUpkeep();
            return true;
        }
        return false;
    }

    function updateProfitAndUpkeep() {
        profit = 0;
        upkeep = 0;
        console.log("P: ",profit ,"up: " ,upkeep)
        let residentialUpkeep = 0;
        let visited = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                let building = board[r][c];
                if (building === 'R' && !visited[r][c]) {
                    let clusterSize = findResidentialCluster(r, c, building, visited);
                    console.log("Cluster Size: ",clusterSize);
                    profit += clusterSize;
                    residentialUpkeep += 1;
                }

                switch (building) {
                    case 'I':
                        profit += 2;
                        upkeep += 1;
                        break;
                    case 'C':
                        profit += 3;
                        upkeep += 2;
                        break;
                    case 'O':
                        upkeep += 1;
                        break;
                    case '*':
                        if (!isConnected(r, c)) {
                            upkeep += 1;
                            console.log(upkeep)
                        }
                        break;
                }
            }
        }

        console.log("Res Upkeep: ",residentialUpkeep)
        upkeep += residentialUpkeep;
        console.log("P: ",profit ,"up: " ,upkeep)
        profitElement.textContent = `Profit: ${profit}`;
        upkeepElement.textContent = `Upkeep: ${upkeep}`;

        if (upkeep > profit) {
            turnsExceeded++;
        } else {
            turnsExceeded = 0;
        }

        turnsExceededElement.textContent = `Turns upkeep exceeded profit: ${turnsExceeded}`;

        if (turnsExceeded >= 20) {
            alert("Game Over: Upkeep has exceeded profit for 20 turns!");
            resetGame();
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
        turnsExceeded = 0;
        printBoard();
        updateProfitAndUpkeep();
    }

    placeLetterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const coord = e.target.coordinate.value.trim();
        const letter = e.target.letter.value.trim().toUpperCase();

        if (['O', 'I', 'C', '*', 'R'].includes(letter) && placeLetter(coord, letter)) {
            printBoard();
        } else {
            alert('Invalid input or cell cannot be placed.');
        }

        e.target.coordinate.value = '';
        e.target.letter.value = '';
    });

    function saveGame() {
        const check = localStorage.getItem('check')
        const fileName = prompt('Enter a file name to save the game:');
        if(fileName!==check){
        if (!fileName) {
            alert('File name cannot be empty!');
            return;
        }
        const gameState = {
            mode: 'freePlay',
            board,
            boardSize,
            profit,
            upkeep,
            turnsExceeded,
        };
        const saveKey = `${fileName}`;
        localStorage.setItem('check',fileName)
        localStorage.setItem(saveKey, JSON.stringify(gameState));
        alert('Game saved!');
        return true;
    }else{
        alert("Cannot have files with the same name")
        return false;
    }
    }

    function loadGame() {
        const saveKey1 = localStorage.getItem('name')
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
            printBoard();
            updateProfitAndUpkeep();
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

    if (referrer === 'freePlayGame') {
        loadGame();
        sessionStorage.removeItem('referrer');
    }

    document.getElementById('saveGame').addEventListener('click', function () {
        if (isBoardEmpty()) {
            alert("Cannot save an empty board");
            return;
        } else {
            if(saveGame()){
                fadeOutAndNavigate('mainpage.html');
            }
            sessionStorage.setItem('from','fp')
        }
    });

    document.getElementById('loadGame').addEventListener('click', function () {
        loadGame();
    });

    document.getElementById('back').addEventListener('click', function () {
        fadeOutAndNavigate('mainpage.html');
    });

    function fadeOutAndNavigate(targetUrl) {
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        setTimeout(function () {
            window.location.href = targetUrl;
        }, 2000);
    }

    printBoard();
    updateProfitAndUpkeep();
});
