import Phaser from 'phaser';

class Cutscene1 extends Phaser.Scene {
  constructor() {
    super('Cutscene1');
    this.textLines = [
      "In the small town of Soleview...",
      "A young boy named Rob discovers his passion for running.",
      "With curious eyes and restless legs, he races against the wind.",
      "\"You're fast, kid. Maybe the fastest I've ever seen,\" says Coach Miller.",
      "Little does Rob know what destiny awaits him...",
      "...or how far his legs will take him.",
      "From humble beginnings on a high school track...",
      "...to settling disputes among the stars.",
      "Your journey begins now."
    ];
    this.currentLine = 0;
    this.typing = false;
    this.typingSpeed = 30; // ms per character
  }

  create() {
    // Black background
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);
    
    // Text box
    this.textBox = this.add.rectangle(400, 450, 700, 150, 0x111111)
      .setStrokeStyle(4, 0xffffff);
    
    // Skip prompt
    this.skipText = this.add.text(680, 520, 'SPACE to continue', {
      font: '16px monospace',
      fill: '#888888'
    }).setOrigin(0.5);
    
    // Blinking effect for skip prompt
    this.tweens.add({
      targets: this.skipText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Cutscene text
    this.dialogueText = this.add.text(100, 430, '', {
      font: '24px monospace',
      fill: '#ffffff',
      wordWrap: { width: 600 }
    });
    
    // Start typing the first line
    this.showNextLine();
    
    // Handle space key to advance text
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.typing) {
        // If still typing, show full line immediately
        this.typing = false;
        this.dialogueText.setText(this.textLines[this.currentLine]);
        if (this.typingEvent) this.typingEvent.remove();
      } else {
        // Show next line or end cutscene
        this.currentLine++;
        if (this.currentLine < this.textLines.length) {
          this.showNextLine();
        } else {
          this.endCutscene();
        }
      }
    });
  }
  
  showNextLine() {
    this.typing = true;
    this.dialogueText.setText('');
    
    let charIndex = 0;
    const currentText = this.textLines[this.currentLine];
    
    this.typingEvent = this.time.addEvent({
      delay: this.typingSpeed,
      callback: () => {
        if (charIndex < currentText.length) {
          this.dialogueText.setText(this.dialogueText.text + currentText[charIndex]);
          charIndex++;
        } else {
          this.typing = false;
          this.typingEvent.remove();
        }
      },
      repeat: currentText.length - 1
    });
  }
  
  endCutscene() {
    // Fade out
    this.cameras.main.fade(1000, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('TrackScene'); // Go to main gameplay after cutscene
      }
    });
  }
}

export default Cutscene1; 