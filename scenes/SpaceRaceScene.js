import Phaser from 'phaser';

class SpaceRaceScene extends Phaser.Scene {
  constructor() {
    super('SpaceRaceScene');
    
    // Player stats - will be loaded from previous scene in full game
    this.stats = {
      speed: 10,
      endurance: 5,
      technique: 5,
      alienRaces: 0,
      galaxiesSaved: 0
    };
    
    // Game state
    this.lastKeyPressed = null;
    this.keyPressCount = 0;
    this.runningSpeed = 0;
    this.raceComplete = false;
    this.opponentSpeed = 0;
    this.playerPosition = 0;
    this.opponentPosition = 0;
    this.raceLength = 1000;
    this.currentAlien = 'Zorblaxian';
    this.aKeyDown = false;
    this.bKeyDown = false;
    this.keyPressTimer = 0;
    this.keyPressTimerMax = 300; // Time window to press alternating keys (ms)
  }

  preload() {
    // Load animation metadata
    this.load.json('space_runner_anim', 'assets/sprites/animations/space_runner.json');
    this.load.json('alien_anim', 'assets/sprites/animations/alien.json');
  }

  create() {
    // Outer space background (NES style with limited colors)
    this.add.rectangle(0, 0, 800, 600, 0x000033).setOrigin(0);
    
    // Stars
    this.createStarfield();
    
    // Cosmic track
    this.drawTrack();
    
    // Set up character animations
    this.setupCharacterSprites();
    
    // UI Elements
    this.setupUI();
    
    // Start with cutscene if first time
    if (this.stats.alienRaces === 0) {
      this.showAlienCutscene();
    } else {
      this.setupRace();
    }
    
    // Input events
    this.setupInput();
    
    // Play space music if available
    if (this.sound.get('space_music')) {
      this.sound.play('space_music', {
        loop: true,
        volume: 0.5
      });
    }
  }
  
  setupCharacterSprites() {
    // Player character - cosmic runner
    this.player = this.add.sprite(100, 400, 'space_runner')
      .setScale(2);
      
    // Opponent character - alien
    this.opponent = this.add.sprite(100, 300, 'alien')
      .setScale(2);
      
    // Setup animations
    const playerAnimData = this.cache.json.get('space_runner_anim');
    const alienAnimData = this.cache.json.get('alien_anim');
    
    if (playerAnimData) {
      // Create running animation
      this.anims.create({
        key: 'space_runner_run',
        frames: this.anims.generateFrameNumbers('space_runner', {
          start: 0,
          end: playerAnimData.frames - 1
        }),
        frameRate: playerAnimData.frameRate,
        repeat: -1
      });
      
      // Create idle animation (first frame)
      this.anims.create({
        key: 'space_runner_idle',
        frames: [ { key: 'space_runner', frame: 0 } ],
        frameRate: 1
      });
      
      // Start with idle animation
      this.player.play('space_runner_idle');
    }
    
    if (alienAnimData) {
      // Create alien animation
      this.anims.create({
        key: 'alien_float',
        frames: this.anims.generateFrameNumbers('alien', {
          start: 0,
          end: alienAnimData.frames - 1
        }),
        frameRate: alienAnimData.frameRate,
        repeat: -1
      });
      
      // Start with alien floating animation
      this.opponent.play('alien_float');
    }
  }
  
  createStarfield() {
    // Add NES-style stars (limited color palette)
    this.stars = [];
    
    // Use only white color for stars in NES style
    const starColor = 0xFCFCFC; // NES white
    
    for (let i = 0; i < 100; i++) {
      // Create stars with different sizes (1-3 pixels)
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(1, 3);
      
      const star = this.add.rectangle(x, y, size, size, starColor);
      this.stars.push(star);
      
      // Add twinkling effect for some stars
      if (Math.random() > 0.7) {
        this.tweens.add({
          targets: star,
          alpha: 0.3,
          duration: 1000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1
        });
      }
    }
    
    // Add a few "nebulas" - simple colored shapes for NES style
    const nebulaColors = [0x8800FF, 0x0078F8, 0xF83800];
    
    for (let i = 0; i < 3; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(50, 100);
      const color = nebulaColors[i % nebulaColors.length];
      
      const nebula = this.add.circle(x, y, size, color, 0.1);
      
      // Simple pulsing effect
      this.tweens.add({
        targets: nebula,
        alpha: 0.2,
        duration: 3000,
        yoyo: true,
        repeat: -1
      });
    }
  }
  
  drawTrack() {
    // Draw a cosmic track with NES aesthetic
    const graphics = this.add.graphics();
    
    // Track base - with limited NES colors
    graphics.fillStyle(0x0078F8, 0.3); // NES blue
    graphics.fillRect(50, 250, 700, 200);
    
    // Track lanes with cosmic energy
    graphics.fillStyle(0x00B800, 0.5); // NES green
    graphics.fillRect(50, 320, 700, 5);
    
    graphics.fillStyle(0xF83800, 0.5); // NES red
    graphics.fillRect(50, 380, 700, 5);
    
    // Start/finish indicators
    graphics.fillStyle(0xFCFCFC, 1); // NES white
    graphics.fillRect(100, 250, 5, 200);
    
    // Finish line with NES-style checkered pattern
    for (let y = 250; y < 450; y += 10) {
      for (let i = 0; i < 20; i++) {
        const offset = (i % 2) === 0 ? 0 : 5;
        const yPos = y + offset;
        
        if (yPos < 450) {
          graphics.fillStyle(0xFCFCFC); // NES white
          graphics.fillRect(750, yPos, 5, 5);
        }
      }
    }
  }
  
  setupUI() {
    // Race progress bar - NES style
    this.add.text(50, 30, 'COSMIC RACE', {
      font: '16px monospace',
      fill: '#FCFCFC' // NES white
    });
    
    // Progress track
    this.progressBarBg = this.add.rectangle(400, 60, 600, 30, 0x333333);
    
    // Player progress indicator
    this.playerProgress = this.add.rectangle(100, 60, 20, 30, 0x00B800) // NES green
      .setStrokeStyle(1, 0xFCFCFC) // NES white border
      .setOrigin(0.5);
    
    // Opponent progress indicator
    this.opponentProgress = this.add.rectangle(100, 60, 20, 30, 0xF83800) // NES red
      .setStrokeStyle(1, 0xFCFCFC) // NES white border
      .setOrigin(0.5);
    
    // Finish line indicator
    this.add.rectangle(700, 60, 5, 40, 0xFCFCFC);
    
    // Speed meter - NES style segments
    this.add.text(50, 100, 'COSMIC SPEED', {
      font: '16px monospace',
      fill: '#FCFCFC'
    });
    
    this.speedBarBg = this.add.rectangle(400, 130, 600, 20, 0x333333);
    
    // Create segmented NES-style speed bar (10 segments)
    this.speedSegments = [];
    const segmentWidth = 58;
    const segmentGap = 2;
    const segmentCount = 10;
    
    for (let i = 0; i < segmentCount; i++) {
      const x = 100 + (i * (segmentWidth + segmentGap));
      // Color gradient: first 3 red, next 4 yellow, last 3 green
      const color = i < 3 ? 0xF83800 : (i < 7 ? 0xFCFC00 : 0x00B800);
      const segment = this.add.rectangle(x, 130, segmentWidth, 20, color).setOrigin(0, 0.5);
      segment.visible = false;
      this.speedSegments.push(segment);
    }
    
    // Key press indicators - just like in Track & Field
    this.aKeyIndicator = this.add.rectangle(50, 170, 40, 40, 0x333333)
      .setStrokeStyle(2, 0xFCFCFC);
    this.bKeyIndicator = this.add.rectangle(100, 170, 40, 40, 0x333333)
      .setStrokeStyle(2, 0xFCFCFC);
      
    this.add.text(50, 170, 'A', {
      font: '24px monospace',
      fill: '#FCFCFC'
    }).setOrigin(0.5);
    
    this.add.text(100, 170, 'B', {
      font: '24px monospace',
      fill: '#FCFCFC'
    }).setOrigin(0.5);
    
    // Alien info
    this.alienInfo = this.add.text(600, 500, `ALIEN: ${this.currentAlien}`, {
      font: '18px monospace',
      fill: '#FCFCFC'
    });
    
    // Status text
    this.statusText = this.add.text(400, 220, 'PREPARE TO RACE!', {
      font: '24px monospace',
      fill: '#FCFCFC'
    }).setOrigin(0.5);
    
    // Race stats
    this.raceStatsText = this.add.text(50, 500, 
      `ALIEN RACES: ${this.stats.alienRaces}\nGALAXIES SAVED: ${this.stats.galaxiesSaved}`, {
      font: '18px monospace',
      fill: '#FCFCFC'
    });
  }
  
  setupInput() {
    // A/B alternating keys for running - classic Track & Field style
    this.input.keyboard.on('keydown-A', () => {
      if (!this.aKeyDown) {
        this.aKeyDown = true;
        this.aKeyIndicator.fillColor = 0xF83800; // NES red
        this.handleRunningKeyDown('A');
      }
    });
    
    this.input.keyboard.on('keyup-A', () => {
      this.aKeyDown = false;
      this.aKeyIndicator.fillColor = 0x333333;
    });
    
    this.input.keyboard.on('keydown-B', () => {
      if (!this.bKeyDown) {
        this.bKeyDown = true;
        this.bKeyIndicator.fillColor = 0xF83800; // NES red
        this.handleRunningKeyDown('B');
      }
    });
    
    this.input.keyboard.on('keyup-B', () => {
      this.bKeyDown = false;
      this.bKeyIndicator.fillColor = 0x333333;
    });
    
    // Space to start race
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.raceStarted) {
        this.startRace();
      }
    });
  }
  
  showAlienCutscene() {
    // Dim the background - NES style overlay
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7).setOrigin(0);
    
    // NES-style alien dialogue
    const alienMessages = [
      "HUMAN. WE HAVE BEEN WATCHING YOUR PROGRESS.",
      "YOUR SPEED IS... IMPRESSIVE FOR YOUR SPECIES.",
      "I AM ZORBLAX, AMBASSADOR OF THE COSMIC FEDERATION.",
      "OUR GALAXY FACES A CRISIS. CONFLICTS BETWEEN CIVILIZATIONS THREATEN ALL.",
      "BY ANCIENT LAW, DISPUTES MUST BE SETTLED BY CHAMPIONS IN THE COSMIC RACE.",
      "YOU HAVE BEEN CHOSEN TO REPRESENT EARTH.",
      "WIN, AND YOUR PLANET EARNS PROTECTION IN OUR FEDERATION.",
      "LOSE... AND YOUR FATE IS UNCERTAIN.",
      "ARE YOU PREPARED TO RACE FOR THE FUTURE OF YOUR WORLD?"
    ];
    
    let currentLine = 0;
    
    // NES-style text box with border
    const textBox = this.add.rectangle(400, 300, 600, 150, 0x0078F8, 0.8) // NES blue
      .setStrokeStyle(4, 0xFCFCFC); // NES white
    
    // Alien portrait - static image
    const alienPortrait = this.add.sprite(170, 220, 'alien').setScale(3);
    alienPortrait.play('alien_float');
    
    // Text with NES-style typewriter effect
    const alienText = this.add.text(400, 300, '', {
      font: '24px monospace',
      fill: '#FCFCFC',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    
    // Continue prompt with blinking effect
    const continueText = this.add.text(400, 400, 'PRESS SPACE', {
      font: '16px monospace',
      fill: '#FCFCFC'
    }).setOrigin(0.5);
    
    // NES-style text blinking
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 500, // Faster blink for NES style
      yoyo: true,
      repeat: -1
    });
    
    // Typewriter effect function (NES style)
    const typeText = (text) => {
      let index = 0;
      alienText.setText('');
      
      const timer = this.time.addEvent({
        delay: 50, // Classic NES text speed
        callback: () => {
          if (index < text.length) {
            alienText.setText(alienText.text + text[index]);
            index++;
            
            // Classic typewriter sound would go here
            // if (this.sound.get('text_blip')) {
            //   this.sound.play('text_blip', { volume: 0.3 });
            // }
          } else {
            timer.destroy();
          }
        },
        repeat: text.length - 1
      });
      
      return timer;
    };
    
    // Start with first message
    let textTimer = typeText(alienMessages[currentLine]);
    
    const advanceDialog = () => {
      // If text is still typing, complete it immediately
      if (textTimer && textTimer.getOverallProgress() < 1) {
        textTimer.destroy();
        alienText.setText(alienMessages[currentLine]);
        return;
      }
      
      currentLine++;
      if (currentLine < alienMessages.length) {
        alienText.setText('');
        textTimer = typeText(alienMessages[currentLine]);
      } else {
        // Flash effect when dialogue ends (NES style)
        this.cameras.main.flash(300, 255, 255, 255);
        
        // End cutscene
        this.time.delayedCall(300, () => {
          overlay.destroy();
          textBox.destroy();
          alienText.destroy();
          continueText.destroy();
          alienPortrait.destroy();
          this.setupRace();
        });
      }
    };
    
    // Handle space key to advance text
    const spaceHandler = this.input.keyboard.on('keydown-SPACE', advanceDialog);
    
    // Cleanup function for when cutscene ends
    this.events.once('shutdown', () => {
      if (spaceHandler) spaceHandler.remove();
    });
  }
  
  setupRace() {
    this.raceStarted = false;
    this.raceComplete = false;
    this.playerPosition = 0;
    this.opponentPosition = 0;
    this.runningSpeed = 0;
    this.opponentSpeed = 0;
    
    // Update positions on screen
    this.player.x = 100;
    this.opponent.x = 100;
    this.playerProgress.x = 100;
    this.opponentProgress.x = 100;
    
    // Reset player animation
    this.player.play('space_runner_idle');
    
    // Reset key states
    this.lastKeyPressed = null;
    this.keyPressTimer = 0;
    
    // Select opponent based on progress - NES style difficulty curve
    const aliens = [
      { name: 'ZORBLAXIAN', difficulty: 1 },
      { name: 'QUANTUM RUNNER', difficulty: 1.2 },
      { name: 'WARP STRIDER', difficulty: 1.5 },
      { name: 'VOID DASHER', difficulty: 1.8 },
      { name: 'COSMIC SPRINTER', difficulty: 2.2 }
    ];
    
    const alienIndex = Math.min(this.stats.alienRaces, aliens.length - 1);
    this.currentAlien = aliens[alienIndex].name;
    this.alienDifficulty = aliens[alienIndex].difficulty;
    this.alienInfo.setText(`ALIEN: ${this.currentAlien}`);
    
    // NES style "GET READY" then "GO!" messages
    this.statusText.setText('GET READY!');
    
    this.time.delayedCall(1500, () => {
      if (!this.raceComplete) {
        this.statusText.setText('PRESS SPACE TO START!');
      }
    });
  }
  
  startRace() {
    // Classic countdown
    this.statusText.setText('3');
    
    this.time.delayedCall(600, () => {
      this.statusText.setText('2');
      
      this.time.delayedCall(600, () => {
        this.statusText.setText('1');
        
        this.time.delayedCall(600, () => {
          // Flash effect for GO!
          this.cameras.main.flash(100, 255, 255, 255);
          this.statusText.setText('GO!');
          
          this.raceStarted = true;
          
          // Start player animation
          this.player.play('space_runner_run');
          
          // Start opponent AI
          this.opponentEvent = this.time.addEvent({
            delay: 100,
            callback: this.updateOpponent,
            callbackScope: this,
            loop: true
          });
          
          // Change status text after a delay
          this.time.delayedCall(1000, () => {
            this.statusText.setText('ALTERNATE A & B RAPIDLY!');
          });
        });
      });
    });
  }
  
  handleRunningKeyDown(key) {
    if (!this.raceStarted || this.raceComplete) {
      return;
    }
    
    // NES Track & Field style input handling
    if (this.lastKeyPressed === key) {
      // Penalty for pressing same key twice
      this.runningSpeed = Math.max(0, this.runningSpeed - 15);
      this.statusText.setText('ALTERNATE KEYS!');
    } else {
      // Check if within timing window - NES style timing bonus
      const goodTiming = this.keyPressTimer < this.keyPressTimerMax && this.keyPressTimer > 0;
      
      // Calculate speed gain like NES Track & Field
      let speedGain = 0;
      if (goodTiming) {
        const timingBonus = 1 - (this.keyPressTimer / this.keyPressTimerMax);
        speedGain = 10 + Math.floor(timingBonus * 15); // More responsive than earthly running
        speedGain *= (1 + (this.stats.technique * 0.1)); // Technique affects performance
      } else {
        speedGain = 5; // Basic gain for alternating but with poor timing
      }
      
      this.runningSpeed = Math.min(100, this.runningSpeed + speedGain);
      this.lastKeyPressed = key;
      this.keyPressTimer = 0; // Reset timer for next key press
      
      // Update status based on speed - NES style feedback
      if (this.runningSpeed > 80) {
        this.statusText.setText('COSMIC SPEED!');
      } else if (this.runningSpeed > 50) {
        this.statusText.setText('GOOD PACE!');
      } else {
        this.statusText.setText('FASTER!');
      }
    }
    
    // Update speed bar
    this.updateSpeedBar();
    
    // Update player position
    this.updatePlayerPosition();
  }
  
  updateSpeedBar() {
    // Update NES-style segmented speed bar
    const segmentsToShow = Math.floor(this.runningSpeed / 10);
    
    this.speedSegments.forEach((segment, index) => {
      segment.visible = index < segmentsToShow;
    });
  }
  
  updatePlayerPosition() {
    // Move player based on speed and stats - NES style physics
    const moveAmount = (this.runningSpeed / 100) * (1 + (this.stats.speed * 0.1));
    this.playerPosition += moveAmount;
    
    // Update animation speed based on running speed
    this.player.anims.timeScale = this.runningSpeed / 50; // 0-2x speed scale
    
    // Update visual position (constrained to track width)
    const maxVisualX = 700;
    const visualX = Phaser.Math.Linear(100, maxVisualX, this.playerPosition / this.raceLength);
    this.player.x = Math.min(maxVisualX, visualX);
    
    // Update progress indicator
    const progressX = Phaser.Math.Linear(100, 700, this.playerPosition / this.raceLength);
    this.playerProgress.x = progressX;
    
    // Check if race complete
    if (this.playerPosition >= this.raceLength && !this.raceComplete) {
      this.finishRace(true);
    }
  }
  
  updateOpponent() {
    if (!this.raceStarted || this.raceComplete) {
      return;
    }
    
    // NES-style AI with varied patterns
    const patternValue = Math.sin(this.time.now / 1000) * 0.5 + 0.5; // 0-1 oscillating value
    
    // Base and burst speeds
    const baseSpeed = 0.3 + (patternValue * 0.4);
    const alienSpeed = baseSpeed * this.alienDifficulty;
    
    // Random bursts of speed (NES games often had "rubber-banding" AI)
    if (Math.random() < 0.05) {
      this.opponentSpeed = Math.min(100, this.opponentSpeed + 10);
    }
    
    // Adjust speed based on player position (catch-up if too far behind)
    const positionDiff = this.playerPosition - this.opponentPosition;
    let catchUpBonus = 0;
    
    if (positionDiff > 300) {
      catchUpBonus = 0.4; // Big boost when far behind (rubber-banding)
    } else if (positionDiff > 150) {
      catchUpBonus = 0.2; // Small boost when somewhat behind
    }
    
    // Adjust rubber-banding based on difficulty (harder aliens rubber-band less)
    catchUpBonus *= (1 / this.alienDifficulty);
    
    // Linear interpolation for smooth speed changes
    this.opponentSpeed = Phaser.Math.Linear(
      this.opponentSpeed,
      alienSpeed * 100 + (catchUpBonus * 50),
      0.1
    );
    
    // Move opponent based on their speed
    const moveAmount = (this.opponentSpeed / 100) * 1.5;
    this.opponentPosition += moveAmount;
    
    // Update opponent animation speed
    this.opponent.anims.timeScale = this.opponentSpeed / 50;
    
    // Update visual position (constrained to track width)
    const maxVisualX = 700;
    const visualX = Phaser.Math.Linear(100, maxVisualX, this.opponentPosition / this.raceLength);
    this.opponent.x = Math.min(maxVisualX, visualX);
    
    // Update progress indicator
    const progressX = Phaser.Math.Linear(100, 700, this.opponentPosition / this.raceLength);
    this.opponentProgress.x = progressX;
    
    // Check if opponent finished
    if (this.opponentPosition >= this.raceLength && !this.raceComplete) {
      this.finishRace(false);
    }
  }
  
  finishRace(playerWon) {
    this.raceComplete = true;
    
    // Stop the race timer
    if (this.opponentEvent) this.opponentEvent.remove();
    
    // Stop animations with proper frames
    this.player.anims.stop();
    this.opponent.anims.stop();
    
    // NES style win/lose feedback
    if (playerWon) {
      // Player victory!
      this.stats.alienRaces++;
      
      // Flash effect and victory sound
      this.cameras.main.flash(500, 255, 255, 255);
      if (this.sound.get('victory')) {
        this.sound.play('victory');
      }
      
      this.statusText.setText('VICTORY!');
      
      // Every 5 races, save a galaxy
      if (this.stats.alienRaces % 5 === 0) {
        this.stats.galaxiesSaved++;
        
        // Big fanfare for galaxy saved
        this.time.delayedCall(2000, () => {
          // Extra flash effect
          this.cameras.main.flash(300, 255, 255, 255);
          this.statusText.setText('GALAXY SAVED!');
          
          // Cosmic fireworks effect
          this.showCosmicFireworks();
        });
      }
    } else {
      // Player defeated
      this.statusText.setText('DEFEATED!');
      
      // Red flash and defeat sound
      this.cameras.main.flash(500, 255, 0, 0);
      if (this.sound.get('defeat')) {
        this.sound.play('defeat');
      }
    }
    
    // Update stats display
    this.raceStatsText.setText(
      `ALIEN RACES: ${this.stats.alienRaces}\nGALAXIES SAVED: ${this.stats.galaxiesSaved}`
    );
    
    // Provide option to race again - NES style game continuation
    this.time.delayedCall(3000, () => {
      // NES-style continue screen
      const continueBox = this.add.rectangle(400, 300, 400, 200, 0x000000)
        .setStrokeStyle(4, 0xFCFCFC);
        
      const continueText = this.add.text(400, 280, 'CONTINUE?', {
        font: '32px monospace',
        fill: '#FCFCFC'
      }).setOrigin(0.5);
      
      const optionText = this.add.text(400, 330, 'PRESS SPACE', {
        font: '20px monospace',
        fill: '#FCFCFC'
      }).setOrigin(0.5);
      
      // Classic blinking effect
      this.tweens.add({
        targets: optionText,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Listen for continue
      const spaceHandler = this.input.keyboard.once('keydown-SPACE', () => {
        continueBox.destroy();
        continueText.destroy();
        optionText.destroy();
        
        this.raceStarted = false;
        
        // Check for game completion
        if (this.stats.galaxiesSaved >= 3) {
          this.showVictoryCutscene();
        } else {
          this.setupRace();
        }
      });
    });
  }
  
  showCosmicFireworks() {
    // NES-style particle explosions
    const colors = [0xFCFCFC, 0xF83800, 0x00B800, 0xFCFC00, 0x0078F8]; // NES colors
    
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(200, 600);
      const y = Phaser.Math.Between(100, 400);
      const size = Phaser.Math.Between(3, 6);
      const color = Phaser.Utils.Array.GetRandom(colors);
      
      // Create explosion point
      const particle = this.add.circle(x, y, size, color);
      
      // Expand and fade out
      this.tweens.add({
        targets: particle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1000 + Math.random() * 1000,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }
  
  showVictoryCutscene() {
    // Dim background - NES style
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8).setOrigin(0);
    
    // Victory messages
    const victoryMessages = [
      "HUMAN. YOU HAVE SUCCEEDED BEYOND ALL EXPECTATIONS.",
      "YOUR SPEED HAS BROUGHT PEACE TO THREE GALAXIES.",
      "THE COSMIC FEDERATION RECOGNIZES EARTH AS A PROTECTED WORLD.",
      "YOUR NAME WILL BE RECORDED IN THE HALLS OF THE COSMIC LEGENDS.",
      "RETURNING NOW TO YOUR PLANET...",
      "...WITH THE KNOWLEDGE THAT YOUR RUNNING CHANGED THE UNIVERSE."
    ];
    
    let currentLine = 0;
    
    // NES victory fanfare
    if (this.sound.get('victory')) {
      this.sound.play('victory', { volume: 0.7 });
    }
    
    // Cosmic background effects - moving stars
    const starfield = this.add.particles(0, 0, 'pixel-font-texture', {
      frame: 0,
      lifespan: 3000,
      quantity: 2,
      frequency: 50,
      gravityY: 0,
      x: { min: 0, max: 800 },
      y: { min: 0, max: 600 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: 100,
      tint: 0xFCFCFC // NES white
    });
    
    const textBox = this.add.rectangle(400, 300, 600, 150, 0x0078F8, 0.8) // NES blue
      .setStrokeStyle(4, 0xFCFC00); // NES yellow (for victory)
    
    const victoryText = this.add.text(400, 300, '', {
      font: '24px monospace',
      fill: '#FCFCFC',
      align: 'center',
      wordWrap: { width: 550 }
    }).setOrigin(0.5);
    
    const continueText = this.add.text(400, 400, 'PRESS SPACE', {
      font: '16px monospace',
      fill: '#FCFC00' // Yellow for victory
    }).setOrigin(0.5);
    
    // Blinking effect - NES style
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
    
    // Typewriter effect for NES style
    const typeText = (text) => {
      let index = 0;
      victoryText.setText('');
      
      const timer = this.time.addEvent({
        delay: 50,
        callback: () => {
          if (index < text.length) {
            victoryText.setText(victoryText.text + text[index]);
            index++;
          } else {
            timer.destroy();
          }
        },
        repeat: text.length - 1
      });
      
      return timer;
    };
    
    // Start with first message
    let textTimer = typeText(victoryMessages[currentLine]);
    
    const advanceDialog = () => {
      // If text is still typing, complete it immediately
      if (textTimer && textTimer.getRepeat() > 0) {
        textTimer.destroy();
        victoryText.setText(victoryMessages[currentLine]);
        return;
      }
      
      currentLine++;
      if (currentLine < victoryMessages.length) {
        victoryText.setText('');
        textTimer = typeText(victoryMessages[currentLine]);
      } else {
        // End cutscene with NES-style fade out
        this.cameras.main.fade(3000, 0, 0, 0);
        this.time.delayedCall(3000, () => {
          this.scene.start('MenuScene');
        });
      }
    };
    
    // Handle space key to advance text
    const spaceHandler = this.input.keyboard.on('keydown-SPACE', advanceDialog);
    
    // Cleanup on scene shutdown
    this.events.once('shutdown', () => {
      if (spaceHandler) spaceHandler.remove();
      if (starfield) starfield.destroy();
    });
  }
  
  update(time, delta) {
    // Auto-decrease running speed over time (Track & Field style decay)
    if (this.runningSpeed > 0) {
      const decayRate = 0.1 + (this.runningSpeed / 500);
      this.runningSpeed = Math.max(0, this.runningSpeed - decayRate);
      this.updateSpeedBar();
    }
    
    // Update key press timer for alternating rhythm
    if (this.lastKeyPressed !== null) {
      this.keyPressTimer += delta;
      
      // If timer exceeded, reset the last key to avoid penalties
      if (this.keyPressTimer > this.keyPressTimerMax * 1.5) {
        this.lastKeyPressed = null;
      }
    }
    
    // Update starfield parallax based on player speed (NES style)
    if (this.raceStarted && !this.raceComplete && this.stars) {
      this.stars.forEach(star => {
        star.x -= (this.runningSpeed / 100) * (star.width * 0.5);
        if (star.x < 0) star.x = 800;
      });
    }
  }
}

export default SpaceRaceScene; 