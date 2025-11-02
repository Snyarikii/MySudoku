document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const storageKey = 'sudoku-theme';


    function checkForSavedGame() {
        const continueBtn = document.getElementById('continue-btn');

        try{
            const savedBoardRaw = localStorage.getItem('sudokuBoard');
            const savedDifficulty = localStorage.getItem('sudokuDifficulty');
            const savedSolutionRaw = localStorage.getItem('sudokuSolution');

            if (!savedBoardRaw || !savedSolutionRaw) return;
    
            const savedBoard = JSON.parse(savedBoardRaw);
            const savedSolution = JSON.parse(savedSolutionRaw);
    
            const hasValidGame = 
                Array.isArray(savedBoard) &&
                savedBoard.length === 81 &&
                savedBoard.some(cell => !cell.value || cell.value === '-' || cell.value === '') &&
                Array.isArray(savedSolution) &&
                savedSolution.length === 9 &&
                savedSolution.every(row => Array.isArray(row) && row.length === 9);
    
            if (hasValidGame) {
                continueBtn.style.display = "block";
                continueBtn.textContent = savedDifficulty
                    ? `Continue Your Last ${savedDifficulty} Game`
                    : "Continue Your Last Game";
    
                continueBtn.addEventListener('click', () => {
                    window.location.href = `index.html?continue=true`;
                });
            } else {
                continueBtn.style.display = "none";
            }
        } catch (e) {            
            console.error("No valid saved game found:", e);
            continueBtn.style.display = "none";

        }
    }

    checkForSavedGame();
    window.addEventListener('pageshow', checkForSavedGame);


    // 1. Get user's saved preference or system preference
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem(storageKey);
        if (storedTheme) {
            return storedTheme;
        }
        // Check for system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 2. Apply the theme
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem(storageKey, theme);
    };

    // 3. Set the initial theme on load
    applyTheme(getPreferredTheme());

    // 4. Add the toggle listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    const newGameBtn = document.getElementById('new-game-btn');
    const difficultyMenu = document.getElementById('difficulty-options-menu');
    const difficultyOptions = document.querySelectorAll('.difficulty-option-btn');


    newGameBtn.addEventListener('click', () => {
        difficultyMenu.classList.toggle('menu-open');        
    });


    difficultyOptions.forEach(button => {
        button.addEventListener('click', (event) => {
            const selectedDifficulty = event.target.dataset.difficulty;

            if (selectedDifficulty) {
                window.location.href = `index.html?difficulty=${selectedDifficulty}`;
            }
        });
    });

    document.addEventListener('click', (event) => {
        const isButtonClick = newGameBtn.contains(event.target);
        const isMenuClick = difficultyMenu.contains(event.target);

        if (!isButtonClick && !isMenuClick) {
            difficultyMenu.classList.remove('menu-open');
        }
    });
});