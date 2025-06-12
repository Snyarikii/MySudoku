var numSelected = null;
var tileSelected = null;
var moveStack = [];

let count = {};
for(let i = 1; i <= 9; i++){
    count[i] = 9;
}


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

var errors = 0;

var board = [
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

var solution = [
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

window.onload = function () {
    setGame();
    setTimeout(() => {
        initializeCount();
        NumberCount();
    }, 0);
    document.getElementById('undo').addEventListener('click', UndoMove);
}
function setGame(){
    //Digits 1-9
    for (let i = 1; i <= 9; i++){
        let number = document.createElement('div');
        number.id = i;
        number.innerText = i;
        number.addEventListener('click', selectNumber);
        number.classList.add('number');
        document.getElementById('digits').appendChild(number);
    }
    
    //Board
    for(let r = 0; r < 9; r++){
        for(let c = 0; c < 9; c++){
            let tile = document.createElement('div');
            tile.id = r.toString() + "-" + c.toString();
            if(board[r][c] != "-"){
                tile.innerText = board[r][c];
                tile.classList.add('tile-start');
            }
            if(r ==2 || r == 5){
                tile.classList.add('horizontal-line');
            }
            if(c == 2 || c == 5){
                tile.classList.add('vertical-line');
            }
            tile.addEventListener('click', selectTile);
            tile.classList.add('tile');
            document.getElementById('board').append(tile);
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
function selectTile(){
    if(count[numSelected.id] <=0) {
        return;
    }
    if(numSelected){
        if(this.innerText != ''){
            return;
        }
        this.innerText = numSelected.id;
        
        // "0-0" "0-1" .. "3-1"
        let cords = this.id.split("-");
        let r = parseInt(cords[0]);
        let c = parseInt(cords[1]);
        
        if(solution[r][c] == numSelected.id){
            moveStack.push({
                tile: this,
                previousValue: '',
                value: numSelected.id,
                row: r,
                col: c
            });
            this.innerText = numSelected.id;
            this.style.color = 'blue';
            count[numSelected.id]--;
            NumberCount();
        } else {
            moveStack.push({
                tile: this,
                previousValue: '',
                value: numSelected.id,
                row: r,
                col: c
            });
            
            errors +=1;
            document.getElementById('errors').innerText = errors;
            this.style.color = 'red';
            count[numSelected.id]--;
            NumberCount();
        }
        highlightMatchingTiles(numSelected.id);
        NumberCount();
    }
}


function UndoMove(){    
    if(moveStack.length === 0) return;
    
    let lastMove = moveStack.pop();
    lastMove.tile.innerText = lastMove.previousValue;
    lastMove.tile.style.color = 'black';

    //Decrement the number count when a user clicks undo button
    count[lastMove.value]++;
    NumberCount();

    
    //If last move was wrong, reduce error count
    if(solution[lastMove.row][lastMove.col] !== lastMove.value){
        errors -= 1;
        document.getElementById('errors').innerText = errors;
    }
    highlightMatchingTiles(numSelected.id);
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
}