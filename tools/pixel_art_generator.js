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

// Character templates
const TEMPLATES = {
  runner_child: [
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
    '   BB BB    ',
    '  BB   BB   ',
  ],
  runner_teen: [
    '    BBB     ',
    '   BWWWB    ',
    '   BWWWB    ',
    '    BBB     ',
    '     B      ',
    '    BRB     ',
    '   BRRRB    ',
    '   BRRRB    ',
    '   BRRRB    ',
    '    BBB     ',
    '    B B     ',
    '   BB BB    ',
    '  BB   BB   ',
    '  B     B   ',
  ],
  runner_adult: [
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
    '   BB BB    ',
    '  BB   BB   ',
    '  B     B   ',
    ' B       B  ',
  ],
  alien: [
    '     GGG     ',
    '    GWWWG    ',
    '   GWWWWWG   ',
    '   GWGWGWG   ',
    '   GWWWWWG   ',
    '    GWWWG    ',
    '   GGGGGGG   ',
    '  GG GGG GG  ',
    ' GG   G   GG ',
  ],
  track_bg: [
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  ],
  space_track: [
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  ],
  store_bg: [
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'BYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYVB',
    'BYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYV B',
    'BYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYV  B',
    'BYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYV   B',
    'BWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWB   B',
    'B                                B   B',
    'B     RR      RR      RR        B   B',
    'B     RR      RR      RR        B   B',
    'B  BBBBBBB BBBBBBB BBBBBBB      B   B',
    'B  B     B B     B B     B      B   B',
    'B  B  B  B B  B  B B  B  B      B   B',
    'B  B  B  B B  B  B B  B  B      B   B',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  ],
  button: [
    'BBBBBBBBBBBBB',
    'BWWWWWWWWWWWB',
    'BWBBBBBBBBBWB',
    'BWBBBBBBBBBWB',
    'BWBBBBBBBBBWB',
    'BWWWWWWWWWWWB',
    'BBBBBBBBBBBBB',
  ],
  energy_bar: [
    'BBBBBBBBBBBBBBBBBBBBBBB',
    'BWWWWWWWWWWWWWWWWWWWWWB',
    'BWGGGGGGGGGGGGGGGGGGGWB',
    'BWGGGGGGGGGGGGGGGGGGGWB',
    'BWGGGGGGGGGGGGGGGGGGGWB',
    'BWWWWWWWWWWWWWWWWWWWWWB',
    'BBBBBBBBBBBBBBBBBBBBBBB',
  ]
};

// Helper function to replace template letters with colors
function colorFromLetter(letter) {
  switch(letter) {
    case 'B': return NES_COLORS[0]; // Black
    case 'W': return NES_COLORS[1]; // White
    case 'R': return NES_COLORS[2]; // Red
    case 'L': return NES_COLORS[3]; // Blue
    case 'G': return NES_COLORS[4]; // Green
    case 'Y': return NES_COLORS[5]; // Yellow
    case 'V': return NES_COLORS[6]; // Light Red
    case ' ': return null;           // Transparent
    default: return NES_COLORS[0];  // Default to black
  }
}

// Generate and save an asset
function generateAsset(name, template, scale = 4) {
  const width = template[0].length * scale;
  const height = template.length * scale;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Make the background transparent
  ctx.clearRect(0, 0, width, height);
  
  // Draw the pixels based on the template
  for (let y = 0; y < template.length; y++) {
    for (let x = 0; x < template[y].length; x++) {
      const color = colorFromLetter(template[y][x]);
      
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`../assets/sprites/${name}.png`, buffer);
  console.log(`Generated ${name}.png`);
}

// Create directories
try {
  if (!fs.existsSync('../assets')) {
    fs.mkdirSync('../assets');
  }
  if (!fs.existsSync('../assets/sprites')) {
    fs.mkdirSync('../assets/sprites');
  }
} catch (err) {
  console.error('Error creating directories:', err);
}

// Generate all assets
try {
  // Characters
  generateAsset('character/runner_child', TEMPLATES.runner_child, 4);
  generateAsset('character/runner_teen', TEMPLATES.runner_teen, 4);
  generateAsset('character/runner_adult', TEMPLATES.runner_adult, 4);
  generateAsset('character/alien', TEMPLATES.alien, 4);
  
  // Backgrounds
  generateAsset('backgrounds/track_background', TEMPLATES.track_bg, 4);
  generateAsset('backgrounds/space_track', TEMPLATES.space_track, 4);
  generateAsset('backgrounds/store_background', TEMPLATES.store_bg, 4);
  
  // UI elements
  generateAsset('ui/button', TEMPLATES.button, 4);
  generateAsset('ui/energy_bar', TEMPLATES.energy_bar, 4);
  
  console.log('All assets generated successfully!');
} catch (err) {
  console.error('Error generating assets:', err);
} 