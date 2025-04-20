// Asset Generator for Rob the Runner
// This script will create the necessary game assets 

// Creates a canvas element and returns its context
function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return {
        canvas: canvas,
        ctx: canvas.getContext('2d')
    };
}

// Creates and downloads an image from a canvas
function downloadImage(canvas, filename) {
    // Create an image and set its source to the canvas data
    const image = canvas.toDataURL('image/png');
    
    // Create a link element and trigger a download
    const link = document.createElement('a');
    link.href = image;
    link.download = filename;
    link.click();
}

// Generate an obstacle sprite (hurdle)
function generateObstacle() {
    const { canvas, ctx } = createCanvas(30, 30);
    
    // Background with transparency
    ctx.clearRect(0, 0, 30, 30);
    
    // Draw a simple hurdle
    ctx.fillStyle = '#d81118'; // NES red
    ctx.fillRect(0, 0, 30, 30);
    
    // Add some detail
    ctx.fillStyle = '#f8f8f8'; // NES white
    ctx.fillRect(5, 3, 20, 2);  // Top bar
    ctx.fillRect(7, 5, 2, 22);  // Left pole
    ctx.fillRect(21, 5, 2, 22); // Right pole
    
    downloadImage(canvas, 'obstacle.png');
}

// Generate ground tile
function generateGround() {
    const { canvas, ctx } = createCanvas(64, 40);
    
    // Fill with ground color
    ctx.fillStyle = '#8b4513'; // Brown
    ctx.fillRect(0, 0, 64, 40);
    
    // Add some texture - top edge grass
    ctx.fillStyle = '#00b800'; // NES green
    ctx.fillRect(0, 0, 64, 6);
    
    // Add some texture - dirt pattern
    ctx.fillStyle = '#5c2e0d'; // Darker brown
    for (let x = 0; x < 64; x += 8) {
        for (let y = 10; y < 40; y += 8) {
            if ((x + y) % 16 === 0) {
                ctx.fillRect(x, y, 4, 4);
            }
        }
    }
    
    downloadImage(canvas, 'ground.png');
}

// Generate background
function generateBackground() {
    const { canvas, ctx } = createCanvas(640, 360);
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, '#0078f8'); // NES blue (top of sky)
    gradient.addColorStop(0.7, '#3cbcfc'); // Light blue (horizon)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 360);
    
    // Draw some clouds
    ctx.fillStyle = '#f8f8f8'; // NES white
    
    // Cloud 1
    drawCloud(ctx, 100, 60, 80, 30);
    
    // Cloud 2
    drawCloud(ctx, 320, 40, 100, 40);
    
    // Cloud 3
    drawCloud(ctx, 500, 80, 70, 25);
    
    // Draw distant mountains
    ctx.fillStyle = '#5c2e0d'; // Brown mountains
    drawMountain(ctx, 100, 200, 200, 180);
    drawMountain(ctx, 400, 200, 150, 150);
    drawMountain(ctx, 550, 200, 180, 170);
    
    downloadImage(canvas, 'background.png');
}

// Helper function to draw a cloud
function drawCloud(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.arc(x, y, height, 0, Math.PI * 2);
    ctx.arc(x + width/3, y - height/2, height * 0.8, 0, Math.PI * 2);
    ctx.arc(x + width/1.5, y, height * 0.9, 0, Math.PI * 2);
    ctx.arc(x + width, y, height * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

// Helper function to draw a mountain
function drawMountain(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width/2, y - height);
    ctx.lineTo(x + width, y);
    ctx.fill();
    
    // Snow cap
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.moveTo(x + width/2, y - height);
    ctx.lineTo(x + width/2 + 20, y - height + 30);
    ctx.lineTo(x + width/2 - 20, y - height + 30);
    ctx.fill();
}

// Function to generate all assets
function generateAllAssets() {
    generateObstacle();
    generateGround();
    generateBackground();
    
    alert('All assets have been generated and downloaded!');
}

// Create UI to generate assets
function createAssetGeneratorUI() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = '#383838';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '1000';
    container.style.fontFamily = '"Press Start 2P", cursive';
    container.style.fontSize = '10px';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Asset Generator';
    heading.style.color = '#fcca00';
    heading.style.marginBottom = '10px';
    container.appendChild(heading);
    
    const generateObstacleBtn = document.createElement('button');
    generateObstacleBtn.textContent = 'Generate Obstacle';
    generateObstacleBtn.onclick = generateObstacle;
    styleButton(generateObstacleBtn);
    container.appendChild(generateObstacleBtn);
    
    const generateGroundBtn = document.createElement('button');
    generateGroundBtn.textContent = 'Generate Ground';
    generateGroundBtn.onclick = generateGround;
    styleButton(generateGroundBtn);
    container.appendChild(generateGroundBtn);
    
    const generateBackgroundBtn = document.createElement('button');
    generateBackgroundBtn.textContent = 'Generate Background';
    generateBackgroundBtn.onclick = generateBackground;
    styleButton(generateBackgroundBtn);
    container.appendChild(generateBackgroundBtn);
    
    const generateAllBtn = document.createElement('button');
    generateAllBtn.textContent = 'Generate All Assets';
    generateAllBtn.onclick = generateAllAssets;
    styleButton(generateAllBtn);
    generateAllBtn.style.backgroundColor = '#00b800';
    container.appendChild(generateAllBtn);
    
    document.body.appendChild(container);
}

// Helper to style buttons consistently
function styleButton(button) {
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.padding = '8px';
    button.style.margin = '5px 0';
    button.style.backgroundColor = '#0000c4';
    button.style.color = '#f8f8f8';
    button.style.border = 'none';
    button.style.borderRadius = '3px';
    button.style.fontFamily = '"Press Start 2P", cursive';
    button.style.fontSize = '8px';
    button.style.cursor = 'pointer';
}

// Create the UI when window loads (after the main game initializes)
window.addEventListener('load', () => {
    // Wait a bit to make sure the game has initialized
    setTimeout(createAssetGeneratorUI, 1000);
}); 