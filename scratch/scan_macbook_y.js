const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Let's print out the RGB values of column x = 10, from y = 60 to 480 to find the borders
    const x = 10;
    console.log(`Scanning y-pixels at x = ${x} to detect horizontal lines...`);
    
    for (let y = 60; y < info.height; y++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        // If color is not pure white (255) and looks grey, let's log it
        if (r < 245 || g < 245 || b < 245) {
            console.log(`y = ${y} -> RGB(${r}, ${g}, ${b})`);
        }
    }
}
run();
