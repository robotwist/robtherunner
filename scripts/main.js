// Rob the Runner - NES Style Game
// Inspired by early digital track and field games
// Main JavaScript file

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;
const GROUND_HEIGHT = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = 15;
const BASE_OBSTACLE_SPEED = 5;
const SCORE_INCREMENT = 1;
const GAME_DURATION = 60000; // 1 minute in milliseconds before story event

// Player sprite constants
const SPRITE_WIDTH = 24;  // Width of each sprite frame
const SPRITE_HEIGHT = 50; // Increased to ensure we capture the full sprite with head

// Performance optimization - reusable canvases for sprite processing
const tempSpriteCanvas = document.createElement('canvas');
tempSpriteCanvas.width = SPRITE_WIDTH;
tempSpriteCanvas.height = SPRITE_HEIGHT;
const tempSpriteCtx = tempSpriteCanvas.getContext('2d');

// Row positions in the sprite sheet (adjusted to capture full sprites including heads)
const ROW_POSITIONS = [
    0,      // Row 0: Walk to crouch (starts at y=0)
    50,     // Row 1: Running/fall (h=50)
    100,    // Row 2: Long jump (h=50)
    150,    // Row 3: Throw (h=50)
    200,    // Row 4: Hammer throw (h=50) 
    250     // Row 5: Mixed animations (h=50)
];

// Row heights (used for accurate sprite capturing)
const ROW_HEIGHTS = {
    0: 50,  // Walk to crouch 
    1: 50,  // Running/fall
    2: 50,  // Long jump
    3: 50,  // Throw
    4: 50,  // Hammer throw
    5: 50   // Mixed animations
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
let gameStartTime = 0;
let gameElapsedTime = 0;
let storyEventTriggered = false;

// Speed variables for button mashing
let playerSpeed = BASE_OBSTACLE_SPEED;
let buttonPressCount = 0;
let lastButtonPressTime = 0;
let speedDecayInterval;
let buttonCooldowns = {
    a: 0,
    b: 0
};

// Asset loading variables
let assetsLoaded = 0;
const TOTAL_ASSETS = 4;
let sprites = {
    player: null,
    ground: null,
    obstacle: null,
    background: null,
    tileset: null  // Added tileset sprite
};

// T-Rex character
let trex = {
    x: -100, // Start off-screen
    y: GAME_HEIGHT - GROUND_HEIGHT - 80, // Position above ground
    width: 80,
    height: 80,
    velocityY: 0,
    isJumping: false,
    isActive: false,
    frameX: 0,
    frameTimer: 0,
    frameDelay: 5
};

// Game constants and variables
let game = {
    active: false,
    paused: false,
    started: false,
    highScore: 0,
    introPlayed: false,
    debug: false,
    height: 0,
    width: 0,
    currentIntroSequence: null,
    skipTrexEncounter: false
};

// TNF Tileset constants
const TILE_SIZE = 16; // Size of each tile in the tileset
const TILESET = {
    // Track tiles
    TRACK_START: { x: 0, y: 0, width: 3, height: 2 },
    TRACK_MIDDLE: { x: 3, y: 0, width: 1, height: 2 },
    TRACK_END: { x: 4, y: 0, width: 3, height: 2 },
    
    // Hurdles and obstacles
    HURDLE: { x: 0, y: 2, width: 1, height: 2 },
    WATER_JUMP: { x: 1, y: 2, width: 2, height: 2 },
    
    // Crowd and scenery
    CROWD_CHEERING: { x: 0, y: 4, width: 4, height: 1 },
    CROWD_SEATED: { x: 0, y: 5, width: 4, height: 1 },
    
    // Environment
    SCOREBOARD: { x: 4, y: 2, width: 2, height: 2 },
    FLAG: { x: 6, y: 0, width: 1, height: 2 }
};

// Object pool for obstacles to reduce garbage collection
const obstaclePool = {
    active: [],     // Currently active obstacles
    inactive: [],   // Recycled obstacles ready for reuse
    
    // Get an obstacle from the pool or create a new one
    get: function(type, x, y, width, height) {
        if (this.inactive.length > 0) {
            // Reuse an existing obstacle
            const obstacle = this.inactive.pop();
            obstacle.x = x;
            obstacle.y = y;
            obstacle.width = width;
            obstacle.height = height;
            obstacle.type = type;
            this.active.push(obstacle);
            return obstacle;
        } else {
            // Create a new obstacle
            const obstacle = { x, y, width, height, type };
            this.active.push(obstacle);
            return obstacle;
        }
    },
    
    // Return an obstacle to the pool
    recycle: function(obstacle) {
        const index = this.active.indexOf(obstacle);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.inactive.push(obstacle);
        }
    },
    
    // Clear all obstacles
    clear: function() {
        // Move all active obstacles to inactive pool
        this.inactive = this.inactive.concat(this.active);
        this.active = [];
    }
};

// Game initialization
window.onload = function() {
    console.log("Window loaded - initializing game");
    
    // Initialize canvas
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Could not find canvas element 'game-canvas'!");
        return;
    }
    
    ctx = canvas.getContext('2d');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Add CRT overlay effect
    const crtOverlay = document.createElement('div');
    crtOverlay.className = 'crt-overlay';
    document.body.appendChild(crtOverlay);
    
    // Initialize loading bar
    const loadingBar = document.querySelector('.loading-bar');
    const loadingText = document.querySelector('.loading-text');
    console.log("Loading elements:", { loadingBar, loadingText });
    
    if (loadingBar) {
        loadingBar.style.width = '0%';
    } else {
        console.warn("Could not find loading bar element!");
    }
    
    if (loadingText) {
        loadingText.textContent = 'Loading assets... 0%';
    } else {
        console.warn("Could not find loading text element!");
    }
    
    // Reset player object
    player = {
        x: 50,
        y: GAME_HEIGHT - GROUND_HEIGHT - 38,
        width: 24,
        height: 38,
        velocityY: 0,
        isJumping: false,
        frameX: 0,
        frameY: ANIMATION.RUNNING_FALL,
        frameTimer: 0,
        frameDelay: 5,
        animationState: 'running',
        animationComplete: false
    };

    // Set initial game state
    gameActive = true;
    isPaused = false;
    score = 0;
    
    console.log("Starting asset loading...");
    // Load assets
    loadAssets();
    
    // Handle keyboard input
    setupControls();
    
    // Set up touch controls for mobile
    setupTouchControls();
    
    // Start speed decay interval
    speedDecayInterval = setInterval(decaySpeed, 100); // Decay speed every 100ms
};

// Asset loading
function loadAssets() {
    console.log("Loading assets - total assets to load:", TOTAL_ASSETS);
    
    // Make sure loading screens are visible
    const loadingScreens = document.querySelectorAll('.loading-screen');
    loadingScreens.forEach(screen => {
        screen.style.display = 'flex';
    });
    
    const updateLoadingBar = () => {
        assetsLoaded++;
        console.log(`Asset loaded: ${assetsLoaded}/${TOTAL_ASSETS}`);
        
        // Update all loading bars and texts
        const loadingBars = document.querySelectorAll('.loading-bar');
        const loadingTexts = document.querySelectorAll('.loading-text');
        const loadingPercent = (assetsLoaded / TOTAL_ASSETS) * 100;
        
        loadingBars.forEach(bar => {
            if (bar) bar.style.width = `${loadingPercent}%`;
        });
        
        loadingTexts.forEach(text => {
            if (text) text.textContent = `Loading assets... ${Math.floor(loadingPercent)}%`;
        });
        
        // When all assets are loaded, start the intro sequence
        if (assetsLoaded >= TOTAL_ASSETS) {
            console.log('All assets loaded successfully!');
            setTimeout(() => {
                // Hide all loading screens
                const allLoadingScreens = document.querySelectorAll('.loading-screen');
                allLoadingScreens.forEach(screen => {
                    console.log("Hiding loading screen:", screen.id || "unnamed");
                    screen.style.display = 'none';
                });
                
                // Start intro sequence
                console.log("Starting intro sequence");
                startIntroSequence();
                
                // Start the game loop
                console.log("Starting game loop");
                gameLoop();
            }, 500); // Short delay for effect
        }
    };
    
    // Prioritize loading critical assets first (player sprite)
    const loadPriorityAssets = () => {
        // Load player sprite first (most important)
        console.log("Loading player sprite...");
        sprites.player = new Image();
        sprites.player.onload = () => {
            console.log("Player sprite loaded successfully");
            updateLoadingBar();
            // After player sprite is loaded, load the rest in parallel
            loadSecondaryAssets();
        };
        sprites.player.onerror = (e) => {
            console.error('Failed to load player sprite:', e);
            console.log("Creating placeholder for player - CRITICAL ERROR");
            createPlaceholder('player', () => {
                updateLoadingBar();
                loadSecondaryAssets();
            });
        };
        sprites.player.src = 'assets/player.png';
    };
    
    // Load remaining assets in parallel
    const loadSecondaryAssets = () => {
        // Create or load the ground sprite
        console.log("Loading ground sprite...");
        tryLoadSprite('ground', 'assets/ground.png', updateLoadingBar);
        
        // Create or load the obstacle sprite
        console.log("Loading obstacle sprite...");
        tryLoadSprite('obstacle', 'assets/obstacle.png', updateLoadingBar);
        
        // Create or load the background
        console.log("Loading background sprite...");
        tryLoadSprite('background', 'assets/background.png', updateLoadingBar);
        
        // Load the TNF tileset (non-critical)
        console.log("Loading TNF tileset...");
        sprites.tileset = new Image();
        sprites.tileset.onload = () => {
            console.log("TNF tileset loaded successfully");
            // We're not counting this in the total assets
        };
        sprites.tileset.onerror = (e) => {
            console.error('Failed to load TNF tileset:', e);
        };
        sprites.tileset.src = 'assets/tnf_tileset.png';
    };
    
    // Start loading assets with prioritization
    loadPriorityAssets();
}

// Try to load a sprite, or use a placeholder if it fails
function tryLoadSprite(name, path, callback) {
    sprites[name] = new Image();
    sprites[name].onload = function() {
        console.log(`Successfully loaded sprite: ${name} from ${path}`);
        console.log(`Sprite dimensions: ${this.width}x${this.height}`);
        if (callback) callback();
    };
    sprites[name].onerror = function(e) {
        console.error(`Failed to load sprite: ${name} from ${path}`, e);
        console.log(`Creating placeholder for ${name}`);
        createPlaceholder(name, callback);
    };
    console.log(`Attempting to load sprite: ${name} from ${path}`);
    sprites[name].crossOrigin = "Anonymous"; // Add cross-origin support
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
            height = 30;
            // Red obstacle
            ctx.fillStyle = '#d81118';
            ctx.fillRect(0, 0, 30, 30);
            // White details
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(5, 5, 20, 2);
            break;
            
        case 'background':
            canvas.width = GAME_WIDTH;
            canvas.height = GAME_HEIGHT;
            // Blue sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
            gradient.addColorStop(0, '#0078f8');
            gradient.addColorStop(0.7, '#3cbcfc');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            // Add some clouds
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(i * 120 + 50, 60 + (i % 3) * 30, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(i * 120 + 80, 50 + (i % 3) * 30, 40, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
    
    // Convert canvas to image
    console.log(`Created placeholder for ${name}, dimensions: ${canvas.width}x${canvas.height}`);
    const dataURL = canvas.toDataURL('image/png');
    sprites[name].src = dataURL;
    sprites[name].onload = function() {
        console.log(`Placeholder loaded for ${name}`);
        if (callback) callback();
    };
}

// Initialize the game
function init() {
    // This function is no longer used and can be removed
    // Its functionality has been moved to the window.onload handler
    console.log("Init function is deprecated. Using window.onload instead.");
}

// Start intro sequence
function startIntroSequence() {
    console.log("Starting intro sequence, introPlayed:", game.introPlayed);
    
    if (game.introPlayed) {
        console.log("Intro already played, skipping directly to game");
        startGame();
        return;
    }
    
    // Hide all loading screens first
    const loadingScreens = document.querySelectorAll('.loading-screen');
    loadingScreens.forEach(screen => {
        console.log("Hiding loading screen:", screen.id || "unnamed");
        screen.style.display = 'none';
    });
    
    // Remove any existing intro sequences (cleanup)
    const existingIntroSequences = document.querySelectorAll('.intro-sequence');
    existingIntroSequences.forEach(seq => {
        try {
            seq.parentNode.removeChild(seq);
        } catch (e) {
            console.warn("Could not remove existing intro sequence:", e);
        }
    });
    
    // Check if player sprite is loaded
    if (!sprites.player || !sprites.player.complete) {
        console.error("Player sprite not loaded yet! Delaying intro sequence...");
        setTimeout(startIntroSequence, 500);
        return;
    }
    
    // Get the intro sequence container and make it visible
    const introSequence = document.getElementById('introSequence');
    if (!introSequence) {
        console.error("Could not find intro sequence element!");
        startGame(); // Skip to game if intro element is missing
        return;
    }
    
    // Make the intro sequence visible
    introSequence.style.display = 'flex';
    
    // Store a reference to this intro sequence in the game object
    game.currentIntroSequence = introSequence;
    
    // Get the canvas element for the intro animation
    const introCanvas = document.getElementById('introCanvas');
    if (!introCanvas) {
        console.error("Could not find intro canvas!");
        startGame(); // Skip to game if canvas is missing
        return;
    }
    
    // Set canvas dimensions
    introCanvas.width = 320;
    introCanvas.height = 240;
    
    // Get the press start button
    const pressStart = document.getElementById('pressStart');
    if (pressStart) {
        pressStart.style.display = 'none'; // Hide initially
    }
    
    // Initialize player position and animation for intro
    const introCtx = introCanvas.getContext('2d');
    const introPlayer = {
        x: -50,
        y: 160,
        width: SPRITE_WIDTH,
        height: SPRITE_HEIGHT,
        frameX: 0,
        animationRow: 0,
        speed: 3,
        state: 'running'
    };
    
    // Animation loop variables
    let frameCount = 0;
    let animationComplete = false;
    
    console.log("Starting intro animation loop");
    // Run the intro animation
    function animateIntro() {
        if (game.started) {
            console.log("Game already started, stopping intro animation");
            return;
        }
        
        // Clear the canvas
        introCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);
        
        // Draw a background similar to the game's background
        const gradient = introCtx.createLinearGradient(0, 0, 0, introCanvas.height);
        gradient.addColorStop(0, '#0078f8');
        gradient.addColorStop(0.7, '#3cbcfc');
        introCtx.fillStyle = gradient;
        introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);
        
        // Draw clouds
        for (let i = 0; i < 5; i++) {
            introCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            introCtx.beginPath();
            introCtx.arc(i * 70 + 20, 40 + (i % 3) * 20, 20, 0, Math.PI * 2);
            introCtx.fill();
            introCtx.beginPath();
            introCtx.arc(i * 70 + 40, 30 + (i % 3) * 20, 25, 0, Math.PI * 2);
            introCtx.fill();
        }
        
        // Draw a simple ground
        introCtx.fillStyle = '#8b4513'; // Brown ground
        introCtx.fillRect(0, 200, introCanvas.width, 40);
        introCtx.fillStyle = '#00b800'; // Green top of ground
        introCtx.fillRect(0, 200, introCanvas.width, 5);
        
        // Update player position based on state
        if (introPlayer.state === 'running') {
            introPlayer.x += introPlayer.speed;
            introPlayer.animationRow = ANIMATION.RUNNING_FALL;
            
            // Switch to jumping state when player reaches center
            if (introPlayer.x >= 120) {
                introPlayer.state = 'jumping';
                introPlayer.frameX = 0;
            }
        } else if (introPlayer.state === 'jumping') {
            introPlayer.x += 1;
            introPlayer.y -= 4;
            introPlayer.animationRow = ANIMATION.LONG_JUMP;
            
            // Switch to falling state at peak of jump
            if (introPlayer.y <= 100) {
                introPlayer.state = 'falling';
                introPlayer.frameX = FRAME_COUNT.RUNNING - 1; // Use last running frame for initial fall
            }
        } else if (introPlayer.state === 'falling') {
            introPlayer.x += 0.5;
            introPlayer.y += 8;
            introPlayer.animationRow = ANIMATION.RUNNING_FALL;
            introPlayer.frameX = FRAME_COUNT.RUNNING; // This is the falling frame (frame 6)
            
            // End animation when player falls off screen
            if (introPlayer.y > 240) {
                animationComplete = true;
                
                // Add flicker effect when character disappears
                introCanvas.style.animation = 'flicker-effect 0.8s ease-out forwards';
                
                // After flicker, show 'Press Play' prompt
                if (pressStart) {
                    setTimeout(() => {
                        pressStart.style.display = 'block';
                        console.log("Intro animation complete - showing 'Press Play' prompt");
                        
                        // Force start the game after 5 seconds if no input
                        setTimeout(() => {
                            if (!game.started) {
                                console.log("No input detected, auto-starting game");
                                startGameFromIntro();
                            }
                        }, 5000);
                    }, 800);
                } else {
                    // If pressStart element is missing, auto-start
                    setTimeout(() => {
                        if (!game.started) {
                            startGameFromIntro();
                        }
                    }, 1000);
                }
            }
        }
        
        // Draw the player
        if (!animationComplete) {
            try {
                drawSpriteForIntro(
                    introCtx, 
                    sprites.player, 
                    introPlayer.frameX * SPRITE_WIDTH, 
                    ROW_POSITIONS[introPlayer.animationRow], 
                    SPRITE_WIDTH, 
                    SPRITE_HEIGHT, 
                    introPlayer.x, 
                    introPlayer.y, 
                    SPRITE_WIDTH, 
                    SPRITE_HEIGHT
                );
                
                // Update animation frame for running
                if (introPlayer.state === 'running') {
                    frameCount++;
                    if (frameCount % 6 === 0) {
                        introPlayer.frameX = (introPlayer.frameX + 1) % FRAME_COUNT.RUNNING;
                    }
                }
            } catch (error) {
                console.error("Error drawing intro sprite:", error);
            }
        }
        
        // Continue animation loop
        requestAnimationFrame(animateIntro);
    }
    
    // Draw sprite for intro (with background removal)
    function drawSpriteForIntro(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (!img || !img.complete) {
            console.warn("Sprite image not complete or not available");
            return;
        }
        
        // Create a temporary canvas to handle the sprite with background removal
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the sprite section to the temporary canvas
        tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        
        // Get the image data to process pixels
        const imageData = tempCtx.getImageData(0, 0, sw, sh);
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
        
        // Draw the processed sprite to the intro canvas
        ctx.drawImage(tempCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
    }
    
    // Start the animation
    animateIntro();
    
    // Add event listener to start the game when pressing any key or clicking
    function startGameFromIntro() {
        if (animationComplete || true) { // Force the ability to start
            console.log("Starting game from intro");
            game.introPlayed = true;
            game.started = true; // Mark as started to prevent duplicate calls
            
            // Add screen transition effect
            const transitionOverlay = document.createElement('div');
            transitionOverlay.className = 'transition-overlay';
            transitionOverlay.style.position = 'fixed';
            transitionOverlay.style.top = '0';
            transitionOverlay.style.left = '0';
            transitionOverlay.style.width = '100%';
            transitionOverlay.style.height = '100%';
            transitionOverlay.style.background = '#000';
            transitionOverlay.style.zIndex = '999';
            transitionOverlay.style.opacity = '0';
            transitionOverlay.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(transitionOverlay);
            
            // Fade to black
            setTimeout(() => {
                transitionOverlay.style.opacity = '1';
                
                // Safely remove the intro sequence after fade
                setTimeout(() => {
                    try {
                        if (game.currentIntroSequence && game.currentIntroSequence.parentNode) {
                            game.currentIntroSequence.style.display = 'none';
                        } else {
                            console.warn("Intro sequence not found or already removed");
                            // Try to find it by ID as a fallback
                            const introSeq = document.getElementById('introSequence');
                            if (introSeq) {
                                introSeq.style.display = 'none';
                            }
                        }
                    } catch (e) {
                        console.error("Error removing intro sequence:", e);
                        // Just hide it if we can't remove it
                        if (game.currentIntroSequence) {
                            game.currentIntroSequence.style.display = 'none';
                        }
                    }
                    
                    // Start the game
                    startGame();
                    
                    // Fade back in to reveal the gameplay
                    setTimeout(() => {
                        transitionOverlay.style.opacity = '0';
                        
                        // Remove overlay after fade
                        setTimeout(() => {
                            if (transitionOverlay.parentNode) {
                                transitionOverlay.parentNode.removeChild(transitionOverlay);
                            }
                        }, 500);
                    }, 300);
                }, 500);
            }, 100);
        }
    }
    
    // Add global click and touch handlers to ensure game can start
    document.addEventListener('keydown', startGameFromIntro);
    document.addEventListener('click', startGameFromIntro);
    document.addEventListener('touchstart', startGameFromIntro);
    
    // Add specific handlers for the press-start element
    if (pressStart) {
        pressStart.addEventListener('click', startGameFromIntro);
        pressStart.addEventListener('touchstart', startGameFromIntro);
    }
}

// Start the actual gameplay after intro
function startGame() {
    console.log("Starting game");
    game.active = true;
    game.started = true;
    gameActive = true; // Set both game object and global variable
    
    // Ensure loading screens are hidden
    const loadingScreens = document.querySelectorAll('.loading-screen');
    loadingScreens.forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Ensure intro sequence is hidden
    const introElement = document.getElementById('introSequence');
    if (introElement) {
        introElement.style.display = 'none';
    }
    
    // Clear the cloudy effect for crisp gameplay
    document.body.classList.add('gameplay-started');
    
    // Add visual quality enhancement
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
        gameCanvas.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.5)';
        gameCanvas.style.transition = 'box-shadow 1s ease-out';
    }
    
    resetGame();
    
    // Ensure game loop is running
    if (!animationFrameId) {
        gameLoop();
    }
}

// Reset game state for a new game
function resetGame() {
    // Reset player
    player = {
        x: 50,
        y: GAME_HEIGHT - GROUND_HEIGHT - 38,
        width: 24,
        height: 38,
        velocityY: 0,
        isJumping: false,
        frameX: 0,
        frameY: ANIMATION.RUNNING_FALL,
        frameTimer: 0,
        frameDelay: 5,
        animationState: 'running',
        animationComplete: false
    };
    
    // Reset game elements
    obstaclePool.clear();
    gameActive = true;
    isPaused = false;
    score = 0;
    obstacleCounter = 0;
    obstacleFrequency = 70;
    
    // Reset T-Rex
    trex.isActive = false;
    trex.x = -100;
    
    // Reset time
    gameStartTime = Date.now();
    gameElapsedTime = 0;
    storyEventTriggered = false;
    
    // Reset speed
    playerSpeed = BASE_OBSTACLE_SPEED;
    buttonPressCount = 0;
    
    // Set initial animation
    setAnimation('running');
}

// Main game loop with timing
let lastTimestamp = 0;
let deltaTime = 0;

function gameLoop(timestamp) {
    // Calculate delta time in seconds
    if (!lastTimestamp) lastTimestamp = timestamp;
    deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
    lastTimestamp = timestamp;
    
    // Limit delta time to prevent large jumps after tab switching
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    // Clear the canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (!isPaused) {
        update(deltaTime);
    }
    
    render();
    
    if (gameActive) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update(dt) {
    // Update game timer
    if (gameActive && !isPaused) {
        gameElapsedTime = Date.now() - gameStartTime;
    }
    
    // Update player
    updatePlayer(dt);
    
    // Only generate regular obstacles
    generateObstacles();
    updateObstacles(dt);
    checkCollisions();
    
    // Update score
    score += SCORE_INCREMENT * dt * 60; // Scale by delta time for consistent speed
    
    // Update ground position for scrolling effect
    groundPos = (groundPos - playerSpeed * dt * 60) % 64; // Scale by delta time for consistent speed
    
    // Update button cooldowns
    if (buttonCooldowns.a > 0) buttonCooldowns.a -= dt * 60;
    if (buttonCooldowns.b > 0) buttonCooldowns.b -= dt * 60;
}

// Update player position and state
function updatePlayer(dt) {
    // Apply gravity
    player.velocityY += GRAVITY * dt * 60; // Scale by delta time for consistent physics
    player.y += player.velocityY * dt * 60;
    
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
    
    // Update sprite animation frame using delta time
    player.frameTimer += dt;
    
    // Calculate frame delay based on current speed
    const frameDelay = Math.max(0.03, 0.1 - ((playerSpeed - BASE_OBSTACLE_SPEED) * 0.01));
    
    if (player.frameTimer > frameDelay) {
        player.frameTimer = 0;
        
        // Advance to next frame based on current animation
        updateAnimationFrame();
    }
}

// Update obstacles position with delta time
function updateObstacles(dt) {
    for (let i = 0; i < obstaclePool.active.length; i++) {
        const obstacle = obstaclePool.active[i];
        obstacle.x -= playerSpeed * dt * 60; // Scale by delta time for consistent speed
        
        // Remove obstacles that have moved off screen
        if (obstacle.x + obstacle.width < 0) {
            obstaclePool.recycle(obstacle);
            i--; // Adjust index since we removed an item
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
    
    for (let i = 0; i < obstaclePool.active.length; i++) {
        const obstacle = obstaclePool.active[i];
        if (
            playerHitbox.x < obstacle.x + obstacle.width &&
            playerHitbox.x + playerHitbox.width > obstacle.x &&
            playerHitbox.y < obstacle.y + obstacle.height &&
            playerHitbox.y + playerHitbox.height > obstacle.y
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
    
    // Play crying animation
    setAnimation('crying');
    
    // Display game over screen
    const gameOverScreen = document.querySelector('.game-over-screen');
    gameOverScreen.style.display = 'block';
    
    // Update final score
    document.querySelector('.final-score').textContent = `SCORE: ${Math.floor(score)}`;
    
    // Stop animation
    cancelAnimationFrame(animationFrameId);
}

// Render game elements
function render() {
    // Clear the canvas first
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background
    if (sprites.background && sprites.background.complete) {
        ctx.drawImage(sprites.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        // Fallback background - blue gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#0078f8');
        gradient.addColorStop(0.7, '#3cbcfc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    
    // Draw scrolling ground
    for (let i = 0; i < GAME_WIDTH / 64 + 1; i++) {
        if (sprites.ground && sprites.ground.complete) {
            ctx.drawImage(sprites.ground, i * 64 + groundPos, GAME_HEIGHT - GROUND_HEIGHT, 64, GROUND_HEIGHT);
        } else {
            // Fallback ground
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(i * 64 + groundPos, GAME_HEIGHT - GROUND_HEIGHT, 64, GROUND_HEIGHT);
            ctx.fillStyle = '#00b800';
            ctx.fillRect(i * 64 + groundPos, GAME_HEIGHT - GROUND_HEIGHT, 64, 5);
        }
    }
    
    // Draw player (with chroma key handling)
    drawPlayerSprite();
    
    // Draw obstacles
    for (let i = 0; i < obstaclePool.active.length; i++) {
        const obstacle = obstaclePool.active[i];
        
        if (sprites.obstacle && sprites.obstacle.complete) {
            ctx.drawImage(
                sprites.obstacle,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
            );
        } else {
            // Fallback obstacle drawing
            ctx.fillStyle = '#d81118';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 2);
        }
    }
    
    // Draw score
    ctx.fillStyle = '#FCFCFC';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, 20, 30);
    
    // Show speed on the right side
    ctx.textAlign = 'right';
    const speedPercent = Math.floor(((playerSpeed - BASE_OBSTACLE_SPEED) / 5) * 100);
    ctx.fillText(`SPEED: ${speedPercent}%`, GAME_WIDTH - 20, 30);
    
    // Show race timer
    const timeElapsed = Math.floor(gameElapsedTime / 1000);
    ctx.textAlign = 'center';
    ctx.fillText(`RACE TIME: ${timeElapsed}s`, GAME_WIDTH / 2, 30);
}

// Draw the track using tileset
function drawTrack() {
    if (!sprites.tileset || !sprites.tileset.complete) return;
    
    const trackY = GAME_HEIGHT - GROUND_HEIGHT - 10;
    
    // Draw start section
    drawTileFromTileset(
        ctx,
        TILESET.TRACK_START,
        groundPos % 64, 
        trackY,
        TILESET.TRACK_START.width * TILE_SIZE,
        GROUND_HEIGHT
    );
    
    // Draw middle sections
    for (let i = 1; i < Math.floor(GAME_WIDTH / 64); i++) {
        drawTileFromTileset(
            ctx,
            TILESET.TRACK_MIDDLE,
            i * 64 + groundPos % 64, 
            trackY,
            TILESET.TRACK_MIDDLE.width * TILE_SIZE,
            GROUND_HEIGHT
        );
    }
    
    // Draw flag marking the end of the start section
    drawTileFromTileset(
        ctx,
        TILESET.FLAG,
        200 + groundPos % 400, 
        trackY - 32,
        TILESET.FLAG.width * TILE_SIZE,
        TILESET.FLAG.height * TILE_SIZE
    );
}

// Draw crowd in the background
function drawCrowd() {
    if (!sprites.tileset || !sprites.tileset.complete) return;
    
    // Draw crowd in the background (top part of screen)
    const crowdY = 50;
    
    // Alternate between cheering and seated crowds
    for (let i = 0; i < Math.ceil(GAME_WIDTH / (TILESET.CROWD_CHEERING.width * TILE_SIZE)); i++) {
        const crowdType = (i % 2 === 0) ? TILESET.CROWD_CHEERING : TILESET.CROWD_SEATED;
        const crowdWidth = crowdType.width * TILE_SIZE;
        
        drawTileFromTileset(
            ctx,
            crowdType,
            i * crowdWidth + (groundPos % crowdWidth / 2), // Slower parallax effect
            crowdY,
            crowdWidth,
            crowdType.height * TILE_SIZE
        );
    }
    
    // Draw scoreboard
    drawTileFromTileset(
        ctx,
        TILESET.SCOREBOARD,
        GAME_WIDTH - 150,
        crowdY + 30,
        TILESET.SCOREBOARD.width * TILE_SIZE,
        TILESET.SCOREBOARD.height * TILE_SIZE
    );
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
    
    // Get the correct height for the current animation row
    let sourceHeight = ROW_HEIGHTS[player.frameY];
    
    // Set vertical offset to position the sprite correctly
    const verticalOffset = -7; // Adjusted to show the complete sprite including head
    
    // Set source Y offset to ensure we capture the top of the head
    let sourceOffsetY = -5; // Start higher to include top of head
    
    // Resize the temp canvas if needed based on sourceHeight
    if (tempSpriteCanvas.height !== sourceHeight) {
        tempSpriteCanvas.height = sourceHeight;
    }
    
    // Clear the temporary canvas
    tempSpriteCtx.clearRect(0, 0, SPRITE_WIDTH, sourceHeight);
    
    // Draw the sprite section to the temporary canvas
    tempSpriteCtx.drawImage(
        sprites.player,
        sourceX, sourceY + sourceOffsetY,
        SPRITE_WIDTH, sourceHeight,
        0, 0,
        SPRITE_WIDTH, sourceHeight
    );
    
    // Get the image data to process pixels
    const imageData = tempSpriteCtx.getImageData(0, 0, SPRITE_WIDTH, sourceHeight);
    const data = imageData.data;
    
    // Process each pixel to handle the light green background
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Optimized green detection - combined check instead of multiple conditions
        if ((g > r * 1.5 && g > b * 1.5) ||                        // Standard green screen
            (g > 180 && r < 180 && b < 180 && g > Math.max(r, b)) || // Light green
            (Math.abs(r - 144) < 30 && Math.abs(g - 238) < 30 && Math.abs(b - 144) < 30)) { // Specific color
            data[i + 3] = 0; // Set alpha to transparent
        }
    }
    
    // Put the processed image data back to the temporary canvas
    tempSpriteCtx.putImageData(imageData, 0, 0);
    
    // Draw the processed sprite to the game canvas
    ctx.drawImage(
        tempSpriteCanvas,
        0, 0,
        SPRITE_WIDTH, sourceHeight,
        player.x, player.y + verticalOffset,
        player.width, player.height
    );
}

// Set up keyboard controls
function setupControls() {
    document.addEventListener('keydown', function(e) {
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            // Jump if on ground
            if (!player.isJumping && gameActive && !isPaused) {
                player.velocityY = -JUMP_FORCE;
                setAnimation('jumping');
            }
        } else if (e.code === 'KeyA') {
            // 'A' button press for running
            if (gameActive && !isPaused) {
                handleButtonPress('a');
            }
        } else if (e.code === 'KeyB') {
            // 'B' button press for running
            if (gameActive && !isPaused) {
                handleButtonPress('b');
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
        } else if (e.code === 'KeyT') {
            // Toggle T-Rex encounter (useful for debugging)
            game.skipTrexEncounter = !game.skipTrexEncounter;
            console.log(`T-Rex encounter ${game.skipTrexEncounter ? 'disabled' : 'enabled'}`);
            
            // Show a quick notification
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '100px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.background = 'rgba(0,0,0,0.7)';
            notification.style.color = '#fff';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            notification.style.fontFamily = '"Press Start 2P", cursive';
            notification.style.fontSize = '12px';
            notification.textContent = `T-Rex encounter ${game.skipTrexEncounter ? 'DISABLED' : 'ENABLED'}`;
            document.body.appendChild(notification);
            
            // Remove the notification after 2 seconds
            setTimeout(() => {
                notification.remove();
            }, 2000);
        } else if (e.code === 'KeyD') {
            toggleDebugVisualization();
        }
    });
    
    // Button controls for restart button
    const restartButtons = document.querySelectorAll('.restart-button');
    restartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const parent = this.closest('.pause-screen, .game-over-screen, .coming-soon-message');
            if (parent) {
                // Different behavior based on which screen we're on
                if (parent.classList.contains('pause-screen')) {
                    togglePause();
                } else {
                    parent.style.display = 'none';
                    restartGame();
                }
            }
        });
    });
}

// Set up touch controls for mobile devices
function setupTouchControls() {
    console.log("Setting up touch controls for mobile devices");
    
    // Add tap zones for mobile controls
    const gameWrapper = document.querySelector('.game-wrapper');
    
    // Create jump zone (left side of screen)
    const jumpZone = document.createElement('div');
    jumpZone.className = 'touch-zone jump-zone';
    jumpZone.style.position = 'absolute';
    jumpZone.style.top = '0';
    jumpZone.style.left = '0';
    jumpZone.style.width = '50%';
    jumpZone.style.height = '100%';
    jumpZone.style.zIndex = '50';
    jumpZone.style.touchAction = 'manipulation'; // Optimize touch response
    gameWrapper.appendChild(jumpZone);
    
    // Create speed-up zone (right side of screen)
    const speedZone = document.createElement('div');
    speedZone.className = 'touch-zone speed-zone';
    speedZone.style.position = 'absolute';
    speedZone.style.top = '0';
    speedZone.style.right = '0';
    speedZone.style.width = '50%';
    speedZone.style.height = '100%';
    speedZone.style.zIndex = '50';
    speedZone.style.touchAction = 'manipulation'; // Optimize touch response
    gameWrapper.appendChild(speedZone);
    
    // Add a visual indicator for touch controls
    const touchControlsHint = document.createElement('div');
    touchControlsHint.className = 'touch-controls-hint';
    touchControlsHint.style.position = 'absolute';
    touchControlsHint.style.bottom = '10px';
    touchControlsHint.style.left = '0';
    touchControlsHint.style.width = '100%';
    touchControlsHint.style.textAlign = 'center';
    touchControlsHint.style.color = 'rgba(255,255,255,0.7)';
    touchControlsHint.style.fontSize = '10px';
    touchControlsHint.style.fontFamily = '"Press Start 2P", cursive';
    touchControlsHint.style.zIndex = '60';
    touchControlsHint.style.pointerEvents = 'none';
    touchControlsHint.innerHTML = '<div style="float:left;margin-left:20px;">JUMP</div><div style="float:right;margin-right:20px;">RUN</div>';
    gameWrapper.appendChild(touchControlsHint);
    
    // Only show the hint on mobile devices
    if (window.innerWidth > 768) {
        touchControlsHint.style.display = 'none';
    }
    
    // Add touch handlers with improved responsiveness
    jumpZone.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!player.isJumping && gameActive && !isPaused) {
            player.velocityY = -JUMP_FORCE;
            setAnimation('jumping');
        }
    });
    
    // Rapid tapping for speed
    let lastTapTime = 0;
    speedZone.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameActive && !isPaused) {
            const now = Date.now();
            // Alternate between A and B button presses for running
            handleButtonPress(Math.random() < 0.5 ? 'a' : 'b');
            
            // Visual feedback for tap
            this.style.backgroundColor = 'rgba(255,255,255,0.1)';
            setTimeout(() => {
                this.style.backgroundColor = 'transparent';
            }, 100);
            
            lastTapTime = now;
        }
    });
    
    // Add swipe down to pause
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        const touchEndY = e.touches[0].clientY;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe down to pause (only if significant downward swipe)
        if (deltaY > 100 && gameActive && !isPaused) {
            togglePause();
        }
    }, { passive: true });
    
    // Disable double-tap zoom on mobile
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    const pauseScreen = document.querySelector('.pause-screen');
    pauseScreen.style.display = isPaused ? 'block' : 'none';
    
    // Show head scratch animation when paused
    if (isPaused) {
        setAnimation('headScratch');
    } else {
        setAnimation('running');
    }
}

// Restart the game
function restartGame() {
    // Hide game over and pause screens
    document.querySelector('.game-over-screen').style.display = 'none';
    document.querySelector('.pause-screen').style.display = 'none';
    
    // Reset and start game
    startGame();
}

// Handle button mashing for speed
function handleButtonPress(button) {
    const now = Date.now();
    
    // If within the button mashing window (300ms)
    if (now - lastButtonPressTime < 300) {
        buttonPressCount++;
        
        // Increase speed based on mashing frequency (any button works)
        playerSpeed = BASE_OBSTACLE_SPEED + Math.min(5, buttonPressCount * 0.2);
        
        // Adjust animation speed based on player speed
        player.frameDelay = Math.max(2, 5 - Math.floor((playerSpeed - BASE_OBSTACLE_SPEED)));
    } else {
        // Reset counter if too slow
        buttonPressCount = 1;
    }
    
    lastButtonPressTime = now;
}

// Decay speed when not pressing buttons
function decaySpeed() {
    if (gameActive && !isPaused) {
        const now = Date.now();
        
        // If haven't pressed in 400ms, start decay
        if (now - lastButtonPressTime > 400 && playerSpeed > BASE_OBSTACLE_SPEED) {
            playerSpeed = Math.max(BASE_OBSTACLE_SPEED, playerSpeed - 0.1);
            buttonPressCount = Math.max(0, buttonPressCount - 1);
        }
    }
}

// Trigger the story event (T-Rex encounter)
function triggerStoryEvent() {
    // Mark as triggered regardless of whether we show it
    storyEventTriggered = true;
    
    // Skip the T-Rex encounter if the flag is set
    if (game.skipTrexEncounter) {
        console.log("T-Rex encounter skipped due to user preference");
        return;
    }
    
    console.log("Triggering T-Rex encounter");
    
    // Create a dramatic effect for the T-Rex appearance
    const shakeEffect = (intensity) => {
        canvas.style.transform = `translate(${Math.random() * intensity - intensity/2}px, ${Math.random() * intensity - intensity/2}px)`;
    };
    
    // Create rumble effect
    let rumbleIntensity = 2;
    const rumbleInterval = setInterval(() => {
        shakeEffect(rumbleIntensity);
        rumbleIntensity += 0.5;
        if (rumbleIntensity > 10) {
            clearInterval(rumbleInterval);
            
            // Reset position after rumble
            setTimeout(() => {
                canvas.style.transform = 'translate(0, 0)';
            }, 500);
        }
    }, 50);
    
    // Add a flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0';
    flash.style.zIndex = '90';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    // Flash sequence
    setTimeout(() => {
        flash.style.opacity = '0.8';
        flash.style.transition = 'opacity 0.1s';
        
        setTimeout(() => {
            flash.style.opacity = '0';
            
            // Activate T-Rex after the flash
            setTimeout(() => {
                // Remove the flash element
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
                
                // Activate T-Rex
                trex.x = GAME_WIDTH + 50; // Position off-screen to the right
                trex.isActive = true;
                
                // Slow down the game slightly for dramatic effect
                playerSpeed = BASE_OBSTACLE_SPEED * 0.8;
                
                // Remove any obstacles that might interfere
                obstaclePool.clear();
                
                // Play dinosaur roar sound (if we had sound effects)
                console.log("T-Rex roar sound would play here");
            }, 300);
        }, 150);
    }, 500);
}

// Update T-Rex character
function updateTrex() {
    // Move T-Rex toward the player
    trex.x -= (playerSpeed * 1.2); // T-Rex moves faster than obstacles
    
    // Animate T-Rex
    trex.frameTimer++;
    if (trex.frameTimer > trex.frameDelay) {
        trex.frameTimer = 0;
        trex.frameX = (trex.frameX + 1) % 6; // Assuming 6 frames of T-Rex animation
    }
    
    // Make T-Rex jump occasionally
    if (!trex.isJumping && Math.random() < 0.01) {
        trex.velocityY = -JUMP_FORCE * 0.8;
        trex.isJumping = true;
    }
    
    // Apply gravity
    trex.velocityY += GRAVITY;
    trex.y += trex.velocityY;
    
    // Check ground collision
    if (trex.y > GAME_HEIGHT - GROUND_HEIGHT - trex.height) {
        trex.y = GAME_HEIGHT - GROUND_HEIGHT - trex.height;
        trex.velocityY = 0;
        trex.isJumping = false;
    }
}

// Check for collision with T-Rex
function checkTrexCollision() {
    // If T-Rex and player are close enough
    if (Math.abs((player.x + player.width/2) - (trex.x + trex.width/2)) < 60) {
        if (!isPaused) {
            console.log("T-Rex collision detected, showing conversation");
            // Pause the game and show dialogue
            isPaused = true;
            showConversation();
        }
    }
}

// Placeholder for T-Rex drawing - we'll use a simple representation for now
function drawTrexSprite() {
    // For now, just draw a placeholder rectangle for the T-Rex
    ctx.fillStyle = 'green';
    ctx.fillRect(trex.x, trex.y, trex.width, trex.height);
    
    // Draw T-Rex eyes
    ctx.fillStyle = 'black';
    ctx.fillRect(trex.x + 60, trex.y + 15, 10, 10);
    
    // Draw T-Rex mouth
    ctx.fillStyle = 'red';
    ctx.fillRect(trex.x + 70, trex.y + 30, 10, 20);
}

// Conversation system
let conversationIndex = 0;
let dialogueEventListenerAdded = false; // Flag to track if we've added the event listener
const conversations = [
    { speaker: "T-Rex", text: "ROAAAAR! Oh! Sorry about that." },
    { speaker: "Rob", text: "Whoa! A talking dinosaur?!" },
    { speaker: "T-Rex", text: "I'm Rex. I was just out for my morning run." },
    { speaker: "Rob", text: "I'm Rob... also out for a run." },
    { speaker: "T-Rex", text: "Running is great for clearing your head, isn't it?" },
    { speaker: "Rob", text: "Totally! Wait... aren't you supposed to be extinct?" },
    { speaker: "T-Rex", text: "That's a common misconception. I've just been training in secret." },
    { speaker: "Rob", text: "For what?" },
    { speaker: "T-Rex", text: "The Inter-Temporal Olympics, of course!" },
    { speaker: "Rob", text: "That sounds amazing! Can I join?" },
    { speaker: "T-Rex", text: "Actually, I've been looking for a training partner! Want to team up?" },
    { speaker: "Rob", text: "Let's do it! What's our first event?" },
    { speaker: "T-Rex", text: "Great! Press SPACE to continue our adventure..." }
];

// Show conversation dialogue
function showConversation() {
    console.log("Showing conversation dialogue");
    // Create dialogue box if it doesn't exist
    if (!document.querySelector('.dialogue-box')) {
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'dialogue-box';
        dialogueBox.id = 'gameDialogueBox'; // Add ID for easier selection
        dialogueBox.innerHTML = `
            <div class="dialogue-speaker"></div>
            <div class="dialogue-text"></div>
            <div class="dialogue-prompt">PRESS SPACE TO CONTINUE (or ESC to skip)</div>
        `;
        document.body.appendChild(dialogueBox);
        
        // Only add the event listener once
        if (!dialogueEventListenerAdded) {
            console.log("Adding dialogue event listeners");
            
            // Add event listener for advancing dialogue
            document.addEventListener('keydown', handleDialogueKeyPress);
            
            // Also support touch for mobile
            dialogueBox.addEventListener('touchstart', function(e) {
                if (isPaused && document.querySelector('.dialogue-box')) {
                    e.preventDefault();
                    advanceConversation();
                }
            });
            
            dialogueEventListenerAdded = true;
        }
    }
    
    // Reset conversation index
    conversationIndex = 0;
    
    // Display the first dialogue
    updateDialogueText();
}

// Handle key presses for dialogue
function handleDialogueKeyPress(e) {
    if (isPaused && document.querySelector('.dialogue-box')) {
        if (e.code === 'Space') {
            console.log("Space pressed - advancing dialogue");
            advanceConversation();
        } else if (e.code === 'Escape') {
            console.log("Escape pressed - skipping conversation");
            endConversation();
        }
    }
}

// Update the dialogue text
function updateDialogueText() {
    const dialogue = conversations[conversationIndex];
    const speakerElement = document.querySelector('.dialogue-speaker');
    const textElement = document.querySelector('.dialogue-text');
    
    if (dialogue) {
        console.log(`Showing dialogue ${conversationIndex+1}/${conversations.length}: ${dialogue.speaker} - "${dialogue.text}"`);
        speakerElement.textContent = dialogue.speaker;
        textElement.textContent = dialogue.text;
    } else {
        // End of conversation
        console.log("No more dialogue, ending conversation");
        endConversation();
    }
}

// Advance to the next dialogue
function advanceConversation() {
    conversationIndex++;
    console.log(`Advanced to conversation index ${conversationIndex}`);
    
    if (conversationIndex < conversations.length) {
        updateDialogueText();
    } else {
        console.log("Reached end of conversations, calling endConversation()");
        endConversation();
    }
}

// End the conversation
function endConversation() {
    console.log("Ending conversation");
    
    // Remove dialogue box
    const dialogueBox = document.querySelector('.dialogue-box');
    if (dialogueBox) {
        console.log("Removing dialogue box");
        dialogueBox.remove();
    }
    
    // Clean up the event listener
    if (dialogueEventListenerAdded) {
        console.log("Removing dialogue event listener");
        document.removeEventListener('keydown', handleDialogueKeyPress);
        dialogueEventListenerAdded = false;
    }
    
    // Reset conversation index for next time
    conversationIndex = 0;
    
    // Unpause and continue the adventure
    isPaused = false;
    
    // For now, just restart the game to simulate continuing
    // In a full implementation, this would transition to a new game mode
    setTimeout(() => {
        // Display a "Coming Soon" message
        const comingSoonMessage = document.createElement('div');
        comingSoonMessage.className = 'coming-soon-message';
        comingSoonMessage.innerHTML = `
            <h2>ADVENTURE CONTINUES SOON!</h2>
            <p>Rob and Rex's training for the Inter-Temporal Olympics will continue in the next update!</p>
            <button class="restart-button">PLAY AGAIN</button>
        `;
        document.body.appendChild(comingSoonMessage);
        
        // Add event listener to restart button
        comingSoonMessage.querySelector('.restart-button').addEventListener('click', function() {
            comingSoonMessage.remove();
            restartGame();
        });
    }, 1000);
}

// Function to draw a tile from the tileset
function drawTileFromTileset(ctx, tileInfo, x, y, width, height) {
    if (!sprites.tileset || !sprites.tileset.complete) {
        // Draw a placeholder if tileset isn't loaded
        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, width || (tileInfo.width * TILE_SIZE), height || (tileInfo.height * TILE_SIZE));
        return;
    }
    
    // Draw the specified tile from the tileset
    ctx.drawImage(
        sprites.tileset,
        tileInfo.x * TILE_SIZE, 
        tileInfo.y * TILE_SIZE,
        tileInfo.width * TILE_SIZE, 
        tileInfo.height * TILE_SIZE,
        x, 
        y,
        width || (tileInfo.width * TILE_SIZE), 
        height || (tileInfo.height * TILE_SIZE)
    );
}

// Toggle debug visualization
function toggleDebugVisualization() {
    // If this is the first call, create the debug canvas
    if (!window.debugCanvas) {
        // Create debug canvas for visualizing the sprite sheet
        window.debugCanvas = document.createElement('canvas');
        window.debugCanvas.width = sprites.player.width * 3; // 3x scale for better visibility
        window.debugCanvas.height = sprites.player.height * 3;
        window.debugCanvas.style.position = 'fixed';
        window.debugCanvas.style.top = '10px';
        window.debugCanvas.style.right = '10px';
        window.debugCanvas.style.border = '2px solid black';
        window.debugCanvas.style.background = '#222';
        window.debugCanvas.style.zIndex = '1000';
        document.body.appendChild(window.debugCanvas);
        
        // Get context for debug canvas
        const debugCtx = window.debugCanvas.getContext('2d');
        
        // Draw the sprite sheet for reference
        debugCtx.drawImage(
            sprites.player, 
            0, 0, 
            sprites.player.width, sprites.player.height,
            0, 0,
            window.debugCanvas.width, window.debugCanvas.height
        );
        
        // Draw grid lines
        debugCtx.strokeStyle = '#00FF00';
        debugCtx.lineWidth = 1;
        
        // Vertical grid lines (frame columns)
        for (let x = 0; x <= sprites.player.width; x += SPRITE_WIDTH) {
            const scaledX = x * 3;
            debugCtx.beginPath();
            debugCtx.moveTo(scaledX, 0);
            debugCtx.lineTo(scaledX, window.debugCanvas.height);
            debugCtx.stroke();
        }
        
        // Horizontal grid lines (row separators)
        debugCtx.strokeStyle = '#00FFFF'; // Use cyan for better visibility
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i];
            const scaledY = y * 3;
            debugCtx.beginPath();
            debugCtx.moveTo(0, scaledY);
            debugCtx.lineTo(window.debugCanvas.width, scaledY);
            debugCtx.stroke();
        }
        
        // Add red lines to show where head should start
        debugCtx.strokeStyle = 'red';
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i] - 5; // Mark where the head should start (-5 is our source offset)
            const scaledY = y * 3;
            debugCtx.beginPath();
            debugCtx.moveTo(0, scaledY);
            debugCtx.lineTo(window.debugCanvas.width, scaledY);
            debugCtx.stroke();
        }
        
        // Add frame coordinates - with better visibility
        debugCtx.font = '12px Arial';
        debugCtx.fillStyle = 'yellow'; // Changed from white to yellow for better visibility
        debugCtx.strokeStyle = 'black';
        debugCtx.lineWidth = 2;
        
        for (let i = 0; i < ROW_POSITIONS.length; i++) {
            const y = ROW_POSITIONS[i];
            for (let col = 0; col < Math.floor(sprites.player.width / SPRITE_WIDTH); col++) {
                const text = `${col},${i}`;
                const x = col * SPRITE_WIDTH + 2;
                
                // Add black outline for better readability
                debugCtx.strokeText(text, x * 3, y * 3 + 12);
                debugCtx.fillText(text, x * 3, y * 3 + 12);
            }
        }
        
        // Add row height indicators
        debugCtx.fillStyle = '#00FFFF'; // Cyan for better visibility
        debugCtx.strokeStyle = 'black';
        
        for (let i = 0; i < ROW_POSITIONS.length - 1; i++) {
            const height = ROW_HEIGHTS[i];
            const text = `h=${height}px`;
            // Add black outline
            debugCtx.strokeText(text, 5, (ROW_POSITIONS[i] + height) * 3 - 5);
            debugCtx.fillText(text, 5, (ROW_POSITIONS[i] + height) * 3 - 5);
        }
        
        // Last row
        const lastRowHeight = ROW_HEIGHTS[ROW_POSITIONS.length - 1]; 
        const text = `h=${lastRowHeight}px`;
        debugCtx.strokeText(text, 5, (ROW_POSITIONS[ROW_POSITIONS.length-1] + lastRowHeight) * 3 - 5);
        debugCtx.fillText(text, 5, (ROW_POSITIONS[ROW_POSITIONS.length-1] + lastRowHeight) * 3 - 5);
        
        // Improved title for debug view
        debugCtx.fillStyle = '#FF5555';
        debugCtx.font = '16px Arial';
        debugCtx.fillText('SPRITE SHEET DEBUG', 10, 20);
        
        // Add controls info
        debugCtx.fillStyle = 'white';
        debugCtx.font = '10px Arial';
        debugCtx.fillText('Press D to toggle debug view', 10, window.debugCanvas.height - 30);
        debugCtx.fillText('Press 0-7 to test animations', 10, window.debugCanvas.height - 15);
        
        // Add height measurement for source offset
        debugCtx.font = '14px Arial';
        debugCtx.fillStyle = 'green';
        debugCtx.fillText(`Source Offset Y: ${sourceOffsetY}px`, 10, 40);
        debugCtx.fillText(`Vertical Offset: ${verticalOffset}px`, 10, 60);
    } else {
        // Toggle visibility
        window.debugCanvas.style.display = 
            window.debugCanvas.style.display === 'none' ? 'block' : 'none';
    }
    
    // Toggle hitbox visualization
    window.showHitbox = !window.showHitbox;
} 

// Make functions globally accessible for debug button
window.startGame = startGame;
window.resetGame = resetGame;
window.gameLoop = gameLoop;

// Update the animation frame based on current state - optimized version
function updateAnimationFrame() {
    switch(player.animationState) {
        case 'running':
            // Running animation (frames 0-5 of row 1)
            player.frameY = ANIMATION.RUNNING_FALL;
            
            // Increment frame and loop when needed
            player.frameX = (player.frameX + 1) % FRAME_COUNT.RUNNING;
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
                player.frameX = Math.min(Math.floor(riseProgress * (FRAME_COUNT.LONG_JUMP / 2)), (FRAME_COUNT.LONG_JUMP / 2) - 1);
            } else {
                // Falling - second half of frames
                const fallProgress = Math.min(1, player.velocityY / (JUMP_FORCE / 2));
                player.frameX = Math.min(Math.floor((FRAME_COUNT.LONG_JUMP / 2) + fallProgress * (FRAME_COUNT.LONG_JUMP / 2)), FRAME_COUNT.LONG_JUMP - 1);
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
            if (player.frameX < FRAME_COUNT.FOSBURY_FLOP - 1) {
                player.frameX++;
            } else {
                // Animation complete, switch back to running
                setAnimation('running');
            }
            break;
            
        case 'flex':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.FLEX_START + (Math.floor(Date.now() / 200) % FRAME_COUNT.FLEX);
            break;
            
        case 'headScratch':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.HEAD_SCRATCH_START + (Math.floor(Date.now() / 200) % FRAME_COUNT.HEAD_SCRATCH);
            break;
            
        case 'crying':
            player.frameY = ANIMATION.MIXED;
            player.frameX = MIXED_FRAMES.CRYING_START + (Math.floor(Date.now() / 200) % FRAME_COUNT.CRYING);
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
    player.frameTimer = 0; // Reset frame timer
    
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
        // Decide on obstacle type (variety)
        const obstacleType = Math.floor(Math.random() * 3); // 0, 1, or 2
        
        let width = 30;
        let height = 30;
        
        // Adjust size based on type
        if (obstacleType === 1) { // Water jump
            width = 45;
            height = 25;
        } else if (obstacleType === 2) { // Higher hurdle
            height = 40;
        }
        
        // Get an obstacle from the pool
        obstaclePool.get(
            obstacleType, 
            GAME_WIDTH, 
            GAME_HEIGHT - GROUND_HEIGHT - height, 
            width, 
            height
        );
        
        obstacleCounter = 0;
        
        // Adjust frequency as game progresses (gets harder)
        if (obstacleFrequency > 30) {
            obstacleFrequency -= 0.1;
        }
    }
}