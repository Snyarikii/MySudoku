//const { render } = require("express/lib/response");

var numSelected = null;
var tileSelected = null;
var moveStack = [];
var errors = 0;
let noteMode = false;
let initialBoard = [];

let count = {};
for(let i = 1; i <= 9; i++){
    count[i] = 9;
}

const darkModeToggle = document.getElementById('DarkModeBtn');
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if(document.body.classList.contains('dark-mode')) {
        darkModeToggle.innerHTML = "☀️";
    } else {
        darkModeToggle.innerHTML = "&#127769;";
    }
});

document.getElementById('notes').addEventListener('click', () =>  {
    noteMode = !noteMode;
    document.getElementById('notes-label').innerText = noteMode ? "ON" : "OFF";
});

// This function initializes the number count according to the board
function initializeCount(){
    let tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        let value = tile.innerText;
        if(value >= '1' && value <= '9') {
            count[value]--;
        }
    });
}


window.onload = function () {
    setupDifficultyButtons();
    startNewGame("easy");
    document.getElementById('undo').addEventListener('click', UndoMove);
    document.getElementById('resetBtn').addEventListener('click', resetBoard);
}

function setupDifficultyButtons() {
    document.getElementById("Easy-sudoku").addEventListener("click", () => startNewGame("easy"));
    document.getElementById("Hard-sudoku").addEventListener('click', () => startNewGame("hard"));
    document.getElementById("Expert-sudoku").addEventListener('click', () => startNewGame("expert"));
    document.getElementById("Extreme-sudoku").addEventListener('click', () => startNewGame("extreme"));
}

function switchDifficulty(board, solution) {
    currentBoard = board;
    currentSolution = solution;
    resetGame();
    setupGame();
}

function resetGame() {
    document.getElementById("board").innerHTML = "";
    document.getElementById('digits').innerHTML = "";
    errors = 0;
    moveStack = [];
    for( let i = 1; i <= 9; i++) count[i] = 9;
    document.getElementById('errors').innerText = errors;

    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.dataset.notes = '';
        tile.innerHTML = '';
    });

    if(numSelected) {
        numSelected.classList.remove('number-selected');
    }
    numSelected = null;
    highlightMatchingTiles(null);
}

function setupGame() {
    createDigits();
    createBoard();
    initializeCount();
    NumberCount();
}

// This function creates the number selection area
function createDigits() {
    const digitsContainer = document.getElementById('digits');
    digitsContainer.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
        let number = document.createElement('div');
        number.id = i;
        number.innerText = i;
        number.addEventListener('click', selectNumber);
        number.classList.add('number');
        document.getElementById('digits').appendChild(number);
    }
}

// This function creates the Sudoku board based on the predefined board array
function createBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.createElement('div');
            tile.id = `${r}-${c}`;
            if(board[r][c] != "-") {
                tile.innerText = board[r][c];
                tile.classList.add('tile-start');
            }
            if(r == 2 || r == 5) tile.classList.add('horizontal-line');
            if(c == 2 || c == 5) tile.classList.add('vertical-line');
            tile.addEventListener('click', selectTile);
            tile.classList.add('tile');
            document.getElementById('board').appendChild(tile);
        }
    }
}

function selectNumber(){
    if(numSelected != null){
        numSelected.classList.remove('number-selected');
    }
    numSelected = this;
    numSelected.classList.add('number-selected');

    highlightMatchingTiles(numSelected.id);
    highlightNotesOfNumber(numSelected.id);
}

function selectTile(){
    if (!numSelected) return;
    if(count[numSelected.id] <=  0) return;
    if (this.classList.contains('tile-start')) return; // Can't modify starter tiles

    // NOTES MODE: Add/remove note from this tile
    if (noteMode) {
        addNoteToTile(this, numSelected.id);
        return;
    }

    // NORMAL MODE: Place number
    if (!this.dataset.notes && this.innerText !== '') return;

    let coords = this.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    // Clear any notes for this tile before placing the number
    this.dataset.notes = '';
    this.innerHTML = numSelected.id;

    //Remove any old color classes first 
    this.classList.remove('correct-color', 'wrong-color');

    const prevNotesArray = this.dataset.notes ? this.dataset.notes.split(',') : [];

    moveStack.push({
        tile: this,
        previousValue: '',
        previousNotes: prevNotesArray,
        value: numSelected.id,
        row: r,
        col: c
    });

    this.classList.remove('correct-color', 'wrong-color', 'hint-color');
    this.style.color = '';


    if (currentSolution[r][c] == numSelected.id) {
        this.classList.add('correct-color');
        removeNotesInRelatedTiles(r, c, numSelected.id);
        highlightMatchingTiles(numSelected.id);
    } else {
        this.classList.add('wrong-color');
        errors++;
        document.getElementById('errors').innerText = errors;
    }

    count[numSelected.id]--;
    NumberCount();
   
    highlightMatchingTiles(numSelected ? numSelected.id : null);
    EndGame();
}


function addNoteToTile(tile, number) {
     let existingNotes = tile.dataset.notes ? tile.dataset.notes.split(',') : [];
    let hadNumber = existingNotes.includes(number);

    // Push to moveStack BEFORE changing anything
    moveStack.push({
        type: 'note',
        tile: tile,
        previousNotes: [...existingNotes], // Copy of current notes
        numberChanged: number,
        wasPresent: hadNumber
    });

    if (hadNumber) {
        // Remove note
        existingNotes = existingNotes.filter(n => n !== number);
    } else {
        existingNotes.push(number);
    }
    tile.dataset.notes = existingNotes.join(',');
    renderTileNotes(tile);
}

// This function renders the notes inside a tile
function renderTileNotes(tile) {
    let notes = tile.dataset.notes ? tile.dataset.notes.split(',') : [];
    tile.innerHTML = '';

    if(notes.length > 0) {
        let notesDiv = document.createElement('div');
        notesDiv.classList.add('notes');
        notes.sort().forEach(num => {
            let noteSpan = document.createElement('span');
            noteSpan.className = "note-digit";
            noteSpan.innerText = num;
            notesDiv.appendChild(noteSpan);
        });
        tile.appendChild(notesDiv);
        highlightNotesOfNumber(numSelected ? numSelected.id : null);
    }
}

function removeNumberFromAllNotes(number) {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        if(!tile.dataset.notes) return;

        let notesArray = tile.dataset.notes.split(',').filter(n => n !== number);

        if (notesArray.length === 0) {
            delete tile.dataset.notes;
            tile.innerHTML = '';
        } else {
            tile.dataset.notes = notesArray.join(',');
            renderTileNotes(tile);
        }
        // if(tile.dataset.notes) {
        //     let notes = tile.dataset.notes.split(',').filter(n => n !== number);
        //     tile.dataset.notes = notes.join(',');
        //     renderTileNotes(tile);
        // }
    });
}

function removeNotesInRelatedTiles(row, col, number) {
    const allTiles =  document.querySelectorAll('.tile');
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;

    allTiles.forEach(tile => {
        const [r, c] = tile.id.split('-').map(Number);

        //Skip the current tile (where the number was placed)
        if (r === row && c === col ) return;

        // Check if tile is in same row, column or 3x3 box
        const sameRow = r === row;
        const sameCol = c === col;
        const sameBox = (r >= boxRowStart && r < boxRowStart + 3) &&
                        (c >= boxColStart && c < boxColStart + 3);

        if (sameRow || sameCol || sameBox) {
            if (tile.dataset.notes) {
                console.log(`Removing note ${number} from tile ${r}-${c}`);
                let notesArray = tile.dataset.notes.split(',');

                if (notesArray.includes(number.toString())) {
                    notesArray = notesArray.filter(n => n !== number.toString());
                    if (notesArray.length === 0) {
                        delete tile.dataset.notes;
                        tile.innerHTML = '';
                    } else {
                        tile.dataset.notes = notesArray.join(',');
                        renderTileNotes(tile);
                    }
                }
            }
        }
        
    });
}

function resetBoard() {

    //Check if player has played any moves
    if(moveStack.length === 0) {
        performReset();
        return;
    }
    const confirmReset = confirm("You have unsaved progress. Are you sure you want to reset the board? All your progress will be lost.");
    if(confirmReset) {
        performReset();
    }

}

function performReset() {
    moveStack = [];
    errors = 0;
    document.getElementById('errors').innerText = errors;
    
    //reset number count
    for (let i = 1; i <= 9; i++) count[i] = 9;
    
    //Reset board display
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        const [r, c] = tile.id.split('-').map(Number);
        const value = initialBoard[r][c];
    
        tile.innerText = '';
        tile.dataset.notes = '';
        tile.innerHTML = '';
        tile.classList.remove('correct-color', 'wrong-color', 'highlight');
        tile.style.color = '';
    
        if (value !== '-') {
            tile.innerText = value;
            tile.classList.add('tile-start');
        } else {
            tile.classList.remove('tile-start');
        }
    });
    
    initializeCount();
    NumberCount();
    
    if (numSelected) numSelected.classList.remove('number-selected');
    numSelected = null;
    highlightMatchingTiles(null);
    
}


// This function undoes the last move made by the player
function UndoMove() {
    if (moveStack.length === 0) return;

    let lastMove = moveStack.pop();

    if (lastMove.type === 'note') {
        lastMove.tile.dataset.notes = lastMove.previousNotes.join(',');
        renderTileNotes(lastMove.tile);
    } else {
        lastMove.tile.innerText = lastMove.previousValue;
        lastMove.tile.dataset.notes = (lastMove.previousNotes && lastMove.previousNotes.length) ? lastMove.previousNotes.join(',') : '';
        renderTileNotes(lastMove.tile);
        //lastMove.tile.style.color = 'black';
        lastMove.tile.classList.remove('correct-color', 'wrong-color', 'hint-color');
        lastMove.tile.style.color = '';

        if (lastMove.value) {
            count[lastMove.value]++;
            NumberCount();
        }
        highlightMatchingTiles(numSelected ? numSelected.id : null);
    }
}

// This function highlights similar numbers to the one that is selected by the user
function highlightMatchingTiles(number){
    let allTiles = document.querySelectorAll('.tile');
    allTiles.forEach(tile => {
        tile.classList.remove('highlight');
    });
    
    allTiles.forEach(tile => {
        if(tile.innerText === number && !tile.dataset.notes) {
            tile.classList.add('highlight');
        }
    });
}

function highlightNotesOfNumber(number) {
    document.querySelectorAll('.tile .note-digit').forEach(span => {
        span.classList.remove('note-highlight');
        if(span.innerText === number) {
            span.classList.add('note-highlight');
        }
    });
}

// This function increments the number count when a player inputs a number into a tile
function NumberCount(){
    //let allTiles = document.querySelectorAll('.tile');
    let digits = document.getElementById('digits');       
    let numberElement = digits.querySelectorAll('.number');

    numberElement.forEach(numberDiv => {
        let digit = numberDiv.id;

        let existingCount = numberDiv.querySelector('.num-count');
        if(existingCount) numberDiv.removeChild(existingCount);
        
        let countSpan = document.createElement('span');
        countSpan.classList.add('num-count');
        countSpan.innerText =`${count[digit]}`;
        numberDiv.appendChild(countSpan);

        //Disable number if count is 0
        if(count[digit] <=0) {
            numberDiv.classList.add('disabled');
        } else {
            numberDiv.classList.remove('disabled');
        }
    });

    if(numSelected && count[numSelected.id] <=0) {
        autoSelectNextAvailableNumber();
    }
}

function autoSelectNextAvailableNumber() {
   if(!numSelected) return;

   let current = parseInt(numSelected.id);

   //Check from next number up to 9
   for(let i = current + 1; i <= 9; i++) {
    if(count[i] > 0) {
        switchToNumber(i);
        return;
    }
   }
   //If not found, check from 1 up to current
   for (let i = 1; i < current; i++) {
        if(count[i] > 0) {
            switchToNumber(i);
            return;
        }
   }

   //No numbers available
   if(numSelected) {
    numSelected.classList.remove('number-selected');
   }
   numSelected = null;
   highlightMatchingTiles(null);
}
function switchToNumber(i){
    if(numSelected) {
        numSelected.classList.remove('number-selected');
    }
    let nexNumberDiv = document.getElementById(i);
    numSelected = nexNumberDiv;
    numSelected.classList.add('number-selected');
    highlightMatchingTiles(numSelected.id);
    highlightNotesOfNumber(numSelected.id);
}

//Give player a hint
document.getElementById("hintBtn").addEventListener("click", giveHint);
let hintCount = 3;

document.getElementById("hint-label").innerText = `Hints (${hintCount})`;
function giveHint() {
    if(hintCount <= 0) {
        alert("No hints left!");
        return;
    }
    hintCount--;
    let allTiles = document.querySelectorAll(".tile");
    document.getElementById("hint-label").innerText = `Hints (${hintCount})`;

    let emptyTiles = Array.from(allTiles).filter(tile => tile.innerText === "");

    if(emptyTiles.length === 0) {
        alert("No empty tiles left - puzzle is complete!");
        return;
    }

    //Choose an empty tile at random for now
    let randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];

    //Get its coordinates
    let coords = randomTile.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    //Get correct value form the current solution
    let correctValue = currentSolution[r][c];

    //Fill it in
    randomTile.innerText = correctValue;
    randomTile.classList.add("hint-color");

    //Record move in stack
    moveStack.push({
        tile: randomTile, 
        previousValue: '',
        value: correctValue,
        row: r,
        col: c,
        isHint: true
    });

    //Update count
    count[correctValue]--;
    NumberCount();
    setTimeout(() => {
        randomTile.classList.remove("hint-color");
    }, 1500);
    EndGame();
}

//This function checks if placing a number in a specific position is valid
function isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        //Check row and column
        if (board[row][x] === num || board[x][col] === num) return false;

    }

    //Check 3x3 box
    let startRow = row - row % 3;
    let startCol = col - col % 3;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[startRow + r][startCol + c] === num) return false;
        }
    }
    return true;
}
// Backtracking algorithm to solve the Sudoku puzzle
function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Generate a full valid Sudoku solution
function generateFullSolution() {
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));

    function fillBoard() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    shuffleArray(numbers);
                    for (let num of numbers) {
                        if (isSafe(board, row, col, num)) {
                            board[row][col] =  num;
                            if(fillBoard()) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    fillBoard();
    return board;
}

// This function shuffles an array in place
function shuffleArray(array) {
    for (let i = array.length -1; i > 0; i--){
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
let solvedBoard = generateFullSolution();

// Generate a Sudoku puzzle by removing numbers from the solved board
function generatePuzzle(solvedBoard, difficulty = 'easy') {
    let puzzle = solvedBoard.map(row => [...row]);

    let removalCount;
    if (difficulty === 'easy') removalCount = 35;
    else if(difficulty === 'hard') removalCount = 45;
    else if(difficulty === 'expert') removalCount = 50;
    else if(difficulty === 'extreme') removalCount = 55;
    else removalCount = 60;

    while (removalCount > 0) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== 0) {
            let backup = puzzle[row][col];
            puzzle[row][col] = 0;

            //Check if puzzle still has unique solution
            if(!hasUniqueSolution(puzzle)) {
                puzzle[row][col] = backup;
                continue;
            }
            removalCount--;
        }
    }
    return puzzle;
}

// Check if the Sudoku puzzle has a unique solution
function hasUniqueSolution(board) {
    let count = 0;

    function solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isSafe(board, row, col, num)) {
                            board[row][col] = num;
                            solve(board);
                            board[row][col] = 0;
                            if (count > 1) return;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }
    let copy = board.map(row => [...row]);
    solve(copy);
    return count === 1;
}

// Start a new game with the specified difficulty
function startNewGame(difficulty) {
    resetGame();

    hintCount = 3;
    document.getElementById("hint-label").innerText = `Hints (${hintCount})`;

    let solutionGrid = generateFullSolution();
    let puzzleGrid = generatePuzzle(solutionGrid, difficulty);

    //Convert numeric 0s to '-' for compatibility with existing code
    board = puzzleGrid.map(row => row.map(cell => (cell === 0 ? '-' : cell.toString())));
    currentSolution = solutionGrid.map(row => row.map(cell => cell.toString()));

    initialBoard = board.map(row => [...row]);

    document.getElementById("board").innerHTML = "";
    setupGame();
}

//End of the game
function EndGame() {
    let allTiles = document.querySelectorAll('.tile');
    for(let tile of allTiles) {
      if(tile.innerText === ''){
        return;
      }
    }
    //Check if board is correct
    for(let tile of allTiles)  {
        let coords = tile.id.split('-');
        let r = parseInt(coords[0]);
        let c = parseInt(coords[1]);

        if(tile.innerText !== currentSolution[r][c]) {
            alert("Some numbers are incorrect. Try again");
            return;
        }
    }
    alert('You have successfully completed the sudoku!');
    startNewGame("easy");
}