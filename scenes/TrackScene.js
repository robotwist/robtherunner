import Phaser from 'phaser';

class TrackScene extends Phaser.Scene {
  constructor() {
    super('TrackScene');
    
    // Player stats
    this.stats = {
      age: 8,
      stage: 'Childhood',
      energy: 100,
      energyMax: 100,
      money: 0,
      speed: 1,
      endurance: 1,
      technique: 1,
      day: 1
    };
    
    // Game state
    this.currentActivity = 'Idle';
    this.lastKeyPressed = null;
    this.keyPressCount = 0;
    this.runningSpeed = 0;
    this.inTrainingMode = false;
    this.raceComplete = false;
    this.aKeyDown = false;
    this.bKeyDown = false;
    this.keyPressTimer = 0;
    this.keyPressTimerMax = 300; // Time window to press alternating keys
  }

  preload() {
    // Load animation metadata
    this.load.json('runner_child_anim', 'assets/sprites/animations/runner_child.json');
    this.load.json('runner_teen_anim', 'assets/sprites/animations/runner_teen.json');
    this.load.json('runner_adult_anim', 'assets/sprites/animations/runner_adult.json');
  }

  create() {
    // Background
    this.add.rectangle(0, 0, 800, 600, 0x002200).setOrigin(0);
    
    // Track
    this.drawTrack();
    
    // Set up player animation based on age
    this.setupPlayerSprite();
    
    // UI Elements
    this.setupUI();
    
    // Input events
    this.setupInput();
    
    // Status text
    this.statusText = this.add.text(400, 100, 'Press A/B to run!', {
      font: '24px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Location options
    this.setupLocations();
  }
  
  setupPlayerSprite() {
    // Choose the appropriate sprite based on age
    let spriteKey = 'runner_child';
    if (this.stats.age >= 18) {
      spriteKey = 'runner_adult';
    } else if (this.stats.age >= 13) {
      spriteKey = 'runner_teen';
    }
    
    // Create player sprite
    this.player = this.add.sprite(100, 400, spriteKey)
      .setScale(2);
    
    // Load animation data
    const animData = this.cache.json.get(`${spriteKey}_anim`);
    
    if (animData) {
      // Create animation configuration
      this.anims.create({
        key: `${spriteKey}_run`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          start: 0,
          end: animData.frames - 1
        }),
        frameRate: animData.frameRate,
        repeat: -1
      });
      
      // Create idle frame (first frame of animation)
      this.anims.create({
        key: `${spriteKey}_idle`,
        frames: [ { key: spriteKey, frame: 0 } ],
        frameRate: 1
      });
      
      // Start with idle animation
      this.player.play(`${spriteKey}_idle`);
    }
  }
  
  drawTrack() {
    // Draw a classic NES-style track with lanes
    const graphics = this.add.graphics();
    
    // Track base (brown/red NES color)
    graphics.fillStyle(0xF83800, 1); // NES Red
    graphics.fillRect(50, 320, 700, 150);
    
    // Track lanes
    graphics.fillStyle(0xFCFC00, 0.7); // NES Yellow
    graphics.fillRect(50, 350, 700, 5);
    graphics.fillRect(50, 390, 700, 5);
    graphics.fillRect(50, 430, 700, 5);
    
    // Start/finish lines
    graphics.fillStyle(0xFCFCFC, 1); // NES White
    graphics.fillRect(100, 320, 5, 150);
    graphics.fillRect(650, 320, 5, 150);
    
    // Checkered pattern at finish line (NES-style)
    for (let y = 320; y < 470; y += 20) {
      for (let i = 0; i < 4; i++) {
        const offsetY = y + (i * 5);
        const isOffset = Math.floor(y / 20) % 2 === 0;
        
        graphics.fillStyle(isOffset ? 0x000000 : 0xFCFCFC);
        graphics.fillRect(655, offsetY, 5, 5);
        
        graphics.fillStyle(!isOffset ? 0x000000 : 0xFCFCFC);
        graphics.fillRect(660, offsetY, 5, 5);
      }
    }
  }
  
  setupUI() {
    // Retro style energy bar
    this.add.text(50, 30, 'ENERGY', {
      font: '16px monospace',
      fill: '#ffffff'
    });
    
    this.energyBarBg = this.add.rectangle(250, 40, 300, 20, 0x333333);
    
    // Create segmented NES-style energy bar (10 segments)
    this.energySegments = [];
    const segmentWidth = 28;
    const segmentGap = 2;
    const segmentCount = 10;
    
    for (let i = 0; i < segmentCount; i++) {
      const x = 100 + (i * (segmentWidth + segmentGap));
      const segment = this.add.rectangle(x, 40, segmentWidth, 20, 0x00B800).setOrigin(0, 0.5);
      this.energySegments.push(segment);
    }
    
    // Stats panel with NES-style border
    const statsPanel = this.add.rectangle(680, 120, 200, 180, 0x000000, 0.7);
    const border = this.add.rectangle(680, 120, 204, 184, 0xFCFCFC, 1);
    border.isStroked = true;
    border.strokeColor = 0xFCFCFC;
    
    this.ageText = this.add.text(600, 50, `AGE: ${this.stats.age}`, {
      font: '16px monospace',
      fill: '#ffffff'
    });
    
    this.stageText = this.add.text(600, 70, `STAGE: ${this.stats.stage}`, {
      font: '16px monospace',
      fill: '#ffffff'
    });
    
    this.moneyText = this.add.text(600, 90, `MONEY: $${this.stats.money}`, {
      font: '16px monospace',
      fill: '#ffffff'
    });
    
    this.add.text(600, 110, 'STATS:', {
      font: '16px monospace',
      fill: '#ffff00'
    });
    
    this.speedText = this.add.text(620, 130, `SPEED: ${this.stats.speed}`, {
      font: '14px monospace',
      fill: '#ffffff'
    });
    
    this.enduranceText = this.add.text(620, 150, `ENDURANCE: ${this.stats.endurance}`, {
      font: '14px monospace',
      fill: '#ffffff'
    });
    
    this.techniqueText = this.add.text(620, 170, `TECHNIQUE: ${this.stats.technique}`, {
      font: '14px monospace',
      fill: '#ffffff'
    });
    
    this.dayText = this.add.text(620, 190, `DAY: ${this.stats.day}`, {
      font: '14px monospace',
      fill: '#ffffff'
    });
    
    // Running speed meter
    this.add.text(50, 70, 'SPEED', {
      font: '16px monospace',
      fill: '#ffffff'
    });
    
    this.speedBarBg = this.add.rectangle(250, 80, 300, 20, 0x333333);
    
    // Create segmented NES-style speed bar (10 segments)
    this.speedSegments = [];
    
    for (let i = 0; i < segmentCount; i++) {
      const x = 100 + (i * (segmentWidth + segmentGap));
      const color = i < 3 ? 0xF83800 : (i < 7 ? 0xFCFC00 : 0x00B800);
      const segment = this.add.rectangle(x, 80, segmentWidth, 20, color).setOrigin(0, 0.5);
      segment.visible = false;
      this.speedSegments.push(segment);
    }
    
    // Key press indicators
    this.aKeyIndicator = this.add.rectangle(50, 120, 40, 40, 0x333333)
      .setStrokeStyle(2, 0xFFFFFF);
    this.bKeyIndicator = this.add.rectangle(100, 120, 40, 40, 0x333333)
      .setStrokeStyle(2, 0xFFFFFF);
      
    this.add.text(50, 120, 'A', {
      font: '24px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(100, 120, 'B', {
      font: '24px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }
  
  setupInput() {
    // A/B alternating keys for running - Track & Field style
    this.input.keyboard.on('keydown-A', () => {
      if (!this.aKeyDown) {
        this.aKeyDown = true;
        this.aKeyIndicator.fillColor = 0xF83800;
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
        this.bKeyIndicator.fillColor = 0xF83800;
        this.handleRunningKeyDown('B');
      }
    });
    
    this.input.keyboard.on('keyup-B', () => {
      this.bKeyDown = false;
      this.bKeyIndicator.fillColor = 0x333333;
    });
    
    // Space to start/stop training
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.currentActivity === 'Idle') {
        this.startTraining();
      } else {
        this.stopActivity();
      }
    });
  }
  
  setupLocations() {
    // Track & Field style menu options
    const locations = [
      { name: 'TRACK: TRAIN', x: 150, y: 530, action: () => this.startTraining() },
      { name: 'STORE: WORK', x: 400, y: 530, action: () => this.goToStore() },
      { name: 'HOME: REST', x: 650, y: 530, action: () => this.goHome() }
    ];
    
    locations.forEach(loc => {
      // NES-style button
      const button = this.add.rectangle(loc.x, loc.y, 180, 40, 0x000000, 1)
        .setStrokeStyle(2, 0xFCFCFC);
        
      const buttonHighlight = this.add.rectangle(loc.x, loc.y, 176, 36, 0x333333, 1);
      
      // Make the button interactive
      button.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonHighlight.fillColor = 0x444444;
          buttonText.setTint(0xFCFC00);
        })
        .on('pointerout', () => {
          buttonHighlight.fillColor = 0x333333;
          buttonText.clearTint();
        })
        .on('pointerdown', loc.action);
        
      const buttonText = this.add.text(loc.x, loc.y, loc.name, {
        font: '16px monospace',
        fill: '#ffffff'
      }).setOrigin(0.5);
    });
  }
  
  handleRunningKeyDown(key) {
    if (this.currentActivity !== 'Training' && this.currentActivity !== 'Working') {
      return;
    }
    
    // Track & Field style input handling
    if (this.lastKeyPressed === key) {
      // Penalty for pressing same key twice in a row
      this.runningSpeed = Math.max(0, this.runningSpeed - 15);
      this.statusText.setText('Alternate keys! A then B then A...');
    } else {
      // Check if within timing window
      const goodTiming = this.keyPressTimer < this.keyPressTimerMax && this.keyPressTimer > 0;
      
      // Track & Field style speed gain based on alternating keys quickly
      let speedGain = 0;
      if (goodTiming) {
        // Faster keypresses = more speed
        const timingBonus = 1 - (this.keyPressTimer / this.keyPressTimerMax);
        speedGain = 10 + Math.floor(timingBonus * 10);
        
        if (this.currentActivity === 'Training') {
          speedGain *= (1 + (this.stats.technique * 0.1));
        } else {
          speedGain *= 0.5; // Working is less effective for speed
        }
      } else {
        speedGain = 5; // Basic gain for alternating keys but with poor timing
      }
      
      this.runningSpeed = Math.min(100, this.runningSpeed + speedGain);
      this.lastKeyPressed = key;
      this.keyPressTimer = 0; // Reset timer for next key press
      
      // Update status based on speed
      if (this.runningSpeed > 80) {
        this.statusText.setText('AMAZING SPEED!');
      } else if (this.runningSpeed > 50) {
        this.statusText.setText('Good pace!');
      } else {
        this.statusText.setText('Keep going!');
      }
    }
    
    // Update speed bar
    this.updateSpeedBar();
    
    // Consume energy while running
    const energyUse = this.currentActivity === 'Training' ? 2 : 1;
    this.stats.energy -= energyUse * (1 - (this.stats.endurance * 0.05));
    this.stats.energy = Math.max(0, this.stats.energy);
    this.updateEnergyBar();
    
    // Check if energy depleted
    if (this.stats.energy <= 0) {
      this.exhausted();
      return;
    }
    
    // Move player based on speed
    if (this.currentActivity === 'Training') {
      // Change animation based on speed
      const playerAnimKey = this.stats.age >= 18 ? 'runner_adult' : 
                          (this.stats.age >= 13 ? 'runner_teen' : 'runner_child');
                          
      // Adjust animation speed based on running speed
      const animSpeed = 5 + (this.runningSpeed / 10); // 5-15 fps based on speed
      this.player.anims.timeScale = this.runningSpeed / 50; // 0-2x speed scale
      
      // Make sure animation is playing
      if (!this.player.anims.isPlaying) {
        this.player.play(`${playerAnimKey}_run`);
      }
      
      // Move player along track
      const moveSpeed = (this.runningSpeed / 100) * 5; // Max 5 pixels per frame
      this.player.x += moveSpeed;
      
      // Check if reached finish line
      if (this.player.x >= 650 && !this.raceComplete) {
        this.finishRace();
      }
    }
  }
  
  updateSpeedBar() {
    // Update NES-style segmented speed bar
    const segmentsToShow = Math.floor(this.runningSpeed / 10);
    
    this.speedSegments.forEach((segment, index) => {
      segment.visible = index < segmentsToShow;
    });
  }
  
  updateEnergyBar() {
    // Update NES-style segmented energy bar
    const energyPercentage = this.stats.energy / this.stats.energyMax;
    const segmentsToShow = Math.floor(energyPercentage * 10);
    
    this.energySegments.forEach((segment, index) => {
      // Make visible based on current energy
      segment.visible = index < segmentsToShow;
      
      // Color based on energy level (red, yellow, green)
      if (segmentsToShow <= 3) {
        segment.fillColor = 0xF83800; // NES Red
      } else if (segmentsToShow <= 7) {
        segment.fillColor = 0xFCFC00; // NES Yellow
      } else {
        segment.fillColor = 0x00B800; // NES Green
      }
    });
  }
  
  startTraining() {
    this.currentActivity = 'Training';
    this.statusText.setText('TRAINING: Alternate A & B keys rapidly!');
    this.inTrainingMode = true;
    this.raceComplete = false;
    this.player.x = 100;
    this.runningSpeed = 0;
    this.updateSpeedBar();
    
    // Reset key states
    this.lastKeyPressed = null;
    this.keyPressTimer = 0;
    
    // Choose animation based on age
    const playerAnimKey = this.stats.age >= 18 ? 'runner_adult' : 
                        (this.stats.age >= 13 ? 'runner_teen' : 'runner_child');
    
    // Start with idle animation
    this.player.play(`${playerAnimKey}_idle`);
  }
  
  goToStore() {
    if (this.stats.energy < 20) {
      this.statusText.setText("Too tired to work! Rest first.");
      return;
    }
    
    this.currentActivity = 'Working';
    this.statusText.setText('WORKING: Alternate A & B keys to stock shelves!');
    this.inTrainingMode = false;
    this.runningSpeed = 0;
    this.updateSpeedBar();
    
    // Reset key states
    this.lastKeyPressed = null;
    this.keyPressTimer = 0;
  }
  
  goHome() {
    this.currentActivity = 'Resting';
    this.statusText.setText('Resting and recovering energy...');
    
    // Recovery timer - NES style with countdown
    let restTime = 3;
    
    const restTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        restTime--;
        this.statusText.setText(`Resting... ${restTime}`);
        
        if (restTime <= 0) {
          this.stats.energy = this.stats.energyMax;
          this.updateEnergyBar();
          this.currentActivity = 'Idle';
          this.statusText.setText('Fully rested! Ready for action.');
          this.advanceDay();
        }
      },
      repeat: 3
    });
  }
  
  exhausted() {
    this.statusText.setText('EXHAUSTED! Need to rest...');
    this.stopActivity();
    
    // Visual feedback
    this.cameras.main.shake(500, 0.01);
    this.player.setTint(0xF83800);
    
    this.time.delayedCall(1000, () => {
      this.player.clearTint();
    });
  }
  
  stopActivity() {
    this.currentActivity = 'Idle';
    this.runningSpeed = 0;
    this.updateSpeedBar();
    
    // Stop animation
    const playerAnimKey = this.stats.age >= 18 ? 'runner_adult' : 
                        (this.stats.age >= 13 ? 'runner_teen' : 'runner_child');
    this.player.play(`${playerAnimKey}_idle`);
  }
  
  finishRace() {
    this.raceComplete = true;
    
    // Track & Field style finish fanfare
    this.cameras.main.flash(500, 255, 255, 255);
    this.player.anims.stop();
    
    // Calculate performance based on stats and randomness
    const baseReward = 20;
    const speedBonus = Math.floor(this.stats.speed * 5);
    const techniqueBonus = Math.floor(this.stats.technique * 3);
    const reward = baseReward + speedBonus + techniqueBonus;
    
    this.stats.money += reward;
    this.moneyText.setText(`MONEY: $${this.stats.money}`);
    
    // Improve stats - Track & Field style with visible gains
    const speedGain = 0.1 + (Math.random() * 0.1);
    const enduranceGain = 0.1 + (Math.random() * 0.1);
    const techniqueGain = 0.05 + (Math.random() * 0.05);
    
    this.stats.speed += speedGain;
    this.stats.endurance += enduranceGain;
    this.stats.technique += techniqueGain;
    
    // Show stat increases
    this.time.delayedCall(500, () => {
      this.statusText.setText(`RACE COMPLETE! +$${reward}`);
      
      // Show stat gains with NES-style popup
      const popup = this.add.rectangle(400, 300, 300, 150, 0x000000)
        .setStrokeStyle(4, 0xFCFCFC);
        
      const popupText = this.add.text(400, 280, 
        `SPEED +${speedGain.toFixed(1)}\nENDURANCE +${enduranceGain.toFixed(1)}\nTECHNIQUE +${techniqueGain.toFixed(1)}`, {
        font: '18px monospace',
        fill: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      
      const continueText = this.add.text(400, 340, 'Press SPACE', {
        font: '16px monospace',
        fill: '#ffff00'
      }).setOrigin(0.5);
      
      // Blink continue text
      this.tweens.add({
        targets: continueText,
        alpha: 0.2,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Wait for space to continue
      const spaceKey = this.input.keyboard.addKey('SPACE');
      spaceKey.once('down', () => {
        popup.destroy();
        popupText.destroy();
        continueText.destroy();
        this.updateStatsText();
        this.stopActivity();
        
        // Check if ready to advance to space race (when speed is high enough)
        if (this.stats.speed >= 10 && this.stats.age >= 18) {
          this.time.delayedCall(1000, () => {
            // NES style transition
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.time.delayedCall(1000, () => {
              this.scene.start('SpaceRaceScene');
            });
          });
        }
      });
    });
  }
  
  updateStatsText() {
    this.speedText.setText(`SPEED: ${this.stats.speed.toFixed(1)}`);
    this.enduranceText.setText(`ENDURANCE: ${this.stats.endurance.toFixed(1)}`);
    this.techniqueText.setText(`TECHNIQUE: ${this.stats.technique.toFixed(1)}`);
  }
  
  advanceDay() {
    this.stats.day += 1;
    this.dayText.setText(`DAY: ${this.stats.day}`);
    
    // Age up every 7 days (classic RPG style)
    if (this.stats.day % 7 === 0) {
      this.stats.age += 1;
      this.ageText.setText(`AGE: ${this.stats.age}`);
      
      // NES style birthday effect
      const birthdayText = this.add.text(400, 300, 'HAPPY BIRTHDAY!', {
        font: '32px monospace',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5);
      
      // Flash effect
      this.tweens.add({
        targets: birthdayText,
        alpha: 0,
        duration: 200,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          birthdayText.destroy();
        }
      });
      
      // Update life stage if needed
      let stageChanged = false;
      
      if (this.stats.age === 13 && this.stats.stage !== 'Teen Years') {
        this.stats.stage = 'Teen Years';
        stageChanged = true;
      } else if (this.stats.age === 18 && this.stats.stage !== 'Young Adult') {
        this.stats.stage = 'Young Adult';
        stageChanged = true;
      } else if (this.stats.age === 30 && this.stats.stage !== 'Prime') {
        this.stats.stage = 'Prime';
        stageChanged = true;
      }
      
      this.stageText.setText(`STAGE: ${this.stats.stage}`);
      
      // If stage changed, update player sprite
      if (stageChanged) {
        this.player.destroy();
        this.setupPlayerSprite();
      }
    }
  }
  
  update(time, delta) {
    // Auto-decrease running speed over time (Track & Field style decay)
    if (this.runningSpeed > 0) {
      // Faster speeds decay quicker
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
    
    // Energy regeneration when idle (slower in NES style)
    if (this.currentActivity === 'Idle' && this.stats.energy < this.stats.energyMax) {
      this.stats.energy += 0.05;
      this.updateEnergyBar();
    }
  }
}

export default TrackScene; 