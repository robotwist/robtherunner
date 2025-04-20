// Game variables
const GAME = {
  isLoading: true,
  loadingProgress: 0,
  isStarted: false,
  gameSpeed: 1,
  score: 0,
  energy: 100,
  age: 5,
  stage: "child", // child, teen, adult, senior
  lifeCycle: ["child", "teen", "adult", "senior"],
  keysPressed: {},
  canvasWidth: 256, // Classic NES resolution width
  canvasHeight: 240, // Classic NES resolution height
  pixelSize: 2,
  gameCanvas: null,
  gameContext: null,
  lastFrameTime: 0,
  sprites: {},
  sounds: {},
  frameCount: 0
};

// Preload assets
const ASSETS = {
  sprites: {
    // Player character sprites in different life stages
    runner_child: "assets/sprites/runner_child.png",
    runner_teen: "assets/sprites/runner_teen.png",
    runner_adult: "assets/sprites/runner_adult.png",
    runner_senior: "assets/sprites/runner_senior.png",
    
    // Background elements
    track_background: "assets/sprites/track_background.png",
    store_background: "assets/sprites/store_background.png",
    menu_background: "assets/sprites/menu_background.png",
    
    // Game objects
    energy_pickup: "assets/sprites/energy_pickup.png",
    obstacle: "assets/sprites/obstacle.png"
  },
  sounds: {
    title: "assets/sounds/title.mp3",
    running: "assets/sounds/running.mp3",
    pickup: "assets/sounds/pickup.mp3",
    level_up: "assets/sounds/level_up.mp3",
    game_over: "assets/sounds/game_over.mp3"
  }
};

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Initialize game
function init() {
  setupCanvas();
  bindControls();
  startLoading();
}

// Setup the game canvas
function setupCanvas() {
  // Create or get the canvas
  GAME.gameCanvas = document.createElement("canvas");
  GAME.gameCanvas.width = GAME.canvasWidth;
  GAME.gameCanvas.height = GAME.canvasHeight;
  GAME.gameCanvas.style.width = `${GAME.canvasWidth * GAME.pixelSize}px`;
  GAME.gameCanvas.style.height = `${GAME.canvasHeight * GAME.pixelSize}px`;
  GAME.gameContext = GAME.gameCanvas.getContext("2d");
  
  // Enable crisp pixel rendering
  GAME.gameContext.imageSmoothingEnabled = false;
  
  // Add canvas to game container
  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = ""; // Clear any existing content
  gameContainer.appendChild(GAME.gameCanvas);
}

// Simulate loading progress and preload assets
function startLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  
  // Make loading screen visible
  loadingScreen.style.display = "flex";
  
  // Total assets to load
  const totalAssets = Object.keys(ASSETS.sprites).length + Object.keys(ASSETS.sounds).length;
  let loadedAssets = 0;
  
  // Load sprites
  Object.entries(ASSETS.sprites).forEach(([key, src]) => {
    const img = new Image();
    img.onload = () => {
      GAME.sprites[key] = img;
      loadedAssets++;
      updateLoadingProgress(loadedAssets / totalAssets * 100);
    };
    img.onerror = () => {
      console.error(`Failed to load sprite: ${src}`);
      loadedAssets++;
      updateLoadingProgress(loadedAssets / totalAssets * 100);
    };
    img.src = src;
  });
  
  // Load sounds
  Object.entries(ASSETS.sounds).forEach(([key, src]) => {
    const sound = new Audio();
    sound.oncanplaythrough = () => {
      GAME.sounds[key] = sound;
      loadedAssets++;
      updateLoadingProgress(loadedAssets / totalAssets * 100);
    };
    sound.onerror = () => {
      console.error(`Failed to load sound: ${src}`);
      loadedAssets++;
      updateLoadingProgress(loadedAssets / totalAssets * 100);
    };
    sound.src = src;
  });
  
  // Simulate minimum loading time for effect
  let fakeTotalProgress = 0;
  const loadingInterval = setInterval(() => {
    fakeTotalProgress += Math.random() * 2;
    if (fakeTotalProgress >= 100) {
      fakeTotalProgress = 100;
      clearInterval(loadingInterval);
      
      // Small delay before showing title screen
      setTimeout(() => {
        loadingScreen.style.display = "none";
        startGame();
      }, 500);
    }
    updateLoadingProgress(fakeTotalProgress);
  }, 100);
}

// Update loading progress bar
function updateLoadingProgress(progress) {
  const loadingBar = document.getElementById("loading-bar");
  GAME.loadingProgress = progress;
  loadingBar.style.width = `${progress}%`;
}

// Bind keyboard controls
function bindControls() {
  // Track key presses
  document.addEventListener('keydown', (e) => {
    GAME.keysPressed[e.code] = true;
    
    // Start game on any key if not started
    if (!GAME.isStarted && !GAME.isLoading) {
      GAME.isStarted = true;
      playSound('title', true);
    }
    
    // Update visual key indicators
    updateKeyDisplay(e.code, true);
  });
  
  document.addEventListener('keyup', (e) => {
    GAME.keysPressed[e.code] = false;
    updateKeyDisplay(e.code, false);
  });
}

// Update the key display in the controller area
function updateKeyDisplay(code, isActive) {
  const keyElements = document.querySelectorAll('.key-press');
  
  keyElements.forEach(element => {
    if (element.dataset.key === code) {
      if (isActive) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    }
  });
}

// Start the game loop
function startGame() {
  GAME.isLoading = false;
  
  // Show title screen first
  renderTitleScreen();
  
  // Start game loop
  requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(timestamp) {
  // Calculate delta time for smooth animations
  const deltaTime = timestamp - GAME.lastFrameTime;
  GAME.lastFrameTime = timestamp;
  GAME.frameCount++;
  
  // Clear canvas
  GAME.gameContext.fillStyle = "#000000";
  GAME.gameContext.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
  
  if (GAME.isStarted) {
    update(deltaTime);
  } else {
    // Keep animating title screen
    renderTitleScreen();
  }
  
  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
  // Update game state based on life stage
  switch (GAME.stage) {
    case "child":
      updateChildStage(deltaTime);
      break;
    case "teen":
      updateTeenStage(deltaTime);
      break;
    case "adult":
      updateAdultStage(deltaTime);
      break;
    case "senior":
      updateSeniorStage(deltaTime);
      break;
  }
  
  // Update score
  GAME.score += 0.01 * GAME.gameSpeed;
  
  // Render current game state
  render();
}

// Child stage gameplay
function updateChildStage(deltaTime) {
  // Child-specific logic
  movePlayer();
  
  // Age up to teen after score threshold
  if (GAME.score > 100) {
    ageUp();
  }
}

// Teen stage gameplay
function updateTeenStage(deltaTime) {
  // Teen-specific logic
  movePlayer();
  
  // Age up to adult after score threshold
  if (GAME.score > 300) {
    ageUp();
  }
}

// Adult stage gameplay
function updateAdultStage(deltaTime) {
  // Adult-specific logic
  movePlayer();
  
  // Age up to senior after score threshold
  if (GAME.score > 600) {
    ageUp();
  }
}

// Senior stage gameplay
function updateSeniorStage(deltaTime) {
  // Senior-specific logic
  movePlayer();
  
  // Game over logic
  if (GAME.score > 1000 || GAME.energy <= 0) {
    gameOver();
  }
}

// Handle player movement based on key presses
function movePlayer() {
  // Movement logic will be implemented here
}

// Age up to next life stage
function ageUp() {
  const currentIndex = GAME.lifeCycle.indexOf(GAME.stage);
  if (currentIndex < GAME.lifeCycle.length - 1) {
    GAME.stage = GAME.lifeCycle[currentIndex + 1];
    GAME.age += 10; // Advance age
    
    // Play level up sound
    playSound('level_up');
    
    // Add screen flash effect
    const gameContainer = document.getElementById("game-container");
    gameContainer.classList.add('screen-flash');
    setTimeout(() => {
      gameContainer.classList.remove('screen-flash');
    }, 200);
  }
}

// Render the game
function render() {
  // Get the right sprite for the current life stage
  const playerSprite = GAME.sprites[`runner_${GAME.stage}`];
  
  // Background
  const background = GAME.sprites.track_background;
  if (background) {
    GAME.gameContext.drawImage(background, 0, 0, GAME.canvasWidth, GAME.canvasHeight);
  }
  
  // Draw player
  if (playerSprite) {
    // Player position calculation would go here
    const playerX = 50;
    const playerY = 150;
    GAME.gameContext.drawImage(playerSprite, playerX, playerY);
  }
  
  // Draw UI
  drawUI();
}

// Draw game UI
function drawUI() {
  // Set text properties
  GAME.gameContext.font = '8px "PressStart2P"';
  GAME.gameContext.fillStyle = "#FFFFFF";
  
  // Draw score
  GAME.gameContext.fillText(`SCORE: ${Math.floor(GAME.score)}`, 10, 20);
  
  // Draw age
  GAME.gameContext.fillText(`AGE: ${GAME.age}`, 10, 35);
  
  // Draw energy bar
  GAME.gameContext.fillText("ENERGY:", 10, 50);
  GAME.gameContext.fillStyle = "#000000";
  GAME.gameContext.fillRect(70, 42, 100, 10);
  GAME.gameContext.fillStyle = "#00B800";
  GAME.gameContext.fillRect(70, 42, GAME.energy, 10);
}

// Render title screen
function renderTitleScreen() {
  // Draw title background
  const background = GAME.sprites.menu_background;
  if (background) {
    GAME.gameContext.drawImage(background, 0, 0, GAME.canvasWidth, GAME.canvasHeight);
  }
  
  // Set text properties
  GAME.gameContext.font = '16px "PressStart2P"';
  GAME.gameContext.fillStyle = "#FCFC54";
  GAME.gameContext.textAlign = "center";
  
  // Title
  GAME.gameContext.fillText("ROB THE RUNNER", GAME.canvasWidth / 2, 70);
  
  // Subtitle
  GAME.gameContext.font = '8px "PressStart2P"';
  GAME.gameContext.fillStyle = "#FFFFFF";
  GAME.gameContext.fillText("A LIFE SIMULATOR", GAME.canvasWidth / 2, 90);
  
  // Flashing "PRESS ANY KEY" text
  if (GAME.frameCount % 60 < 30) {
    GAME.gameContext.fillText("PRESS ANY KEY", GAME.canvasWidth / 2, 140);
  }
  
  // Reset text alignment
  GAME.gameContext.textAlign = "left";
}

// Game over screen
function gameOver() {
  GAME.isStarted = false;
  
  // Play game over sound
  playSound('game_over');
  
  // Clear canvas
  GAME.gameContext.fillStyle = "#000000";
  GAME.gameContext.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
  
  // Set text properties
  GAME.gameContext.font = '16px "PressStart2P"';
  GAME.gameContext.fillStyle = "#FC0000";
  GAME.gameContext.textAlign = "center";
  
  // Game over text
  GAME.gameContext.fillText("GAME OVER", GAME.canvasWidth / 2, 70);
  
  // Score
  GAME.gameContext.font = '8px "PressStart2P"';
  GAME.gameContext.fillStyle = "#FFFFFF";
  GAME.gameContext.fillText(`FINAL SCORE: ${Math.floor(GAME.score)}`, GAME.canvasWidth / 2, 100);
  GAME.gameContext.fillText(`FINAL AGE: ${GAME.age}`, GAME.canvasWidth / 2, 120);
  
  // Restart prompt
  if (GAME.frameCount % 60 < 30) {
    GAME.gameContext.fillText("PRESS ANY KEY TO RESTART", GAME.canvasWidth / 2, 160);
  }
  
  // Reset game on key press
  document.addEventListener('keydown', restartGame, { once: true });
}

// Restart the game
function restartGame() {
  GAME.score = 0;
  GAME.energy = 100;
  GAME.age = 5;
  GAME.stage = "child";
  GAME.gameSpeed = 1;
  GAME.isStarted = true;
}

// Play a sound with optional looping
function playSound(soundKey, loop = false) {
  const sound = GAME.sounds[soundKey];
  if (sound) {
    sound.loop = loop;
    sound.currentTime = 0;
    sound.play().catch(err => console.error('Error playing sound:', err));
  }
} 