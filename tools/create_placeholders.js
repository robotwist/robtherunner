const fs = require('fs');

// List of required asset paths
const requiredAssets = [
  '../assets/sprites/runner_child.png',
  '../assets/sprites/runner_teen.png',
  '../assets/sprites/runner_adult.png',
  '../assets/sprites/track_background.png',
  '../assets/sprites/store_background.png',
  '../assets/sprites/menu_background.png',
  '../assets/sprites/button.png',
  '../assets/sprites/energy_bar.png',
  '../assets/music/menu_theme.mp3',
  '../assets/music/race_theme.mp3'
];

// Simple 1x1 transparent pixel PNG data
const transparentPixelPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

// Simple silent MP3 data (44 bytes)
const silentMP3 = Buffer.from('/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'base64');

// Create each required asset
requiredAssets.forEach(path => {
  // Create directory structure if it doesn't exist
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(path)) {
    console.log(`Placeholder already exists: ${path}`);
    return;
  }
  
  // Write appropriate placeholder based on file extension
  if (path.endsWith('.png')) {
    fs.writeFileSync(path, transparentPixelPNG);
  } else if (path.endsWith('.mp3')) {
    fs.writeFileSync(path, silentMP3);
  }
  
  console.log(`Created placeholder: ${path}`);
});

console.log('All placeholders created successfully!'); 