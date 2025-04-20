import Phaser from 'phaser';

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Background
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);
    
    // Title
    this.add.text(400, 100, 'ROB THE RUNNER', {
      font: '64px monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add.text(400, 170, 'A Cradle-to-Grave Running Simulator', {
      font: '24px monospace',
      fill: '#ffff00'
    }).setOrigin(0.5);
    
    // Menu options
    this.createMenuButton(400, 280, 'NEW GAME', () => {
      this.scene.start('Cutscene1');
    });
    
    this.createMenuButton(400, 350, 'CONTINUE', () => {
      // Load saved game - to be implemented
      console.log('Load game would go here');
    });
    
    this.createMenuButton(400, 420, 'OPTIONS', () => {
      // Show options menu - to be implemented
      console.log('Options would go here');
    });
    
    // Version info
    this.add.text(10, 580, 'v0.1.0 - Prototype', {
      font: '12px monospace',
      fill: '#444444'
    });
    
    // Easter egg
    this.add.text(790, 580, '👟', {
      font: '16px Arial'
    }).setOrigin(1, 0);
    
    // Play menu music if available
    if (this.sound.get('menu_music')) {
      const music = this.sound.play('menu_music', {
        loop: true,
        volume: 0.5
      });
    }
  }
  
  createMenuButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 300, 50, 0x222222, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        button.fillColor = 0x444444;
        buttonText.setColor('#ffff00');
      })
      .on('pointerout', () => {
        button.fillColor = 0x222222;
        buttonText.setColor('#ffffff');
      })
      .on('pointerdown', callback);
      
    const buttonText = this.add.text(x, y, text, {
      font: '24px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    return { button, text: buttonText };
  }
}

export default MenuScene; 