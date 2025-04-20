// Utility script to remove green background from player sprite
// This creates a version of the sprite with transparent background

window.addEventListener('load', function() {
    // Wait until the game has fully loaded
    setTimeout(function() {
        processPlayerSprite();
    }, 1000);
});

function processPlayerSprite() {
    // Access the sprites from the global window object
    if (!window.sprites || !window.sprites.player || !window.sprites.player.complete) {
        console.log('Player sprite not ready, trying again in 1 second');
        setTimeout(processPlayerSprite, 1000);
        return;
    }
    
    console.log('Processing player sprite to remove green background');
    
    // Create a canvas to process the sprite
    const canvas = document.createElement('canvas');
    canvas.width = window.sprites.player.width;
    canvas.height = window.sprites.player.height;
    const ctx = canvas.getContext('2d');
    
    // Draw the original sprite
    ctx.drawImage(window.sprites.player, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Loop through all pixels
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Detect the background color - look for all shades of green
        // This handles everything from pure green to mint/lime green
        if (
            // Standard green detection
            (g > r * 1.2 && g > b * 1.2) || 
            // Light green / mint green
            (g > 150 && r < 150 && b < 150) ||
            (r < 200 && g > 200 && b < 200) ||
            // Specific mint green range
            (r > 150 && r < 220 && g > 220 && b > 150 && b < 220) ||
            // Very light green (almost white with green tint)
            (r > 200 && g > 230 && b > 200 && g > r && g > b) ||
            // Check for specific color used in this sprite (if known)
            (r === 144 && g === 238 && b === 144) // Light green
        ) {
            // Make it transparent
            data[i + 3] = 0;
        }
    }
    
    // Put the processed image data back on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Create a new image from the processed canvas
    const transparentSprite = new Image();
    transparentSprite.onload = function() {
        // Replace the original sprite with the transparent version
        window.sprites.player = transparentSprite;
        console.log('Sprite background removed successfully');
    };
    transparentSprite.src = canvas.toDataURL('image/png');
    
    // Optionally display the processed sprite on the page for debugging
    if (false) { // Change to true to see the processed sprite
        canvas.style.position = 'fixed';
        canvas.style.top = '10px';
        canvas.style.left = '10px';
        canvas.style.border = '2px solid red';
        canvas.style.zIndex = '1000';
        canvas.style.background = '#333'; // Dark background to see transparency
        document.body.appendChild(canvas);
    }
} 