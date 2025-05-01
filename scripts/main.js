// Rob the Runner - NES Style Game
// Main JavaScript file

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;
const GROUND_HEIGHT = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = 15;
const OBSTACLE_SPEED = 5;
const BASE_OBSTACLE_SPEED = 5; // Base speed for obstacles
const MAX_SPEED_BOOST = 3; // Maximum speed boost from mashing A/B
const SCORE_INCREMENT = 1;
const SPEED_BOOST_DECAY = 0.05; // How quickly the speed boost decays
const BOOST_WINDOW = 500; // Time window in ms to consider rapid keypresses

// Expose constants to global scope for other scripts
window.GAME_WIDTH = GAME_WIDTH;
window.GAME_HEIGHT = GAME_HEIGHT;
window.GROUND_HEIGHT = GROUND_HEIGHT;
window.GRAVITY = GRAVITY;
window.JUMP_FORCE = JUMP_FORCE;
window.OBSTACLE_SPEED = OBSTACLE_SPEED;
window.BASE_OBSTACLE_SPEED = BASE_OBSTACLE_SPEED;
window.MAX_SPEED_BOOST = MAX_SPEED_BOOST;
window.SCORE_INCREMENT = SCORE_INCREMENT;
window.SPEED_BOOST_DECAY = SPEED_BOOST_DECAY;
window.BOOST_WINDOW = BOOST_WINDOW;

// Player sprite constants
const SPRITE_WIDTH = 24;  // Width of each sprite frame
const SPRITE_HEIGHT = 38; // Adjusted height based on user feedback

// Row positions in the sprite sheet (adjusted to uniform 38px heights)
const ROW_POSITIONS = [
    0,      // Row 0: Walk to crouch (starts at y=0)
    38,     // Row 1: Running/fall (h=38)
    76,     // Row 2: Long jump (h=38)
    114,    // Row 3: Throw (h=38)
    152,    // Row 4: Hammer throw (h=38) 
    190     // Row 5: Mixed animations (h=38)
];

// Row heights (used for accurate sprite capturing)
const ROW_HEIGHTS = {
    0: 38,  // Walk to crouch 
    1: 38,  // Running/fall
    2: 38,  // Long jump
    3: 38,  // Throw
    4: 38,  // Hammer throw
    5: 38   // Mixed animations
};

// Animation Types (now using the row position indices rather than absolute positions)
const ANIMATION = {
    WALK_TO_CROUCH: 0,  // First row: walking to crouch (13 frames)
    RUNNING_FALL: 1,    // Second row: full stride running + fall (7 frames)
    LONG_JUMP: 2,       // Third row: long jumping (9 frames)
    THROW: 3,           // Fourth row: throw animation (12 frames)
    HAMMER_THROW: 4,    // Fifth row: spinning hammer throw (8 frames)
    MIXED: 5            // Sixth row: mixed animations (10 frames)
};

// Frame counts for each animation
const FRAME_COUNT = {
    WALK_TO_CROUCH: 13,
    RUNNING: 6,
    FALL: 1,            // The fall frame is the 7th frame in row 1
    RUNNING_FALL: 7,    // Total frames in running/fall row
    LONG_JUMP: 9,
    THROW: 12,
    HAMMER_THROW: 8,
    FOSBURY_FLOP: 4,
    FLEX: 2,
    HEAD_SCRATCH: 2,
    CRYING: 2,
    MIXED: 10           // Total frames in the mixed row
};

// Starting positions for mixed animations in row 5
const MIXED_FRAMES = {
    FOSBURY_FLOP_START: 0,
    FLEX_START: 4,
    HEAD_SCRATCH_START: 6,
    CRYING_START: 8
};

// Game variables
let canvas, ctx;
let player;
let obstacles = [];
let gameActive = false;
let isPaused = false;
let score = 0;
let animationFrameId;
let obstacleCounter = 0;
let groundPos = 0;
let obstacleFrequency = 70; // Higher number = less frequent
let currentSpeed = BASE_OBSTACLE_SPEED; // Current game speed
let speedBoost = 0; // Current speed boost from button mashing
let lastABPress = 0; // Timestamp of last A or B press
let abPressCount = 0; // Counter for rapid A/B presses
let lastTime = 0; // For delta time calculation

// Asset loading variables
let assetsLoaded = 0;
const TOTAL_ASSETS = 4;
let sprites = {};

// Expose sprite constants to global scope for other scripts
window.SPRITE_WIDTH = SPRITE_WIDTH;
window.SPRITE_HEIGHT = SPRITE_HEIGHT;
window.ROW_POSITIONS = ROW_POSITIONS;
window.ROW_HEIGHTS = ROW_HEIGHTS;
window.ANIMATION = ANIMATION;

// Game initialization
window.onload = function() {
    // Initialize canvas
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Add CRT overlay effect
    const crtOverlay = document.createElement('div');
    crtOverlay.className = 'crt-overlay';
    document.body.appendChild(crtOverlay);
    
    // Load assets
    loadAssets();
    
    // Handle keyboard input
    setupControls();
    
    // Set up touch controls for mobile
    setupTouchControls();
    
    // Initialize game mode
    window.gameMode = 'endless'; // Default mode
};

// Asset loading
function loadAssets() {
    const updateLoadingBar = () => {
        assetsLoaded++;
        const loadingBar = document.querySelector('.loading-bar');
        const loadingPercent = (assetsLoaded / TOTAL_ASSETS) * 100;
        loadingBar.style.width = `${loadingPercent}%`;
        
        if (assetsLoaded >= TOTAL_ASSETS) {
            setTimeout(startGame, 500); // Short delay for effect
        }
    };
    
    // Load player sprite
    sprites.player = new Image();
    sprites.player.onload = updateLoadingBar;
    sprites.player.src = 'assets/player.png';
    
    // Create or load the ground sprite
    tryLoadSprite('ground', 'assets/ground.png', updateLoadingBar);
    
    // Create or load the obstacle sprite
    tryLoadSprite('obstacle', 'assets/obstacle.png', updateLoadingBar);
    
    // Create or load the background
    tryLoadSprite('background', 'assets/background.png', updateLoadingBar);
}

// Try to load a sprite, or use a placeholder if it fails
function tryLoadSprite(name, path, callback) {
    sprites[name] = new Image();
    sprites[name].onload = callback;
    sprites[name].onerror = () => {
        console.log(`Failed to load ${path}, creating placeholder`);
        createPlaceholder(name, callback);
    };
    sprites[name].src = path;
}

// Create placeholder sprites if needed
function createPlaceholder(name, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    switch(name) {
        case 'ground':
            canvas.width = 64;
            canvas.height = 40;
            // Brown ground with green top
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(0, 0, 64, 40);
            ctx.fillStyle = '#00b800';
            ctx.fillRect(0, 0, 64, 5);
            break;
            
        case 'obstacle':
            canvas.width = 30;
            canvas.height = 30;
            // Red obstacle
            ctx.fillStyle = '#d81118';
            ctx.fillRect(0, 0, 30, 30);
            // White details
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(5, 5, 20, 2);
            break;
            
        case 'background':
            canvas.width = 640;
            canvas.height = 360;
            // Blue sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 360);
            gradient.addColorStop(0, '#0078f8');
            gradient.addColorStop(0.7, '#3cbcfc');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 640, 360);
            break;
    }
    
    // Convert canvas to image
    sprites[name].src = canvas.toDataURL('image/png');
    if (callback) callback();
}

// Initialize the game
function startGame() {
    // Hide loading screen
    document.querySelector('.loading-screen').style.display = 'none';
    
    // Initialize player
    player = {
        x: 80,
        y: GAME_HEIGHT - GROUND_HEIGHT - (SPRITE_HEIGHT * 1.5), // Position correctly above ground
        width: SPRITE_WIDTH * 2, // Scale sprite width for better visibility
        height: SPRITE_HEIGHT * 2, // Scale sprite height for better visibility
        velocityY: 0,
        isJumping: false,
        currentAnimation: ANIMATION.RUNNING_FALL, // Default animation
        animationState: 'running', // Used to track the current animation behavior
        frameX: 0, // Current sprite frame (column)
        frameY: 1, // Current animation row (start with running animation)
        frameTimer: 0,
        frameDelay: 4, // Control animation speed (higher = slower)
        animationComplete: false // Track if a one-time animation is complete
    };
    
    // Reset game state
    obstacles = [];
    score = 0;
    obstacleFrequency = 70; // Reset obstacle frequency
    gameActive = true;
    isPaused = false;
    speedBoost = 0;
    currentSpeed = BASE_OBSTACLE_SPEED;
    abPressCount = 0;
    lastABPress = 0;
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    // Calculate delta time for frame rate independence
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle game states
    if (gameActive && !isPaused) {
        if (window.gameMode === 'endless') {
            // Endless runner mode
            update();
        } else if (window.gameMode === 'race') {
            // Race mode
            update();
            window.updateRace(deltaTime);
        }
    }
    
    // Render game
    render();
    
    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Update player
    updatePlayer();
    
    // Generate obstacles (only in endless mode or for races with obstacles)
    if (window.gameMode === 'endless' || (window.gameMode === 'race' && window.raceState && window.raceState.config.obstacles)) {
        generateObstacles();
    }
    
    // Update obstacles
    updateObstacles();
    
    // Check collisions
    checkCollisions();
    
    // Update score
    score += SCORE_INCREMENT * (1 + speedBoost/5); // Score increases with speed
    
    // Decay speed boost over time
    if (speedBoost > 0) {
        const decayRate = window.gameMode === 'race' && window.raceState ? 
            window.raceState.config.mash_decay : SPEED_BOOST_DECAY;
            
        speedBoost = Math.max(0, speedBoost - decayRate);
        updateCurrentSpeed();
    }
    
    // Update ground position for scrolling effect - now uses currentSpeed
    groundPos = (groundPos - currentSpeed) % 64; // 64 is ground tile width
}

// Function to update current game speed based on boost
function updateCurrentSpeed() {
    currentSpeed = BASE_OBSTACLE_SPEED + speedBoost;
}

// Update player position and state
function updatePlayer() {
    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // Check ground collision
    if (player.y > GAME_HEIGHT - GROUND_HEIGHT - player.height) {
        player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
        player.velocityY = 0;
        
        // If was jumping, switch back to running animation
        if (player.isJumping) {
            player.isJumping = false;
            setAnimation('running');
        }
    }
    
    // Update sprite animation frame
    player.frameTimer++;
    if (player.frameTimer > player.frameDelay) {
        player.frameTimer = 0;
        
        // Advance to next frame based on current animation
        updateAnimationFrame();
    }
}

// Update the animation frame based on current state
function updateAnimationFrame() {
    switch(player.animationState) {
        case 'running':
            // Running animation (frames 0-5 of row 1)
            player.frameY = ANIMATION.RUNNING_FALL;
            
            if (player.frameX >= FRAME_COUNT.RUNNING - 1) {
                player.frameX = 0; // Loop running animation
            } else {
                player.frameX++;
            }
            break;
            
        case 'falling':
            // Falling animation (frame 6 of row 1)
            player.frameY = ANIMATION.RUNNING_FALL;
            player.frameX = 6; // The fall frame
            break;
            
        case 'jumping':
            // Long jumping animation (row 2)
            player.frameY = ANIMATION.LONG_JUMP;
            
            // Advance through jump frames based on jump progress
            if (player.velocityY < 0) {
                // Rising - first half of frames
                const riseProgress = Math.min(1, -player.velocityY / (JUMP_FORCE / 2));
                const frameIndex = Math.min(Math.floor(riseProgress * (FRAME_COUNT.LONG_JUMP / 2)), (FRAME_COUNT.LONG_JUMP / 2) - 1);
                player.frameX = frameIndex;
            } else {
                // Falling - second half of frames
                const fallProgress = Math.min(1, player.velocityY / (JUMP_FORCE / 2));
                const frameIndex = Math.min(Math.floor((FRAME_COUNT.LONG_JUMP / 2) + fallProgress * (FRAME_COUNT.LONG_JUMP / 2)), FRAME_COUNT.LONG_JUMP - 1);
                player.frameX = frameIndex;
            }
            break;
            
        case 'walkToCrouch':
            player.frameY = ANIMATION.WALK_TO_CROUCH;
            if (player.frameX < FRAME_COUNT.WALK_TO_CROUCH - 1) {
                player.frameX++;
            } else {
                // Animation complete, switch back to running
                setAnimation('running');
            }
            break;
            
        case 'throw':
            player.frameY = ANIMATION.THROW;
            if (player.frameX < FRAME_COUNT.THROW - 1) {
                player.frameX++;
            } else {
                // Animation complete, switch back to running
                setAnimation('running');
            }
            break;
            
        case 'hammerThrow':
            player.frameY = ANIMATION.HAMMER_THROW;
            if (player.frameX < FRAME_COUNT.HAMMER_THROW - 1) {
                player.frameX++;
            } else {
                // Animation complete, switch back to running
                setAnimation('running');
            }
            break;
            
        case 'fosburyFlop':
            player.frameY = ANIMATION.MIXED;
            const flopFrame = MIXED_FRAMES.FOSBURY_FLOP_START + player.frameX;
            
            if (player.frameX < FRAME_COUNT.FOSBURY_FLOP - 1) {
                player.frameX++;
            } else {
                // Animation complete, switch back to running
                setAnimation('running');
            }
            break;
            
        case 'flex':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.FLEX_START + (player.frameTimer % FRAME_COUNT.FLEX);
            break;
            
        case 'headScratch':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.HEAD_SCRATCH_START + (player.frameTimer % FRAME_COUNT.HEAD_SCRATCH);
            break;
            
        case 'crying':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.CRYING_START + (player.frameTimer % FRAME_COUNT.CRYING);
            break;
    }
}

// Set the animation state
function setAnimation(animationName) {
    // Don't interrupt certain animations
    if (player.animationState === animationName) {
        return; // Already in this animation
    }
    
    // Some animations should not be interrupted
    if (player.animationState === 'throw' || 
        player.animationState === 'hammerThrow' || 
        player.animationState === 'fosburyFlop') {
        if (player.animationComplete === false) {
            return; // Don't interrupt in-progress animations
        }
    }
    
    player.animationState = animationName;
    player.frameX = 0; // Reset to first frame
    player.animationComplete = false;
    
    // Set animation specific properties
    switch(animationName) {
        case 'running':
            player.frameY = ANIMATION.RUNNING_FALL;
            break;
            
        case 'jumping':
            player.frameY = ANIMATION.LONG_JUMP;
            player.isJumping = true;
            break;
            
        case 'falling':
            player.frameY = ANIMATION.RUNNING_FALL;
            player.frameX = 6; // Fall frame
            break;
            
        case 'walkToCrouch':
            player.frameY = ANIMATION.WALK_TO_CROUCH;
            break;
            
        case 'throw':
            player.frameY = ANIMATION.THROW;
            break;
            
        case 'hammerThrow':
            player.frameY = ANIMATION.HAMMER_THROW;
            break;
            
        case 'fosburyFlop':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.FOSBURY_FLOP_START;
            break;
            
        case 'flex':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.FLEX_START;
            break;
            
        case 'headScratch':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.HEAD_SCRATCH_START;
            break;
            
        case 'crying':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.CRYING_START;
            break;
    }
}

// Generate obstacles
function generateObstacles() {
    obstacleCounter++;
    
    // Create new obstacle based on frequency
    if (obstacleCounter >= obstacleFrequency) {
        obstacles.push({
            x: GAME_WIDTH,
            y: GAME_HEIGHT - GROUND_HEIGHT - 30, // Obstacle on ground
            width: 30,
            height: 30
        });
        
        obstacleCounter = 0;
        
        // Adjust frequency as game progresses (gets harder)
        if (obstacleFrequency > 30) {
            obstacleFrequency -= 0.1;
        }
    }
}

// Update obstacles position
function updateObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= currentSpeed; // Use current speed with boost
        
        // Remove obstacles that have moved off screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// Check for collisions between player and obstacles
function checkCollisions() {
    // Create a smaller hitbox for the player (more forgiving)
    const hitboxPadding = 6;
    const playerHitbox = {
        x: player.x + hitboxPadding,
        y: player.y + hitboxPadding,
        width: player.width - hitboxPadding * 2,
        height: player.height - hitboxPadding * 2
    };
    
    for (let i = 0; i < obstacles.length; i++) {
        if (
            playerHitbox.x < obstacles[i].x + obstacles[i].width &&
            playerHitbox.x + playerHitbox.width > obstacles[i].x &&
            playerHitbox.y < obstacles[i].y + obstacles[i].height &&
            playerHitbox.y + playerHitbox.height > obstacles[i].y
        ) {
            // Start death animation
            setAnimation('falling');
            setTimeout(() => gameOver(), 500); // Delay game over to show fall animation
            break;
        }
    }
}

// Handle game over
function gameOver() {
    gameActive = false;
    
    // Show game over message
    document.querySelector('.game-over-screen').style.display = 'flex';
    
    if (window.gameMode === 'endless') {
        // Update final score display
        document.querySelector('.final-score').textContent = `SCORE: ${Math.floor(score)}`;
    }
    
    // Stop the game loop
    cancelAnimationFrame(animationFrameId);
}

// Render game elements
function render() {
    // Draw background
    ctx.drawImage(sprites.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw scrolling ground
    for (let i = 0; i < GAME_WIDTH / 64 + 1; i++) {
        ctx.drawImage(sprites.ground, i * 64 + groundPos, GAME_HEIGHT - GROUND_HEIGHT, 64, GROUND_HEIGHT);
    }
    
    // Draw player (with chroma key handling)
    drawPlayerSprite();
    
    // Draw obstacles
    for (let i = 0; i < obstacles.length; i++) {
        ctx.drawImage(
            sprites.obstacle,
            obstacles[i].x, obstacles[i].y,
            obstacles[i].width, obstacles[i].height
        );
    }
    
    // Draw score - only in endless mode
    if (window.gameMode === 'endless') {
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${Math.floor(score)}`, 20, 30);
        
        // Draw speed boost indicator when active
        if (speedBoost > 0) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(`SPEED: ${Math.floor(speedBoost * 100 / MAX_SPEED_BOOST)}%`, 20, 60);
        }
    }
}

// Draw player sprite with green background handling
function drawPlayerSprite() {
    // Calculate the correct source position in the spritesheet
    const sourceX = player.frameX * SPRITE_WIDTH;
    
    // Use the adjusted row positions instead of simple multiplication
    const sourceY = ROW_POSITIONS[player.frameY];
    
    // Visual debugging (optional)
    if (window.showHitbox) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }
    
    // Adjust the vertical offset to show the complete sprite
    const verticalOffset = -4; // Adjusted offset to show the complete sprite with 38px height
    
    // Get the correct height for the current animation row
    let sourceHeight = ROW_HEIGHTS[player.frameY];
    
    // For the jumping animation, we need to adjust the source rectangle
    // to ensure we capture the whole sprite including head and feet
    let sourceOffsetY = -2; // Start 2 pixels higher to include top of head
    
    // Create a temporary canvas to handle the sprite with background removal
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = SPRITE_WIDTH;
    tempCanvas.height = sourceHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the sprite section to the temporary canvas
    tempCtx.drawImage(
        sprites.player,
        sourceX, sourceY + sourceOffsetY,
        SPRITE_WIDTH, sourceHeight,
        0, 0,
        SPRITE_WIDTH, sourceHeight
    );
    
    // Get the image data to process pixels
    const imageData = tempCtx.getImageData(0, 0, SPRITE_WIDTH, sourceHeight);
    const data = imageData.data;
    
    // Process each pixel to handle the light green background
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Different green background detection methods
        
        // 1. Standard green screen (chroma key)
        const isGreen = (g > r * 1.5 && g > b * 1.5);
        
        // 2. Light green detection
        const isLightGreen = (
            r > 100 && r < 200 &&
            g > 180 && g < 255 &&
            b > 100 && b < 200 &&
            g > Math.max(r, b)
        );
        
        // 3. Specific color range detection
        const isNearTargetGreen = (
            Math.abs(r - 144) < 30 &&
            Math.abs(g - 238) < 30 &&
            Math.abs(b - 144) < 30
        );
        
        // Make pixel transparent if it matches any of our green detection methods
        if (isGreen || isLightGreen || isNearTargetGreen) {
            data[i + 3] = 0; // Set alpha to transparent
        }
    }
    
    // Put the processed image data back to the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw the processed sprite to the game canvas
    ctx.drawImage(
        tempCanvas,
        0, 0,
        SPRITE_WIDTH, sourceHeight,
        player.x, player.y + verticalOffset,
        player.width, player.height
    );
}

// Set up keyboard controls
function setupControls() {
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            // Jump if on ground
            if (!player.isJumping && gameActive && !isPaused) {
                player.velocityY = -JUMP_FORCE;
                setAnimation('jumping');
            }
        } else if (e.code === 'KeyA' || e.code === 'KeyB') {
            // Handle A/B button mashing for speed boost
            if (gameActive && !isPaused) {
                const now = Date.now();
                
                // Check if this is a rapid press (within time window)
                if (now - lastABPress < BOOST_WINDOW) {
                    abPressCount++;
                    
                    // Calculate boost based on press count, with a cap
                    speedBoost = Math.min(MAX_SPEED_BOOST, abPressCount / 5);
                    updateCurrentSpeed();
                    
                    // Visual feedback for speed boost
                    if (speedBoost > MAX_SPEED_BOOST * 0.7) {
                        // Show "flex" animation briefly if at high speed and not jumping
                        if (!player.isJumping && player.animationState === 'running') {
                            setAnimation('flex');
                            setTimeout(() => {
                                if (player.animationState === 'flex') {
                                    setAnimation('running');
                                }
                            }, 300);
                        }
                    }
                } else {
                    // Reset counter if too slow
                    abPressCount = 1;
                }
                
                lastABPress = now;
            }
        } else if (e.code === 'KeyP') {
            // Toggle pause
            if (gameActive) {
                togglePause();
            }
        } else if (e.code === 'KeyR') {
            // Restart game
            if (!gameActive || isPaused) {
                restartGame();
            }
        } else if (e.code === 'Digit1') {
            // Demo: Walk to crouch animation
            setAnimation('walkToCrouch');
        } else if (e.code === 'Digit2') {
            // Demo: Throw animation
            setAnimation('throw');
        } else if (e.code === 'Digit3') {
            // Demo: Hammer throw animation
            setAnimation('hammerThrow');
        } else if (e.code === 'Digit4') {
            // Demo: Fosbury flop animation
            setAnimation('fosburyFlop');
        } else if (e.code === 'Digit5') {
            // Demo: Flex animation
            setAnimation('flex');
        } else if (e.code === 'Digit6') {
            // Demo: Head scratch animation
            setAnimation('headScratch');
        } else if (e.code === 'Digit7') {
            // Demo: Crying animation
            setAnimation('crying');
        } else if (e.code === 'Digit0') {
            // Back to running
            setAnimation('running');
        } else if (e.code === 'KeyD') {
            // Toggle debug visualization
            toggleDebugVisualization();
        }
    });
    
    // Button controls
    const jumpButton = document.querySelector('.btn-a');
    const pauseButton = document.querySelector('.start-btn');
    const restartButton = document.querySelector('.restart-button');
    
    jumpButton.addEventListener('click', function() {
        if (!player.isJumping && gameActive && !isPaused) {
            player.velocityY = -JUMP_FORCE;
            setAnimation('jumping');
        }
    });
    
    pauseButton.addEventListener('click', function() {
        if (gameActive) {
            togglePause();
        }
    });
    
    restartButton.addEventListener('click', restartGame);
}

// Toggle debug visualization
function toggleDebugVisualization() {
    // Create a debug canvas if it doesn't exist
    if (!window.debugCanvas) {
        window.debugCanvas = document.createElement('canvas');
        window.debugCanvas.width = sprites.player.width; // Use actual sprite sheet width
        window.debugCanvas.height = sprites.player.height; // Use actual sprite sheet height
        window.debugCanvas.style.position = 'fixed';
        window.debugCanvas.style.top = '10px';
        window.debugCanvas.style.right = '10px';
        window.debugCanvas.style.border = '3px solid red';
        window.debugCanvas.style.zIndex = '1000';
        window.debugCanvas.style.background = '#333';
        window.debugCanvas.style.transform = 'scale(3)'; // Make it 3x larger for easier viewing
        window.debugCanvas.style.transformOrigin = 'top right';
        document.body.appendChild(window.debugCanvas);
        
        // Draw the sprite sheet
        const ctx = window.debugCanvas.getContext('2d');
        ctx.drawImage(sprites.player, 0, 0);
        
        // Add grid lines to visualize frames
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Brighter grid lines
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines (columns)
        for (let x = 0; x <= sprites.player.width; x += SPRITE_WIDTH) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sprites.player.height);
            ctx.stroke();
        }
        
        // Horizontal grid lines using the adjusted row positions
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i];
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sprites.player.width, y);
            ctx.stroke();
            
            // Add a line for the bottom of this row (which is the top of the next row)
            if (i < ROW_POSITIONS.length - 1) {
                const nextY = ROW_POSITIONS[i+1];
                ctx.beginPath();
                ctx.moveTo(0, nextY);
                ctx.lineTo(sprites.player.width, nextY);
                ctx.stroke();
            } else {
                // For the last row, add a line at the bottom edge
                const lastRowBottom = y + ROW_HEIGHTS[i]; // Height of the last row
                ctx.beginPath();
                ctx.moveTo(0, lastRowBottom);
                ctx.lineTo(sprites.player.width, lastRowBottom);
                ctx.stroke();
            }
        }
        
        // Add frame coordinates - with better visibility
        ctx.font = '10px Arial';
        ctx.fillStyle = 'yellow'; // Changed from white to yellow for better visibility
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i];
            for (let col = 0; col < Math.floor(sprites.player.width / SPRITE_WIDTH); col++) {
                const text = `${col},${i}`;
                const x = col * SPRITE_WIDTH + 2;
                
                // Add black outline for better readability
                ctx.strokeText(text, x, y + 12);
                ctx.fillText(text, x, y + 12);
            }
        }
        
        // Add row height indicators
        ctx.fillStyle = '#00FFFF'; // Cyan for better visibility
        ctx.strokeStyle = 'black';
        
        for (let i = 0; i < ROW_POSITIONS.length - 1; i++) {
            const height = ROW_HEIGHTS[i];
            const text = `h=${height}px`;
            // Add black outline
            ctx.strokeText(text, 5, ROW_POSITIONS[i] + height - 5);
            ctx.fillText(text, 5, ROW_POSITIONS[i] + height - 5);
        }
        
        // Last row
        const lastRowHeight = ROW_HEIGHTS[ROW_POSITIONS.length - 1]; 
        const text = `h=${lastRowHeight}px`;
        ctx.strokeText(text, 5, ROW_POSITIONS[ROW_POSITIONS.length-1] + lastRowHeight - 5);
        ctx.fillText(text, 5, ROW_POSITIONS[ROW_POSITIONS.length-1] + lastRowHeight - 5);
        
        // Improved title for debug view
        ctx.fillStyle = '#FF5555';
        ctx.font = '12px Arial';
        ctx.fillText('SPRITE SHEET DEBUG', 5, 10);
        
        // Add controls info
        ctx.fillStyle = 'white';
        ctx.font = '8px Arial';
        ctx.fillText('Press D to toggle debug view', 5, sprites.player.height - 5);
        ctx.fillText('Press 0-7 to test animations', 5, sprites.player.height - 15);
        
        // Add visual markers for head region
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        
        // Draw a horizontal line at the nose level to indicate where top of head is
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i] - 2; // Mark where the top of head should be
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sprites.player.width, y);
            ctx.stroke();
        }
    } else {
        // Toggle visibility
        window.debugCanvas.style.display = 
            window.debugCanvas.style.display === 'none' ? 'block' : 'none';
    }
    
    // Toggle hitbox visualization
    window.showHitbox = !window.showHitbox;
}

// Set up touch controls for mobile devices
function setupTouchControls() {
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!player.isJumping && gameActive && !isPaused) {
            player.velocityY = -JUMP_FORCE;
            setAnimation('jumping');
        }
    });
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        // Show pause screen
        document.querySelector('.pause-screen').style.display = 'flex';
    } else {
        // Hide pause screen
        document.querySelector('.pause-screen').style.display = 'none';
    }
}

// Make togglePause available globally
window.togglePause = togglePause;

// Restart the game
function restartGame() {
    // Hide game over and pause screens
    document.querySelector('.game-over-screen').style.display = 'none';
    document.querySelector('.pause-screen').style.display = 'none';
    
    // Reset and start game
    startGame();
} 