var numSelected = null;
var tileSelected = null;
var moveStack = [];
var errors = 0;
let noteMode = false;

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

var easyBoard = [
    "--74916-5",
    "2---6-3-9",
    "-----7-1-",
    "-586----4",
    "--3----9-",
    "--62--187",
    "9-4-7---2",
    "67-83----",
    "81--45---"
]

var easySolution = [
    "387491625",
    "241568379",
    "569327418",
    "758619234",
    "123784596",
    "496253187",
    "934176852",
    "675832941",
    "812945763"
]
var hardBoard = [
    // 329
    "--567----",
    "-18--9---",
    "--3----5-",
    "-8-2-4-7-",
    "--4---2--",
    "-3-8-5-4-",
    "-2----9--",
    "---4--12-",
    "----523--"
];
var hardSolution = [
    "495673812",
    "218549736",
    "673128459",
    "986214573",
    "154736298",
    "732895641",
    "527361984",
    "369487125",
    "841952367"
]

var currentBoard = easyBoard;
var currentSolution = easySolution;

window.onload = function () {
    setupGame();
    setupDifficultyButtons();
    document.getElementById('undo').addEventListener('click', UndoMove);
}

function setupDifficultyButtons() {
    document.getElementById("Easy-sudoku").addEventListener('click', () =>{
        switchDifficulty(easyBoard, easySolution);
    });
    document.getElementById("Hard-sudoku").addEventListener('click', () => {
        switchDifficulty(hardBoard, hardSolution);
    });
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
}

function setupGame() {
    createDigits();
    createBoard();
    initializeCount();
    NumberCount();
}
function createDigits() {
    for (let i = 1; i <= 9; i++) {
        let number = document.createElement('div');
        number.id = i;
        number.innerText = i;
        number.addEventListener('click', selectNumber);
        number.classList.add('number');
        document.getElementById('digits').appendChild(number);
    }
}
function createBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.createElement('div');
            tile.id = `${r}-${c}`;
            if(currentBoard[r][c] != "-") {
                tile.innerText = currentBoard[r][c];
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
}
// function selectTile(){
//     // if(count[numSelected.id] <=0) {
//     //     return;
//     // }
//     if(!numSelected || count[numSelected.id] <= 0) return;

//     if(this.classList.contains('tile-start')) return;

//     if(noteMode) {
//         addNoteToTile(this, numSelected.id);
//         return;
//     }

//     // if(numSelected){
//     if(this.innerText != ''){
//         return;
//     }
//     // this.innerText = numSelected.id;
    
//     // "0-0" "0-1" .. "3-1"
//     let cords = this.id.split("-");
//     let r = parseInt(cords[0]);
//     let c = parseInt(cords[1]);
    
//     if(currentSolution[r][c] == numSelected.id){
//         moveStack.push({
//             tile: this,
//             previousValue: '',
//             value: numSelected.id,
//             row: r,
//             col: c
//         });
//         this.innerText = numSelected.id;
//         this.classList.add('correct-color');
//         count[numSelected.id]--;
//         NumberCount();
//         EndGame();
//     } else {
//         moveStack.push({
//             tile: this,
//             previousValue: '',
//             value: numSelected.id,
//             row: r,
//             col: c
//         });
        
//         errors +=1;
//         document.getElementById('errors').innerText = errors;
//         this.classList.add('wrong-color');
//         count[numSelected.id]--;
//         NumberCount();
//         EndGame();
//     }
//     highlightMatchingTiles(numSelected.id);
//     NumberCount();
//     // }
// }
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
    if (this.innerText !== '') return;

    let coords = this.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    // Clear any notes for this tile before placing the number
    this.dataset.notes = '';
    this.innerHTML = numSelected.id;

    moveStack.push({
        tile: this,
        previousValue: '',
        value: numSelected.id,
        row: r,
        col: c
    });

    if (currentSolution[r][c] == numSelected.id) {
        this.classList.add('correct-color');
    } else {
        this.classList.add('wrong-color');
        errors++;
        document.getElementById('errors').innerText = errors;
    }

    count[numSelected.id]--;
    NumberCount();
    if (numSelected) {
        removeNumberFromAllNotes(numSelected.id);
    }
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

function renderTileNotes(tile) {
    let notes = tile.dataset.notes ? tile.dataset.notes.split(',') : [];
    tile.innerHTML = '';

    if(notes.length > 0) {
        let notesDiv = document.createElement('div');
        notesDiv.classList.add('notes');
        notesDiv.innerText = notes.sort().join(' ');
        tile.appendChild(notesDiv);
    }
}
function removeNumberFromAllNotes(number) {
    let tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        if(tile.dataset.notes) {
            let notes = tile.dataset.notes.split(',').filter(n => n !== number);
            tile.dataset.notes = notes.join(',');
            renderTileNotes(tile);
        }
    });
}

function UndoMove() {
    if (moveStack.length === 0) return;

    let lastMove = moveStack.pop();

    if (lastMove.type === 'note') {
        lastMove.tile.dataset.notes = lastMove.previousNotes.join(',');
        renderTileNotes(lastMove.tile);
    } else {
        lastMove.tile.innerText = lastMove.previousValue;
        lastMove.tile.dataset.notes = '';
        lastMove.tile.style.color = 'black';
        lastMove.tile.classList.remove('correct-color', 'wrong-color');
        count[lastMove.value]++;
        NumberCount();
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
        if(tile.innerText === number){
            tile.classList.add('highlight');
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
}

//Give player a hint
document.getElementById("hintBtn").addEventListener("click", giveHint);
let hintCount = 3;

function giveHint() {
    if(hintCount <= 0) {
        alert("No hints left!");
        return;
    }
    hintCount--;
    document.getElementById("hint-label").innerText = `Hint (${hintCount})`;
    let allTiles = document.querySelectorAll(".tile");

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
}