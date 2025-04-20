const fs = require('fs');
const { createCanvas } = require('canvas');

// NES Color palette (limited to 8 colors for authenticity)
const NES_COLORS = [
  '#000000', // Black
  '#FCFCFC', // White
  '#F83800', // Red
  '#0078F8', // Blue 
  '#00B800', // Green
  '#FCFC00', // Yellow
  '#FC7460', // Light Red
  '#3CBCFC', // Light Blue
];

// Animation frames (4 frames per character)
const ANIMATIONS = {
  runner_child: [
    // Frame 1: Running pose 1
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '   B  BB    ',
      '  B    BB   ',
    ],
    // Frame 2: Running pose 2
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '   B  B     ',
      '  BB  B     ',
      ' BB   B     ',
    ],
    // Frame 3: Running pose 3 (similar to 1)
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '    BB B    ',
      '   BB   B   ',
    ],
    // Frame 4: Running pose 4 (similar to 2)
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '    B BB    ',
      '    B  BB   ',
    ],
  ],
  
  runner_adult: [
    // Frame 1: Adult running pose 1
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '   B  BB    ',
      '  B    BB   ',
      ' B      B   ',
      'B        B  ',
    ],
    // Frame 2: Adult running pose 2
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '   B  B     ',
      '  BB  B     ',
      ' BB   B     ',
      ' B    B     ',
      'B     B     ',
    ],
    // Frame 3: Adult running pose 3
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '    BB B    ',
      '   BB   B   ',
      '   B     B  ',
      '  B       B ',
    ],
    // Frame 4: Adult running pose 4
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BRB     ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '   BRRRB    ',
      '    BBB     ',
      '    B B     ',
      '    B BB    ',
      '    B  BB   ',
      '    B    B  ',
      '    B     B ',
    ],
  ],
  
  space_runner: [
    // Frame 1: Space runner pose 1 (glowing blue accents)
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BLB     ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '    BBB     ',
      '    B B     ',
      '   B  BB    ',
      '  B    BB   ',
      ' B      B   ',
      'BLLL    LLL ',
    ],
    // Frame 2: Space runner pose 2
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BLB     ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '    BBB     ',
      '   B  B     ',
      '  BB  B     ',
      ' BB   B     ',
      ' B    B     ',
      'BLLL  LLL   ',
    ],
    // Frame 3: Space runner pose 3
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BLB     ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '    BBB     ',
      '    B B     ',
      '    BB B    ',
      '   BB   B   ',
      '   B     B  ',
      '  BLLL   LLL',
    ],
    // Frame 4: Space runner pose 4
    [
      '    BBB     ',
      '   BWWWB    ',
      '   BWWWB    ',
      '    BBB     ',
      '     B      ',
      '    BLB     ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '   BLLLB    ',
      '    BBB     ',
      '    B B     ',
      '    B BB    ',
      '    B  BB   ',
      '    B    B  ',
      '    BLLL LLL',
    ],
  ],
  
  alien: [
    // Frame 1: Alien floating pose 1
    [
      '     GGG     ',
      '    GWWWG    ',
      '   GWWWWWG   ',
      '   GWGWGWG   ',
      '   GWWWWWG   ',
      '    GWWWG    ',
      '   GGGGGGG   ',
      '  GG GGG GG  ',
      ' GG   G   GG ',
      '      G      ',
      '     G G     ',
      '    G   G    ',
    ],
    // Frame 2: Alien floating pose 2
    [
      '     GGG     ',
      '    GWWWG    ',
      '   GWWWWWG   ',
      '   GWGWGWG   ',
      '   GWWWWWG   ',
      '    GWWWG    ',
      '   GGGGGGG   ',
      '  GG GGG GG  ',
      ' GG   G   GG ',
      '     G G     ',
      '    G   G    ',
      '   G     G   ',
    ],
    // Frame 3: Alien floating pose 3
    [
      '     GGG     ',
      '    GWWWG    ',
      '   GWWWWWG   ',
      '   GWGWGWG   ',
      '   GWWWWWG   ',
      '    GWWWG    ',
      '   GGGGGGG   ',
      '  GG GGG GG  ',
      ' GG   G   GG ',
      '    G   G    ',
      '   G     G   ',
      '  G       G  ',
    ],
    // Frame 4: Alien floating pose 4
    [
      '     GGG     ',
      '    GWWWG    ',
      '   GWWWWWG   ',
      '   GWGWGWG   ',
      '   GWWWWWG   ',
      '    GWWWG    ',
      '   GGGGGGG   ',
      '  GG GGG GG  ',
      ' GG   G   GG ',
      '   G     G   ',
      '  G       G  ',
      ' G         G ',
    ],
  ]
};

// Helper function to replace template letters with colors
function colorFromLetter(letter) {
  switch(letter) {
    case 'B': return NES_COLORS[0]; // Black
    case 'W': return NES_COLORS[1]; // White
    case 'R': return NES_COLORS[2]; // Red
    case 'L': return NES_COLORS[3]; // Blue (cosmic energy)
    case 'G': return NES_COLORS[4]; // Green
    case 'Y': return NES_COLORS[5]; // Yellow
    case 'V': return NES_COLORS[6]; // Light Red
    case ' ': return null;           // Transparent
    default: return NES_COLORS[0];  // Default to black
  }
}

// Generate a sprite sheet from animation frames
function generateSpriteSheet(name, frames, scale = 4) {
  // Find the max dimensions across all frames
  let maxWidth = 0;
  let maxHeight = 0;
  
  frames.forEach(frame => {
    maxWidth = Math.max(maxWidth, frame[0].length);
    maxHeight = Math.max(maxHeight, frame.length);
  });
  
  // Create a canvas for the entire sprite sheet
  const sheetWidth = maxWidth * scale * frames.length;
  const sheetHeight = maxHeight * scale;
  
  const canvas = createCanvas(sheetWidth, sheetHeight);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, sheetWidth, sheetHeight);
  
  // Draw each frame
  frames.forEach((frame, frameIndex) => {
    const frameOffsetX = frameIndex * maxWidth * scale;
    
    // Draw the pixels for this frame
    for (let y = 0; y < frame.length; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        const color = colorFromLetter(frame[y][x]);
        
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            frameOffsetX + x * scale, 
            y * scale, 
            scale, 
            scale
          );
        }
      }
    }
  });
  
  // Create the animations directory if it doesn't exist
  if (!fs.existsSync('../assets/sprites/animations')) {
    fs.mkdirSync('../assets/sprites/animations', { recursive: true });
  }
  
  // Save the sprite sheet
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`../assets/sprites/animations/${name}_spritesheet.png`, buffer);
  
  // Generate a single animated GIF as well (for preview purposes)
  console.log(`Generated ${name}_spritesheet.png`);
  
  // Return information about the sprite sheet
  return {
    frames: frames.length,
    frameWidth: maxWidth * scale,
    frameHeight: maxHeight * scale
  };
}

// Generate all animations
try {
  const animations = Object.keys(ANIMATIONS);
  
  for (const animation of animations) {
    const info = generateSpriteSheet(animation, ANIMATIONS[animation], 4);
    
    // Write animation metadata to a JSON file
    const metadata = {
      name: animation,
      spritesheet: `animations/${animation}_spritesheet.png`,
      frameWidth: info.frameWidth,
      frameHeight: info.frameHeight,
      frames: info.frames,
      frameRate: 8
    };
    
    fs.writeFileSync(`../assets/sprites/animations/${animation}.json`, JSON.stringify(metadata, null, 2));
    console.log(`Generated metadata for ${animation}`);
  }
  
  console.log('All animations generated successfully!');
} catch (err) {
  console.error('Error generating animations:', err);
} 