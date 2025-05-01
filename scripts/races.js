/**
 * Rob the Runner - Race System
 * Implements different race types with specific mechanics
 */

// Access game constants from main.js
const GAME_HEIGHT = window.GAME_HEIGHT || 360;
const GROUND_HEIGHT = window.GROUND_HEIGHT || 40;
const SPRITE_HEIGHT = window.SPRITE_HEIGHT || 38;
const SPRITE_WIDTH = window.SPRITE_WIDTH || 24;
const ANIMATION = window.ANIMATION || {
    RUNNING_FALL: 1
};
const OBSTACLE_SPEED = window.OBSTACLE_SPEED || 5;

// Race configuration
const RACE_CONFIG = {
    sprint: {
        distance: 100,        // 100 meters
        expectedTime: 11,     // Base expected time in seconds (changed from 12 to 11)
        minHighSchoolTime: 10.5, // Minimum time for high school level (in seconds)
        speedFactor: 0.8,     // How much speed affects performance
        enduranceFactor: 0.2, // How much endurance affects performance
        techFactor: 0.4,      // How much technique affects performance
        mash_decay: 0.02,     // How quickly button mashing boost decays
        terrain: 'track',     // Visual style
        obstacles: false,     // No obstacles in sprint
        jumpEffect: -0.05,    // Jumping slows you in sprint (% of speed)
        enforceMinTime: true  // Flag to enforce minimum time based on competition level
    },
    mile: {
        distance: 1600,       // 1600 meters
        expectedTime: 300,    // Base expected time in seconds
        speedFactor: 0.4,     // Speed less important than endurance
        enduranceFactor: 0.8, // Endurance most important for mile
        techFactor: 0.5,      // Technique moderately important
        mash_decay: 0.08,     // Button mashing less sustainable
        terrain: 'track',     // Visual style
        obstacles: false,     // No obstacles
        jumpEffect: -0.15     // Jumping more detrimental in longer race
    },
    country: {
        distance: 3000,       // 3k cross country
        expectedTime: 720,    // Base expected time in seconds
        speedFactor: 0.3,     // Speed less important
        enduranceFactor: 0.7, // Endurance very important
        techFactor: 0.7,      // Technique important for terrain
        mash_decay: 0.12,     // Button mashing not sustainable
        terrain: 'country',   // Visual style
        obstacles: true,      // Includes obstacles to jump
        jumpEffect: 0.05      // Jumping helps with terrain
    }
};

// Current race state
let raceState = {
    type: null,
    distance: 0,
    totalDistance: 0,
    time: 0,
    timeLimit: 0,
    started: false,
    finished: false,
    competitors: [],
    playerPosition: 1,
    playerProgress: 0,
    playerSpeed: 0,
    basePace: 0,
    currentPace: 0,
    lastStaminaUpdate: 0,
    stamina: 100, // 0-100, affects current pace
    terrain: 'track',
    config: null
};

// Start a race with the given type
window.startRace = function(raceType) {
    // Hide regular game over screen and loading screen
    document.querySelector('.loading-screen').style.display = 'none';
    document.querySelector('.game-over-screen').style.display = 'none';
    
    // Make sure race info is visible
    document.querySelector('.race-info').style.display = 'block';
    
    // Set up race config
    raceState = {
        type: raceType,
        distance: 0,
        totalDistance: RACE_CONFIG[raceType].distance,
        time: 0,
        timeLimit: RACE_CONFIG[raceType].expectedTime * 1.5, // 50% buffer
        started: false,
        finished: false,
        competitors: [],
        playerPosition: 1,
        playerProgress: 0,
        playerSpeed: 0,
        basePace: calculateBasePace(raceType),
        currentPace: 0,
        lastStaminaUpdate: 0,
        stamina: 100,
        terrain: RACE_CONFIG[raceType].terrain,
        config: RACE_CONFIG[raceType]
    };
    
    // Get competition details from career system
    const competitionDetails = window.careerSystem.getCompetitionDetails(raceType);
    raceState.competitors = competitionDetails.competitors;
    
    // Calculate target time based on competition level and race type
    const targetTime = competitionDetails.targetTime;
    
    // Display race title and info
    document.getElementById('race-time').textContent = '00:00.00';
    document.getElementById('race-distance').textContent = '0';
    
    // Setup player object
    window.player = {
        x: 80,
        y: GAME_HEIGHT - GROUND_HEIGHT - (SPRITE_HEIGHT * 1.5),
        width: SPRITE_WIDTH * 2,
        height: SPRITE_HEIGHT * 2,
        velocityY: 0,
        isJumping: false,
        currentAnimation: ANIMATION.RUNNING_FALL,
        animationState: 'running',
        frameX: 0,
        frameY: 1,
        frameTimer: 0,
        frameDelay: 4,
        animationComplete: false
    };
    
    // Reset obstacle list
    window.obstacles = [];
    
    // If this race has obstacles, setup generation parameters
    if (raceState.config.obstacles) {
        window.obstacleFrequency = 100; // Less frequent than endless
    }
    
    // Reset game state
    window.gameActive = true;
    window.isPaused = false;
    window.score = 0;
    window.speedBoost = 0;
    window.currentSpeed = OBSTACLE_SPEED;
    window.abPressCount = 0;
    window.lastABPress = 0;
    
    // Set game mode to race
    window.gameMode = 'race';
    
    // Start the race countdown
    startRaceCountdown();
};

// Calculate base pace (meters per second) based on player stats and race type
function calculateBasePace(raceType) {
    const config = RACE_CONFIG[raceType];
    const stats = window.playerStats;
    
    // Base calculation uses expected time for race and adjusts with player stats
    const statFactor = (
        (stats.speed * config.speedFactor) +
        (stats.endurance * config.enduranceFactor) +
        (stats.technique * config.techFactor)
    ) / (config.speedFactor + config.enduranceFactor + config.techFactor);
    
    // Adjust pace based on stats (statFactor is 1-10)
    // A statFactor of 5 should give expected pace
    // Each point above/below 5 changes pace by 5%
    const paceMultiplier = 1 + ((statFactor - 5) * 0.05);
    
    // Base pace in meters per second
    let basePace = (config.distance / config.expectedTime) * paceMultiplier;
    
    // Apply competition level restrictions if this race type enforces minimum times
    if (config.enforceMinTime && config.minHighSchoolTime) {
        // Check if we're in high school
        const competitionLevel = window.careerSystem.getCurrentCompetitionLevel();
        if (competitionLevel === 'highschool') {
            // Calculate maximum allowed pace (in meters/second) based on minimum time
            const maxAllowedPace = config.distance / config.minHighSchoolTime;
            
            // Cap the pace to ensure minimum time is respected
            basePace = Math.min(basePace, maxAllowedPace);
        }
    }
    
    return basePace;
}

// Start race countdown (3-2-1-GO!)
function startRaceCountdown() {
    const countdownEl = document.createElement('div');
    countdownEl.className = 'race-countdown';
    countdownEl.textContent = '3';
    document.querySelector('.game-wrapper').appendChild(countdownEl);
    
    // Reset race timer to ensure it starts from 0
    raceState.time = 0;
    raceState.lastStaminaUpdate = Date.now();
    
    let count = 3;
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count.toString();
        } else if (count === 0) {
            countdownEl.textContent = 'GO!';
            // Start race
            raceState.started = true;
            startRaceLoop();
        } else {
            // Remove countdown element
            clearInterval(countdownInterval);
            countdownEl.remove();
        }
    }, 1000);
}

// Start race game loop
function startRaceLoop() {
    // Set current pace to base pace
    raceState.currentPace = raceState.basePace;
    
    // Start competitor simulations
    simulateCompetitors();
    
    // Start race timer
    raceState.lastStaminaUpdate = Date.now();
    
    // Start the game loop
    window.gameLoop();
}

// Update race state - called during game loop
window.updateRace = function(deltaTime) {
    if (!raceState.started || raceState.finished) return;
    
    // Update time
    raceState.time += deltaTime;
    
    // Update stamina
    updateStamina(deltaTime);
    
    // Check for speedboost (button mashing)
    const boostMultiplier = 1 + (window.speedBoost / 5);
    
    // Calculate current pace with stamina and boost factors
    const staminaFactor = Math.max(0.5, raceState.stamina / 100);
    raceState.currentPace = raceState.basePace * staminaFactor * boostMultiplier;
    
    // Update player distance
    const distanceDelta = raceState.currentPace * deltaTime;
    raceState.distance += distanceDelta;
    
    // Update player progress (0-1)
    raceState.playerProgress = raceState.distance / raceState.totalDistance;
    
    // Update UI
    updateRaceUI();
    
    // Check for race completion
    if (raceState.distance >= raceState.totalDistance) {
        finishRace();
    }
    
    // Check for time limit
    if (raceState.time >= raceState.timeLimit) {
        finishRace(true); // DNF (Did Not Finish)
    }
    
    // Update player position relative to competitors
    updatePositions();
    
    // Ensure obstacles are never generated for sprint races
    if (raceState.type === 'sprint' && window.obstacles && window.obstacles.length > 0) {
        // Clear any obstacles that might have been generated
        window.obstacles = [];
    }
};

// Update player stamina
function updateStamina(deltaTime) {
    // Basic stamina regeneration/depletion
    const now = Date.now();
    const timeSinceLastUpdate = (now - raceState.lastStaminaUpdate) / 1000;
    raceState.lastStaminaUpdate = now;
    
    // Stamina depletion from button mashing
    const mashDepletionRate = window.speedBoost * raceState.config.mash_decay * 100;
    
    // Stamina recovery rate based on endurance
    const recoveryRate = 2 + (window.playerStats.endurance * 0.3);
    
    // Natural stamina depletion based on distance covered
    const naturalDepletion = raceState.playerProgress * 0.5;
    
    // Calculate net stamina change
    const staminaChange = (recoveryRate - mashDepletionRate - naturalDepletion) * timeSinceLastUpdate;
    
    // Update stamina with limits
    raceState.stamina = Math.max(10, Math.min(100, raceState.stamina + staminaChange));
}

// Update race UI elements
function updateRaceUI() {
    // Update time display
    document.getElementById('race-time').textContent = window.careerSystem.formatTime(raceState.time);
    
    // Update distance display
    document.getElementById('race-distance').textContent = Math.floor(raceState.distance);
    
    // Update position display
    const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
    const suffix = (raceState.playerPosition > 0 && raceState.playerPosition < 4) ? 
                   suffixes[raceState.playerPosition] : suffixes[0];
    document.getElementById('race-position').textContent = raceState.playerPosition + suffix;
    
    // Update progress bar
    const progressBar = document.querySelector('.race-progress-bar');
    progressBar.style.width = `${raceState.playerProgress * 100}%`;
    
    // Change progress bar color based on position
    if (raceState.playerPosition === 1) {
        progressBar.style.backgroundColor = 'var(--nes-yellow)';
    } else if (raceState.playerPosition <= 3) {
        progressBar.style.backgroundColor = 'var(--nes-green)';
    } else {
        progressBar.style.backgroundColor = 'var(--nes-red)';
    }
}

// Simulate competitors for the race
function simulateCompetitors() {
    // Initialize competitors with varying starting paces
    raceState.competitors.forEach(competitor => {
        competitor.distance = 0;
        competitor.progress = 0;
        
        // Base pace calculation using competitor skill level
        const skillRatio = competitor.skill / 10; // 0-1 skill ratio
        
        // Target time adjusted by skill (faster with higher skill)
        const targetTime = raceState.config.expectedTime * (1.2 - (skillRatio * 0.4));
        
        // Calculate base pace in meters per second
        competitor.basePace = raceState.totalDistance / targetTime;
        
        // Will use this to vary pace during race
        competitor.currentPace = competitor.basePace;
        
        // Pace variation (how much the competitor will vary speed)
        competitor.paceVariation = 0.1 + (Math.random() * 0.2); // 10-30% variation
        
        // How often to vary pace (in seconds)
        competitor.paceChangeInterval = 5 + (Math.random() * 10); // 5-15 seconds
        competitor.lastPaceChange = 0;
        
        // Starting strength - how much they have left for end sprint
        competitor.stamina = 80 + (Math.random() * 20); // 80-100%
    });
}

// Update competitor positions and calculate player ranking
function updatePositions() {
    // Update all competitor distances
    raceState.competitors.forEach(competitor => {
        // Check if time to change pace
        if (raceState.time - competitor.lastPaceChange > competitor.paceChangeInterval) {
            // Vary pace randomly within variation range
            const variationFactor = 1 - competitor.paceVariation + (Math.random() * competitor.paceVariation * 2);
            
            // End of race sprint boost
            const progressFactor = competitor.progress > 0.75 ? 
                                  1 + ((competitor.progress - 0.75) * 4 * (competitor.stamina / 100)) : 1;
            
            // Update pace
            competitor.currentPace = competitor.basePace * variationFactor * progressFactor;
            competitor.lastPaceChange = raceState.time;
        }
        
        // Update distance and progress
        competitor.distance += competitor.currentPace * (1/60); // Assuming 60 FPS
        competitor.progress = competitor.distance / raceState.totalDistance;
    });
    
    // Create array of all participants including player
    const allParticipants = [
        { isPlayer: true, distance: raceState.distance },
        ...raceState.competitors.map(c => ({ isPlayer: false, distance: c.distance }))
    ];
    
    // Sort by distance (descending)
    allParticipants.sort((a, b) => b.distance - a.distance);
    
    // Find player position (1-based index)
    raceState.playerPosition = allParticipants.findIndex(p => p.isPlayer) + 1;
}

// Finish the race
function finishRace(didNotFinish = false) {
    raceState.finished = true;
    
    // Finalize competitor times
    raceState.competitors.forEach(competitor => {
        // If competitor didn't finish, estimate finish time
        if (competitor.progress < 1) {
            const remainingDistance = raceState.totalDistance - competitor.distance;
            const remainingTime = remainingDistance / competitor.currentPace;
            competitor.time = raceState.time + remainingTime;
        } else {
            competitor.time = competitor.distance / competitor.basePace;
        }
    });
    
    // Record player time
    const playerTime = didNotFinish ? null : raceState.time;
    
    // Get final position
    const finalPosition = raceState.playerPosition;
    
    // Calculate score based on position and time
    let score = 1000 - (finalPosition * 100); // Position-based score
    if (playerTime) {
        // Bonus for beating target time
        const targetTime = RACE_CONFIG[raceState.type].expectedTime;
        if (playerTime < targetTime) {
            score += Math.floor((targetTime - playerTime) * 10);
        }
    } else {
        score = 0; // No score for DNF
    }
    
    // Show race results
    showRaceResults(playerTime, finalPosition, score);
    
    // Record result in career system
    if (playerTime) {
        const result = window.careerSystem.recordRaceResult(
            raceState.type, 
            playerTime,
            finalPosition
        );
        
        // Show new record notification if achieved
        if (result.isNewRecord) {
            document.querySelector('.new-record').style.display = 'block';
        }
    }
}

// Show race results screen
function showRaceResults(time, position, score) {
    // Stop the game loop
    window.cancelAnimationFrame(window.animationFrameId);
    window.gameActive = false;
    
    // Update results screen
    document.getElementById('final-time').textContent = time ? window.careerSystem.formatTime(time) : 'DNF';
    
    const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
    const suffix = (position > 0 && position < 4) ? suffixes[position] : suffixes[0];
    document.getElementById('final-position').textContent = position + suffix;
    
    document.getElementById('final-score').textContent = score;
    
    // Update meet name
    document.getElementById('meet-name').textContent = window.careerSystem.getCurrentMeetName();
    
    // Show game over screen
    document.querySelector('.game-over-screen').style.display = 'flex';
    
    // Set up continue button - only set this once to avoid multiple handlers
    const continueButton = document.querySelector('.restart-button');
    // Remove any existing event listeners (prevents duplicate handlers)
    const newButton = continueButton.cloneNode(true);
    continueButton.parentNode.replaceChild(newButton, continueButton);
    
    // Add the new event listener
    newButton.addEventListener('click', continueToNextRace);
}

// Continue to next race (or season)
function continueToNextRace() {
    // Hide screens
    document.querySelector('.game-over-screen').style.display = 'none';
    document.querySelector('.game-wrapper').style.display = 'none';
    
    // Advance to next meet within the season
    const seasonChanged = window.careerSystem.advanceToNextMeet();
    
    // Show the race selection screen
    window.showMenuScreen('race-selection');
} 