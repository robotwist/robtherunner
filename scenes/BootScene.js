import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // NES-style character animations
    this.loadCharacterSprites();
    
    // Background assets
    this.loadBackgrounds();
    
    // UI elements
    this.loadUIElements();
    
    // Audio in NES 8-bit style
    this.loadAudio();
    
    // Display loading screen
    this.createLoadingBar();
  }
  
  loadCharacterSprites() {
    // Character spritesheets
    this.load.spritesheet('runner_child', 
      'assets/sprites/animations/runner_child_spritesheet.png',
      { frameWidth: 48, frameHeight: 48 }
    );
    
    this.load.spritesheet('runner_teen', 
      'assets/sprites/animations/runner_teen_spritesheet.png',
      { frameWidth: 48, frameHeight: 56 }
    );
    
    this.load.spritesheet('runner_adult', 
      'assets/sprites/animations/runner_adult_spritesheet.png',
      { frameWidth: 48, frameHeight: 64 }
    );
    
    this.load.spritesheet('space_runner', 
      'assets/sprites/animations/space_runner_spritesheet.png',
      { frameWidth: 48, frameHeight: 64 }
    );
    
    this.load.spritesheet('alien', 
      'assets/sprites/animations/alien_spritesheet.png',
      { frameWidth: 48, frameHeight: 48 }
    );
  }
  
  loadBackgrounds() {
    // Background assets
    this.load.image('track_background', 'assets/sprites/backgrounds/track_background.png');
    this.load.image('store_background', 'assets/sprites/backgrounds/store_background.png');
    this.load.image('space_track', 'assets/sprites/backgrounds/space_track.png');
    this.load.image('menu_background', 'assets/sprites/backgrounds/menu_background.png');
  }
  
  loadUIElements() {
    // UI elements with NES aesthetic
    this.load.image('energy_bar', 'assets/sprites/ui/energy_bar.png');
    this.load.image('button', 'assets/sprites/ui/button.png');
    
    // Load custom bitmap font for NES-style text
    this.load.image('pixel_font', 'assets/sprites/ui/pixel_font.png');
    
    // Create NES-style 8-bit font (if we have no custom font)
    this.cache.bitmapFont = this.cache.bitmapFont || {};
    if (!this.cache.bitmapFont['pixel-font']) {
      // Create a simple fallback font if needed
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      
      // Draw simple pixel font (just for fallback)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:;\'"-+=/\\()';
      
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], i * 8, 20);
      }
      
      // Create texture from canvas
      this.textures.addCanvas('pixel-font-texture', canvas);
    }
  }
  
  loadAudio() {
    // 8-bit style NES audio
    this.load.audio('menu_music', 'assets/music/menu_theme.mp3');
    this.load.audio('race_music', 'assets/music/race_theme.mp3');
    this.load.audio('space_music', 'assets/music/space_theme.mp3');
    
    // Sound effects
    this.load.audio('level_up', 'assets/music/level_up.mp3');
    this.load.audio('victory', 'assets/music/victory.mp3');
    this.load.audio('defeat', 'assets/music/defeat.mp3');
  }
  
  createLoadingBar() {
    // NES-style loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Black background
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    
    // Title text
    this.add.text(width / 2, height / 3, 'ROB THE RUNNER', {
      font: '48px monospace',
      fill: '#FCFCFC', // NES white
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Loading bar container
    this.add.rectangle(width / 2, height / 2, width / 2 + 8, 48, 0xFCFCFC).setOrigin(0.5);
    const progressBg = this.add.rectangle(width / 2, height / 2, width / 2, 40, 0x000000).setOrigin(0.5);
    
    // Create segmented loading bar (NES style)
    const barWidth = width / 2 - 8;
    const segments = 10;
    const segmentWidth = barWidth / segments;
    const segmentGap = 2;
    const progressBar = this.add.graphics();
    
    // Loading text with blinking effect
    const loadingText = this.add.text(width / 2, height / 2 + 50, 'LOADING...', {
      font: '20px monospace',
      fill: '#FCFCFC'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: loadingText,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Register loading events
    this.load.on('progress', (value) => {
      progressBar.clear();
      
      // Draw filled segments based on loading progress
      const filledSegments = Math.floor(value * segments);
      
      for (let i = 0; i < filledSegments; i++) {
        const x = (width / 2) - (barWidth / 2) + (i * segmentWidth) + 4;
        progressBar.fillStyle(0x00B800, 1); // NES green
        progressBar.fillRect(x, height / 2 - 16, segmentWidth - segmentGap, 32);
      }
    });
    
    // Loading complete callback
    this.load.on('complete', () => {
      // Fill the entire bar
      progressBar.clear();
      for (let i = 0; i < segments; i++) {
        const x = (width / 2) - (barWidth / 2) + (i * segmentWidth) + 4;
        progressBar.fillStyle(0x00B800, 1);
        progressBar.fillRect(x, height / 2 - 16, segmentWidth - segmentGap, 32);
      }
      
      // Show ready message
      loadingText.setText('PRESS START');
      
      // Listen for space key to start
      this.input.keyboard.once('keydown-SPACE', () => {
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('MenuScene');
        });
      });
    });
  }

  create() {
    // Additional initialization if needed
    this.anims.create({
      key: 'loading',
      frames: [
        { key: 'pixel-font-texture', frame: 0 }
      ],
      frameRate: 8,
      repeat: -1
    });
  }
}

export default BootScene; 