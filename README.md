# Rob the Runner

![Rob the Runner](assets/screenshot.png)

A classic NES-style endless runner game with retro pixel art and authentic 8-bit style gameplay mechanics.

## About the Game

Rob the Runner is an homage to classic NES games. Guide Rob through an endless obstacle course, jump over barriers, and try to achieve the highest score possible! The game features authentic NES-style graphics, complete with sprite animations for running, jumping, and special moves.

## How to Play

### Objective
- Run as far as possible without hitting obstacles
- Score points for distance traveled
- Use special techniques to maximize your score

### Controls

**Keyboard Controls:**
- **SPACE** or **UP ARROW**: Jump
- **A/B Keys**: Mash rapidly to boost speed
- **P**: Pause game
- **R**: Restart game (when paused or game over)
- **D**: Toggle debug visualization

**Animation Demo Keys:**
- **0**: Return to running animation
- **1-7**: Demo different animations

**Touch Controls (Mobile):**
- **Tap Screen**: Jump

### Special Techniques

**Speed Boost:**
- Rapidly alternate pressing the A and B keys to increase running speed
- The faster you mash, the greater your boost (up to 3x normal speed)
- Speed boosts increase your score multiplier
- Watch for the "SPEED" indicator to track your boost percentage
- At high speeds, Rob will occasionally flex to show off!

## Features

- Pixel-perfect sprite animations with 6 animation sets:
  - Running/falling
  - Jumping
  - Walk to crouch
  - Throw animations
  - Hammer throw
  - Various special animations (flex, head scratch, crying)
- Dynamic speed boost system
- Smart sprite sheet management with 38px uniform row heights
- Intelligent green screen background removal for sprites
- Authentic NES-style visuals with CRT overlay effect
- Progressive difficulty
- Forgiving hitbox for better gameplay experience
- Animated game over screen
- Debug visualization to inspect sprite animations

## Technical Details

### Sprite Sheet Structure
The game uses a sprite sheet with 6 rows of animations:
- Row 0: Walk to crouch (13 frames)
- Row 1: Running/fall (7 frames)
- Row 2: Long jump (9 frames)
- Row 3: Throw (12 frames)
- Row 4: Hammer throw (8 frames)
- Row 5: Mixed animations (10 frames)

### Sprite Dimensions
- Each sprite frame: 24×38 pixels
- Character display size: 48×76 pixels (2x scaling)

### Performance Optimizations
- Obstacle pooling for memory efficiency
- Canvas-based rendering for smooth animation
- Smart transparency handling for sprite rendering

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/rob-the-runner.git
```

2. Open the project folder:
```
cd rob-the-runner
```

3. Serve the files with a local web server:
```
# Using Python 3
python -m http.server 8000

# OR using Node.js
npx serve
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Credits

- Game Design & Development: [R Wis]
- Sprite Art: Custom pixel art designed in early gaming limitations
- Font: "Press Start 2P" (Google Fonts)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*May your jumps be high and your runs be long!* 