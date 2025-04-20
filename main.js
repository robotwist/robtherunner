// Rob The Runner - Cradle to Grave Running Simulator

import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import Cutscene1 from './scenes/Cutscene1';
import TrackScene from './scenes/TrackScene';
import SpaceRaceScene from './scenes/SpaceRaceScene';

// Import CSS
import './styles/main.css';

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1d1d1d',
  parent: 'game-container',
  pixelArt: true,  // For crisp pixel rendering
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    Cutscene1,
    TrackScene,
    SpaceRaceScene
  ]
};

// Create loading screen
const loadingScreen = document.createElement('div');
loadingScreen.id = 'loading';
loadingScreen.innerHTML = `
  <h1>ROB THE RUNNER</h1>
  <div id="loading-bar-container">
    <div id="loading-bar"></div>
  </div>
  <p>Loading game assets...</p>
`;
document.body.appendChild(loadingScreen);

// Create game container
const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
document.body.appendChild(gameContainer);

// Add title/credits
const gameTitle = document.createElement('div');
gameTitle.id = 'game-title';
gameTitle.innerHTML = 'Rob The Runner - A Cradle-to-Grave Running Simulator';
document.body.appendChild(gameTitle);

// Initialize the game when window loads
window.onload = () => {
  // Simulate loading progress
  let progress = 0;
  const loadingBar = document.getElementById('loading-bar');
  
  const loadingInterval = setInterval(() => {
    progress += 5;
    loadingBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(loadingInterval);
      
      // Remove loading screen after a short delay
      setTimeout(() => {
        document.body.removeChild(loadingScreen);
        
        // Initialize game
        const game = new Phaser.Game(config);
        
        // Make game instance globally accessible for debugging
        window.game = game;
      }, 500);
    }
  }, 100);
};

// Handle browser resize to maintain aspect ratio
window.addEventListener('resize', () => {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  const aspectRatio = 800 / 600;
  let newWidth = window.innerWidth;
  let newHeight = window.innerHeight;
  
  // Maintain aspect ratio
  if (window.innerWidth / window.innerHeight > aspectRatio) {
    newWidth = window.innerHeight * aspectRatio;
  } else {
    newHeight = window.innerWidth / aspectRatio;
  }
  
  // Apply size (with some margin)
  canvas.style.width = `${newWidth * 0.9}px`;
  canvas.style.height = `${newHeight * 0.9}px`;
});

// Allow keyboard controls without clicking game first
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyB'].includes(e.code)) {
    e.preventDefault();
  }
});
