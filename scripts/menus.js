/**
 * Rob the Runner - Menu System
 * Handles the game's menu navigation and UI interactions
 */

// Game state
let currentMenuScreen = 'main-menu';
let selectedMenuIndex = 0;

// Menu screens
const menuScreens = {
    'main-menu': document.querySelector('.main-menu'),
    'race-selection': document.querySelector('.race-selection'),
    'controls-help': document.querySelector('.controls-help')
};

// Menu options for keyboard navigation
const menuOptions = {
    'main-menu': Array.from(document.querySelectorAll('.main-menu .menu-option')),
    'race-selection': Array.from(document.querySelectorAll('.race-selection .menu-option')),
    'controls-help': [document.querySelector('.controls-help .back-button')]
};

// Initialize menu system
document.addEventListener('DOMContentLoaded', () => {
    // Hide game wrapper initially to show menus
    document.querySelector('.game-wrapper').style.display = 'none';
    
    // Setup keyboard navigation
    setupMenuNavigation();
    
    // Setup button click handlers
    setupButtonHandlers();
    
    // Initialize UI elements
    updateUIElements();
});

// Setup menu keyboard navigation
function setupMenuNavigation() {
    document.addEventListener('keydown', (event) => {
        // Only handle key navigation when in menu mode
        if (document.querySelector('.game-wrapper').style.display === 'none') {
            switch (event.code) {
                case 'ArrowUp':
                    navigateMenu(-1);
                    break;
                case 'ArrowDown':
                    navigateMenu(1);
                    break;
                case 'Enter':
                    selectMenuOption();
                    break;
                case 'Escape':
                    if (currentMenuScreen !== 'main-menu') {
                        showMenuScreen('main-menu');
                    }
                    break;
            }
        } else {
            // Handle menu keys during gameplay
            if (event.code === 'Escape' && !window.isPaused) {
                // Return to menu if ESC pressed during game
                document.querySelector('.game-wrapper').style.display = 'none';
                showMenuScreen('main-menu');
                window.cancelAnimationFrame(window.animationFrameId);
            }
        }
    });
}

// Navigate through menu options
function navigateMenu(direction) {
    const options = menuOptions[currentMenuScreen];
    if (!options || options.length === 0) return;
    
    // Remove selection from current option
    options[selectedMenuIndex].classList.remove('selected');
    
    // Calculate new index with wrapping
    selectedMenuIndex = (selectedMenuIndex + direction + options.length) % options.length;
    
    // Add selection to new option
    options[selectedMenuIndex].classList.add('selected');
    
    // Play selection sound
    playSound('menu-move');
}

// Handle menu option selection
function selectMenuOption() {
    const options = menuOptions[currentMenuScreen];
    if (!options || options.length === 0) return;
    
    const selectedOption = options[selectedMenuIndex];
    
    // Play selection sound
    playSound('menu-select');
    
    // Handle based on current menu and selection
    if (currentMenuScreen === 'main-menu') {
        const option = selectedOption.dataset.option;
        
        if (option === 'career') {
            showMenuScreen('race-selection');
        } else if (option === 'endless') {
            startEndlessRunner();
        } else if (option === 'controls') {
            showMenuScreen('controls-help');
        }
    } else if (currentMenuScreen === 'race-selection') {
        const race = selectedOption.dataset.race;
        
        if (race === 'back') {
            showMenuScreen('main-menu');
        } else {
            startRaceMode(race);
        }
    } else if (currentMenuScreen === 'controls-help') {
        showMenuScreen('main-menu');
    }
}

// Setup click handlers for interactive buttons
function setupButtonHandlers() {
    // Menu option click handlers
    document.querySelectorAll('.menu-option').forEach(option => {
        option.addEventListener('click', () => {
            // Find index of clicked option
            const options = menuOptions[currentMenuScreen];
            const index = options.indexOf(option);
            
            if (index !== -1) {
                // Update selection
                options[selectedMenuIndex].classList.remove('selected');
                selectedMenuIndex = index;
                options[selectedMenuIndex].classList.add('selected');
                
                // Select this option
                selectMenuOption();
            }
        });
    });
    
    // Menu button handler in pause screen
    document.querySelector('.menu-button').addEventListener('click', () => {
        document.querySelector('.pause-screen').style.display = 'none';
        document.querySelector('.game-wrapper').style.display = 'none';
        showMenuScreen('main-menu');
        window.cancelAnimationFrame(window.animationFrameId);
    });
    
    // Resume button in pause screen
    document.querySelector('.resume-button').addEventListener('click', () => {
        togglePause();
    });
}

// Show a specific menu screen
function showMenuScreen(screenName) {
    // Hide all screens
    Object.values(menuScreens).forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Show the requested screen
    if (menuScreens[screenName]) {
        menuScreens[screenName].style.display = 'block';
        currentMenuScreen = screenName;
        
        // Reset selected index
        selectedMenuIndex = 0;
        
        // Update selection visual
        const options = menuOptions[currentMenuScreen];
        if (options && options.length > 0) {
            options.forEach(option => option.classList.remove('selected'));
            options[0].classList.add('selected');
        }
    }
}

// Export functions to global scope
window.showMenuScreen = showMenuScreen;

// Start endless runner mode
function startEndlessRunner() {
    // Hide menus and show game
    Object.values(menuScreens).forEach(screen => {
        screen.style.display = 'none';
    });
    document.querySelector('.game-wrapper').style.display = 'block';
    
    // Hide race info
    document.querySelector('.race-info').style.display = 'none';
    
    // Start the endless game
    window.gameMode = 'endless';
    window.startGame();
}

// Start a specific race
function startRaceMode(raceType) {
    // Hide menus and show game
    Object.values(menuScreens).forEach(screen => {
        screen.style.display = 'none';
    });
    document.querySelector('.game-wrapper').style.display = 'block';
    
    // Show race info
    document.querySelector('.race-info').style.display = 'block';
    
    // Set race type and start
    window.gameMode = 'race';
    window.raceType = raceType;
    
    // Call the startRace function from races.js
    if (typeof window.startRace === 'function') {
        window.startRace(raceType);
    } else {
        console.error('Race system not initialized properly');
        // Fallback to endless mode if race system fails
        startEndlessRunner();
    }
}

// Play a sound effect
function playSound(soundName) {
    // TODO: Implement sound system
    console.log(`Playing sound: ${soundName}`);
}

// Update UI elements based on player stats
function updateUIElements() {
    // Update career stats if available
    if (window.playerStats) {
        document.getElementById('player-age').textContent = window.playerStats.age;
        document.getElementById('current-season').textContent = window.playerStats.season;
        document.getElementById('player-speed').textContent = window.playerStats.speed;
        document.getElementById('player-endurance').textContent = window.playerStats.endurance;
    }
} 