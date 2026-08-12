const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Scan Row 100 (inside first row) to find vertical borders
    const y = 100;
    console.log(`Scanning Row ${y} for vertical border lines...`);
    
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        // If color is grey and looks like a card border line (usually RGB around 230-245)
        if (r < 246 && g < 246 && b < 246 && r > 210 && g > 210 && b > 210) {
            console.log(`x = ${x} -> RGB(${r}, ${g}, ${b})`);
        }
    }
}
run();
