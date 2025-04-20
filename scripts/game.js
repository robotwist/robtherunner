/**
 * Rob The Runner - NES Style Game
 * Main Game JavaScript
 */

// Game constants
const GAME_WIDTH = 256;
const GAME_HEIGHT = 240;
const GROUND_HEIGHT = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = -12;
const RUN_SPEED = 3;
const ENEMY_SPEED = 2;
const COIN_VALUE = 10;

// Game state
let gameState = {
    isLoading: true,
    isGameOver: false,
    isPaused: false,
    isRunning: false,
    loadingProgress: 0,
    score: 0,
    coins: 0,
    distance: 0,
    energy: 100,
    maxEnergy: 100,
    energyDecay: 0.1,
    level: 1,
    runTime: 0,
    gameMode: "track", // track, store, or menu
    characterAge: "child", // child, teen, adult
    highScore: localStorage.getItem('highScore') || 0
};

// Game assets
const assets = {
    sprites: {},
    sounds: {},
    backgrounds: {}
};

// Character object
const player = {
    x: 50,
    y: GAME_HEIGHT - GROUND_HEIGHT - 30,
    width: 24,
    height: 32,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    isRunning: false,
    frame: 0,
    frameCount: 4,
    animationSpeed: 6,
    animationCounter: 0,
    direction: 1 // 1 for right, -1 for left
};

// Game objects
let obstacles = [];
let coins = [];
let powerUps = [];
let particles = [];
let backgrounds = [];

// Canvas and context
let canvas;
let ctx;
let lastTime = 0;
let animationId;

// Control tracking
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    z: false,
    x: false,
    Enter: false
};

// DOM elements
const keyElements = {};

// Initialize the game
function init() {
    // Get canvas and set up context
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Set up event listeners
    setupEventListeners();
    
    // Load assets
    loadAssets();
    
    // Set up UI elements
    setupUI();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

// Load all game assets
function loadAssets() {
    // Track loading progress
    const totalAssets = 10; // Update this with actual number of assets
    let loadedAssets = 0;
    
    // Function to update loading progress
    function updateLoadingProgress() {
        loadedAssets++;
        gameState.loadingProgress = (loadedAssets / totalAssets) * 100;
        
        // Update the loading bar
        const loadingBar = document.querySelector('.loading-bar');
        loadingBar.style.width = gameState.loadingProgress + '%';
        
        // If all assets are loaded, start the game
        if (loadedAssets === totalAssets) {
            setTimeout(() => {
                gameState.isLoading = false;
                document.querySelector('.loading-screen').classList.add('hidden');
                startGame();
            }, 1000);
        }
    }
    
    // Load sprites
    loadSprite('runner_child', 'assets/sprites/runner_child.png', updateLoadingProgress);
    loadSprite('runner_teen', 'assets/sprites/runner_teen.png', updateLoadingProgress);
    loadSprite('runner_adult', 'assets/sprites/runner_adult.png', updateLoadingProgress);
    loadSprite('obstacle', 'assets/sprites/obstacle.png', updateLoadingProgress);
    loadSprite('coin', 'assets/sprites/coin.png', updateLoadingProgress);
    loadSprite('powerup', 'assets/sprites/powerup.png', updateLoadingProgress);
    
    // Load backgrounds
    loadBackground('track_background', 'assets/backgrounds/track_background.png', updateLoadingProgress);
    loadBackground('store_background', 'assets/backgrounds/store_background.png', updateLoadingProgress);
    loadBackground('menu_background', 'assets/backgrounds/menu_background.png', updateLoadingProgress);
    
    // Load sound effects
    loadSound('jump', 'assets/sounds/jump.wav', updateLoadingProgress);
}

// Function to load a sprite
function loadSprite(name, src, callback) {
    const img = new Image();
    img.onload = callback;
    img.onerror = () => {
        console.error(`Failed to load sprite: ${src}`);
        callback(); // Still call callback to continue loading
    };
    img.src = src;
    assets.sprites[name] = img;
}

// Function to load a background
function loadBackground(name, src, callback) {
    const img = new Image();
    img.onload = callback;
    img.onerror = () => {
        console.error(`Failed to load background: ${src}`);
        callback();
    };
    img.src = src;
    assets.backgrounds[name] = img;
}

// Function to load a sound
function loadSound(name, src, callback) {
    const sound = new Audio();
    sound.oncanplaythrough = callback;
    sound.onerror = () => {
        console.error(`Failed to load sound: ${src}`);
        callback();
    };
    sound.src = src;
    assets.sounds[name] = sound;
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            updateControllerDisplay(e.key, true);
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
            updateControllerDisplay(e.key, false);
        }
    });
    
    // Touch/click controls for mobile
    document.querySelectorAll('.key-press').forEach(key => {
        const keyName = key.getAttribute('data-key');
        keyElements[keyName] = key;
        
        key.addEventListener('mousedown', () => {
            keys[keyName] = true;
            updateControllerDisplay(keyName, true);
        });
        
        key.addEventListener('mouseup', () => {
            keys[keyName] = false;
            updateControllerDisplay(keyName, false);
        });
        
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[keyName] = true;
            updateControllerDisplay(keyName, true);
        });
        
        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[keyName] = false;
            updateControllerDisplay(keyName, false);
        });
    });
}

// Update the controller display
function updateControllerDisplay(key, isActive) {
    const element = document.querySelector(`.key-press[data-key="${key}"]`);
    if (element) {
        if (isActive) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}

// Set up UI elements
function setupUI() {
    // This will set up any UI elements that need initialization
}

// Start the game
function startGame() {
    gameState.isRunning = true;
    
    // Initialize game objects based on level
    initLevel(gameState.level);
}

// Initialize a level
function initLevel(level) {
    // Clear existing objects
    obstacles = [];
    coins = [];
    powerUps = [];
    
    // Set up background based on game mode
    setupBackground();
    
    // Set difficulty based on level
    const difficulty = Math.min(1 + (level * 0.1), 2);
    gameState.energyDecay = 0.1 * difficulty;
    
    // Create initial objects
    spawnInitialObjects();
}

// Set up the background
function setupBackground() {
    backgrounds = [];
    let bgImage;
    
    switch (gameState.gameMode) {
        case "track":
            bgImage = assets.backgrounds.track_background;
            break;
        case "store":
            bgImage = assets.backgrounds.store_background;
            break;
        default:
            bgImage = assets.backgrounds.menu_background;
    }
    
    // Create parallax layers if background is available
    if (bgImage) {
        backgrounds.push({
            image: bgImage,
            x: 0,
            y: 0,
            speed: 1
        });
        
        // For parallax effect, add a second copy
        backgrounds.push({
            image: bgImage,
            x: GAME_WIDTH,
            y: 0,
            speed: 1
        });
    }
}

// Spawn initial game objects
function spawnInitialObjects() {
    // Add some initial obstacles
    for (let i = 0; i < 3; i++) {
        spawnObstacle(GAME_WIDTH + (i * 200));
    }
    
    // Add some initial coins
    for (let i = 0; i < 5; i++) {
        spawnCoin(GAME_WIDTH + (i * 150) + Math.random() * 50);
    }
    
    // Add a power-up
    spawnPowerUp(GAME_WIDTH + 500);
}

// Spawn an obstacle
function spawnObstacle(x) {
    obstacles.push({
        x: x,
        y: GAME_HEIGHT - GROUND_HEIGHT - 20,
        width: 20,
        height: 20,
        type: Math.floor(Math.random() * 3) // Different types of obstacles
    });
}

// Spawn a coin
function spawnCoin(x) {
    coins.push({
        x: x,
        y: GAME_HEIGHT - GROUND_HEIGHT - 30 - Math.random() * 60,
        width: 16,
        height: 16,
        frame: 0,
        frameCount: 4,
        animationSpeed: 8,
        animationCounter: 0
    });
}

// Spawn a power-up
function spawnPowerUp(x) {
    powerUps.push({
        x: x,
        y: GAME_HEIGHT - GROUND_HEIGHT - 30 - Math.random() * 40,
        width: 20,
        height: 20,
        type: Math.floor(Math.random() * 2), // Different types of power-ups
        frame: 0,
        frameCount: 2,
        animationSpeed: 10,
        animationCounter: 0
    });
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle game states
    if (gameState.isLoading) {
        updateLoading(deltaTime);
        drawLoading();
    } else if (gameState.isPaused) {
        drawPauseScreen();
    } else if (gameState.isGameOver) {
        drawGameOverScreen();
    } else {
        update(deltaTime);
        draw();
    }
    
    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Update loading state
function updateLoading(deltaTime) {
    // Simulate loading progress if assets are slow
    if (gameState.loadingProgress < 100) {
        gameState.loadingProgress += 0.1;
        const loadingBar = document.querySelector('.loading-bar');
        loadingBar.style.width = Math.min(gameState.loadingProgress, 100) + '%';
    }
}

// Update game state
function update(deltaTime) {
    if (!gameState.isRunning) return;
    
    // Update game time
    gameState.runTime += deltaTime / 1000;
    
    // Update player
    updatePlayer(deltaTime);
    
    // Update game objects
    updateBackgrounds();
    updateObstacles();
    updateCoins();
    updatePowerUps();
    updateParticles();
    
    // Check collisions
    checkCollisions();
    
    // Update game stats
    updateGameStats(deltaTime);
    
    // Check for level progression
    checkLevelProgression();
    
    // Check game over conditions
    checkGameOver();
    
    // Spawn new objects
    manageObjectSpawning();
}

// Update player state
function updatePlayer(deltaTime) {
    // Handle player input
    handlePlayerInput();
    
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y > GAME_HEIGHT - GROUND_HEIGHT - player.height) {
        player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Edge boundaries
    if (player.x < 0) player.x = 0;
    if (player.x > GAME_WIDTH - player.width) player.x = GAME_WIDTH - player.width;
    
    // Update animation
    if (player.isRunning || player.velocityY !== 0) {
        player.animationCounter++;
        if (player.animationCounter >= player.animationSpeed) {
            player.frame = (player.frame + 1) % player.frameCount;
            player.animationCounter = 0;
        }
    } else {
        player.frame = 0; // Idle frame
    }
}

// Handle player input
function handlePlayerInput() {
    // Reset velocity
    player.velocityX = 0;
    player.isRunning = false;
    
    // Movement
    if (keys.ArrowLeft) {
        player.velocityX = -RUN_SPEED;
        player.direction = -1;
        player.isRunning = true;
    }
    
    if (keys.ArrowRight) {
        player.velocityX = RUN_SPEED;
        player.direction = 1;
        player.isRunning = true;
    }
    
    // Jump
    if (keys.ArrowUp && !player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
        if (assets.sounds.jump) {
            assets.sounds.jump.currentTime = 0;
            assets.sounds.jump.play().catch(e => console.error("Error playing sound:", e));
        }
    }
    
    // Duck/slide
    if (keys.ArrowDown) {
        // Implement ducking/sliding logic
    }
    
    // Action buttons
    if (keys.z) {
        // Action button 1 (e.g., sprint)
    }
    
    if (keys.x) {
        // Action button 2 (e.g., special move)
    }
    
    // Pause
    if (keys.Enter) {
        // Only trigger once per press
        if (!gameState.enterPressed) {
            togglePause();
            gameState.enterPressed = true;
        }
    } else {
        gameState.enterPressed = false;
    }
}

// Toggle pause state
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

// Update backgrounds (parallax scrolling)
function updateBackgrounds() {
    backgrounds.forEach(bg => {
        // Move background based on character movement for parallax effect
        bg.x -= bg.speed * (player.isRunning ? player.velocityX * 0.5 : 1);
        
        // If background moves off-screen, reset it
        if (bg.x <= -GAME_WIDTH) {
            bg.x = GAME_WIDTH - 1;
        }
        // If background moves too far right, reset it
        if (bg.x > GAME_WIDTH) {
            bg.x = -GAME_WIDTH + 1;
        }
    });
}

// Update obstacles
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move obstacle
        obstacle.x -= ENEMY_SPEED + (gameState.level * 0.2);
        
        // Remove if off-screen
        if (obstacle.x < -obstacle.width) {
            obstacles.splice(i, 1);
        }
    }
}

// Update coins
function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        // Move coin
        coin.x -= ENEMY_SPEED + (gameState.level * 0.2);
        
        // Animate coin
        coin.animationCounter++;
        if (coin.animationCounter >= coin.animationSpeed) {
            coin.frame = (coin.frame + 1) % coin.frameCount;
            coin.animationCounter = 0;
        }
        
        // Remove if off-screen
        if (coin.x < -coin.width) {
            coins.splice(i, 1);
        }
    }
}

// Update power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Move power-up
        powerUp.x -= ENEMY_SPEED + (gameState.level * 0.2);
        
        // Animate power-up
        powerUp.animationCounter++;
        if (powerUp.animationCounter >= powerUp.animationSpeed) {
            powerUp.frame = (powerUp.frame + 1) % powerUp.frameCount;
            powerUp.animationCounter = 0;
        }
        
        // Remove if off-screen
        if (powerUp.x < -powerUp.width) {
            powerUps.splice(i, 1);
        }
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update particle position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        
        // Update particle lifetime
        particle.life--;
        
        // Remove if lifetime is over
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Check collisions between player and game objects
function checkCollisions() {
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        if (checkCollision(player, obstacle)) {
            // Player hit an obstacle
            takeDamage(10);
            createParticles(obstacle.x, obstacle.y, 10, 'red');
            obstacles.splice(i, 1);
        }
    }
    
    // Check coin collisions
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        if (checkCollision(player, coin)) {
            // Player collected a coin
            gameState.coins += COIN_VALUE;
            gameState.score += COIN_VALUE;
            createParticles(coin.x, coin.y, 5, 'yellow');
            coins.splice(i, 1);
        }
    }
    
    // Check power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        if (checkCollision(player, powerUp)) {
            // Player collected a power-up
            applyPowerUp(powerUp.type);
            createParticles(powerUp.x, powerUp.y, 8, 'blue');
            powerUps.splice(i, 1);
        }
    }
}

// Check if two objects are colliding
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Apply damage to the player
function takeDamage(amount) {
    gameState.energy -= amount;
    if (gameState.energy < 0) gameState.energy = 0;
}

// Apply power-up effect
function applyPowerUp(type) {
    switch (type) {
        case 0: // Energy boost
            gameState.energy = Math.min(gameState.energy + 30, gameState.maxEnergy);
            break;
        case 1: // Speed boost
            // Implement temporary speed boost
            break;
    }
}

// Create particles at a position
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: (Math.random() - 0.5) * 4,
            size: Math.random() * 5 + 1,
            color: color,
            life: Math.random() * 30 + 10
        });
    }
}

// Update game statistics
function updateGameStats(deltaTime) {
    // Update distance
    gameState.distance += Math.max(player.velocityX, 0) * (deltaTime / 1000);
    
    // Update score based on distance
    gameState.score = Math.floor(gameState.distance) + gameState.coins;
    
    // Decrease energy over time
    gameState.energy -= gameState.energyDecay * (deltaTime / 1000);
    
    // Cap energy at max
    if (gameState.energy > gameState.maxEnergy) {
        gameState.energy = gameState.maxEnergy;
    }
}

// Check for level progression
function checkLevelProgression() {
    // Calculate new level based on distance
    const newLevel = Math.floor(gameState.distance / 1000) + 1;
    
    // If level has increased
    if (newLevel > gameState.level) {
        levelUp(newLevel);
    }
    
    // Check for character age progression
    checkAgeProgression();
}

// Level up the player
function levelUp(newLevel) {
    gameState.level = newLevel;
    
    // Increase max energy
    gameState.maxEnergy += 10;
    
    // Restore some energy
    gameState.energy = Math.min(gameState.energy + 20, gameState.maxEnergy);
    
    // Spawn a power-up to celebrate
    spawnPowerUp(GAME_WIDTH + 100);
}

// Check for character age progression
function checkAgeProgression() {
    if (gameState.level >= 10 && gameState.characterAge === "child") {
        gameState.characterAge = "teen";
        // Add visual/audio feedback for growth
    } else if (gameState.level >= 20 && gameState.characterAge === "teen") {
        gameState.characterAge = "adult";
        // Add visual/audio feedback for growth
    }
}

// Check game over conditions
function checkGameOver() {
    if (gameState.energy <= 0) {
        gameOver();
    }
}

// End the game
function gameOver() {
    gameState.isGameOver = true;
    gameState.isRunning = false;
}

// Manage spawning of new game objects
function manageObjectSpawning() {
    // Spawn obstacles at random intervals
    if (obstacles.length < 5 && Math.random() < 0.02) {
        spawnObstacle(GAME_WIDTH + Math.random() * 100);
    }
    
    // Spawn coins at random intervals
    if (coins.length < 10 && Math.random() < 0.03) {
        spawnCoin(GAME_WIDTH + Math.random() * 100);
    }
    
    // Spawn power-ups rarely
    if (powerUps.length < 2 && Math.random() < 0.005) {
        spawnPowerUp(GAME_WIDTH + Math.random() * 200);
    }
}

// Draw the game
function draw() {
    // Draw backgrounds
    drawBackgrounds();
    
    // Draw ground
    drawGround();
    
    // Draw game objects
    drawObstacles();
    drawCoins();
    drawPowerUps();
    drawParticles();
    
    // Draw player
    drawPlayer();
    
    // Draw UI elements
    drawUI();
}

// Draw loading screen
function drawLoading() {
    // The loading screen is handled by HTML/CSS but we could draw additional elements here
}

// Draw backgrounds
function drawBackgrounds() {
    backgrounds.forEach(bg => {
        if (bg.image) {
            ctx.drawImage(bg.image, bg.x, bg.y, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Fallback background if image isn't loaded
            ctx.fillStyle = "#000033";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    });
}

// Draw the ground
function drawGround() {
    ctx.fillStyle = "#663300";
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    
    // Draw ground details
    ctx.fillStyle = "#442200";
    for (let i = 0; i < GAME_WIDTH; i += 20) {
        ctx.fillRect(i, GAME_HEIGHT - GROUND_HEIGHT, 10, 5);
    }
}

// Draw the player
function drawPlayer() {
    // Get the correct sprite based on character age
    let playerSprite;
    switch (gameState.characterAge) {
        case "teen":
            playerSprite = assets.sprites.runner_teen;
            break;
        case "adult":
            playerSprite = assets.sprites.runner_adult;
            break;
        default:
            playerSprite = assets.sprites.runner_child;
    }
    
    // If sprite is loaded, draw it
    if (playerSprite) {
        // Calculate the frame position in the sprite sheet
        const frameX = player.frame * player.width;
        
        // Draw the player with correct direction
        ctx.save();
        if (player.direction === -1) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                playerSprite,
                frameX, 0, player.width, player.height,
                0, 0, player.width, player.height
            );
        } else {
            ctx.drawImage(
                playerSprite,
                frameX, 0, player.width, player.height,
                player.x, player.y, player.width, player.height
            );
        }
        ctx.restore();
    } else {
        // Fallback if sprite isn't loaded
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (assets.sprites.obstacle) {
            ctx.drawImage(
                assets.sprites.obstacle,
                obstacle.type * obstacle.width, 0, obstacle.width, obstacle.height,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            );
        } else {
            // Fallback
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}

// Draw coins
function drawCoins() {
    coins.forEach(coin => {
        if (assets.sprites.coin) {
            const frameX = coin.frame * coin.width;
            ctx.drawImage(
                assets.sprites.coin,
                frameX, 0, coin.width, coin.height,
                coin.x, coin.y, coin.width, coin.height
            );
        } else {
            // Fallback
            ctx.fillStyle = "#ffff00";
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (assets.sprites.powerup) {
            const frameX = powerUp.frame * powerUp.width;
            const frameY = powerUp.type * powerUp.height;
            ctx.drawImage(
                assets.sprites.powerup,
                frameX, frameY, powerUp.width, powerUp.height,
                powerUp.x, powerUp.y, powerUp.width, powerUp.height
            );
        } else {
            // Fallback
            ctx.fillStyle = "#00ffff";
            ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    });
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw UI elements
function drawUI() {
    // Draw score
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${gameState.score}`, 10, 20);
    
    // Draw coins
    ctx.fillStyle = "#ffff00";
    ctx.fillText(`COINS: ${gameState.coins}`, 10, 40);
    
    // Draw level
    ctx.fillStyle = "#00ff00";
    ctx.fillText(`LEVEL: ${gameState.level}`, 10, 60);
    
    // Draw energy bar
    const energyWidth = 100;
    const energyHeight = 10;
    const energyX = GAME_WIDTH - energyWidth - 10;
    const energyY = 10;
    
    ctx.fillStyle = "#444444";
    ctx.fillRect(energyX, energyY, energyWidth, energyHeight);
    
    const energyPercent = gameState.energy / gameState.maxEnergy;
    let energyColor = "#00ff00";
    if (energyPercent < 0.3) energyColor = "#ff0000";
    else if (energyPercent < 0.6) energyColor = "#ffff00";
    
    ctx.fillStyle = energyColor;
    ctx.fillRect(energyX, energyY, energyWidth * energyPercent, energyHeight);
    
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(energyX, energyY, energyWidth, energyHeight);
    
    // Draw character age
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`AGE: ${gameState.characterAge.toUpperCase()}`, GAME_WIDTH - 120, 40);
}

// Draw pause screen
function drawPauseScreen() {
    // First draw the game in the background
    draw();
    
    // Then overlay the pause screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    
    ctx.font = "8px 'Press Start 2P'";
    ctx.fillText("PRESS ENTER TO RESUME", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
}

// Draw game over screen
function drawGameOverScreen() {
    // First draw the game in the background
    draw();
    
    // Then overlay the game over screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = "#ff0000";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px 'Press Start 2P'";
    ctx.fillText(`FINAL SCORE: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillText(`DISTANCE: ${Math.floor(gameState.distance)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    ctx.fillText(`LEVEL: ${gameState.level}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    
    ctx.font = "8px 'Press Start 2P'";
    ctx.fillText("PRESS ENTER TO RESTART", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
}

// Restart the game
function restartGame() {
    // Reset game state
    gameState = {
        isLoading: false,
        isGameOver: false,
        isPaused: false,
        isRunning: true,
        score: 0,
        coins: 0,
        distance: 0,
        energy: 100,
        maxEnergy: 100,
        energyDecay: 0.1,
        level: 1,
        runTime: 0,
        gameMode: "track",
        characterAge: "child",
        highScore: localStorage.getItem('highScore') || 0
    };
    
    // Reset player
    player.x = 50;
    player.y = GAME_HEIGHT - GROUND_HEIGHT - 30;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.isRunning = false;
    player.frame = 0;
    
    // Reset game objects
    obstacles = [];
    coins = [];
    powerUps = [];
    particles = [];
    
    // Start a new level
    initLevel(gameState.level);
}

// Initialize when the page is loaded
window.addEventListener('load', init); 