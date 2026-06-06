const fs = require('fs');
const path = require('path');

// Create a simple function to generate a PNG with canvas
const createIconPNG = async (size) => {
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Blue background (#2563eb)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, size, size);
    
    // White text "D"
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', size / 2, size / 2);
    
    const buffer = canvas.toBuffer('image/png');
    return buffer;
  } catch (err) {
    console.log('Canvas not available, creating minimal PNG');
    // Fallback: create a minimal valid PNG
    // This is a minimal 1x1 transparent PNG
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x5e, 0x58, 0x7b, 0x6f, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
  }
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const appleSize = 180;

const generateIcons = async () => {
  const publicDir = path.join(__dirname, 'public', 'icons');
  
  // Generate standard icons
  for (const size of sizes) {
    const filename = path.join(publicDir, `icon-${size}x${size}.png`);
    const buffer = await createIconPNG(size);
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename}`);
  }
  
  // Generate Apple touch icon
  const appleFilename = path.join(publicDir, 'apple-touch-icon.png');
  const appleBuffer = await createIconPNG(appleSize);
  fs.writeFileSync(appleFilename, appleBuffer);
  console.log(`Created ${appleFilename}`);
};

generateIcons().catch(console.error);
