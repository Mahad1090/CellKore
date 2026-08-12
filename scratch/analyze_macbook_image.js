const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Print out width and height
    console.log(`Image Size: ${info.width} x ${info.height}`);
    
    // Check some sample pixels to understand colors
    // Margins (outer background):
    console.log('Top Left Corner:', getRGB(5, 5, data, info));
    console.log('Top Center Margin:', getRGB(512, 10, data, info));
    
    // Let's find columns by looking for the border transitions
    // Since page is white/light grey, let's scan Row 180 across X
    // Card borders are grey lines. Let's list any pixels that deviate from white (255)
    // and see if we can find 6 columns.
    const y = 180;
    console.log(`Scanning Row ${y}...`);
    let transitions = [];
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        // If color is grey/border color (around 220-244)
        if (r < 246 && g < 246 && b < 246 && r > 210 && g > 210 && b > 210) {
            transitions.push(x);
        }
    }
    
    console.log('Grey outline pixel columns:', transitions.join(', '));
}

function getRGB(x, y, data, info) {
    const offset = (y * info.width + x) * info.channels;
    return `RGB(${data[offset]}, ${data[offset+1]}, ${data[offset+2]})`;
}

run();
