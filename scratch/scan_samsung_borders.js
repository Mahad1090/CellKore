const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546104120.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Scan Row 50 for column borders
    const y = 50;
    console.log(`Scanning Row ${y} for column borders...`);
    let inNonWhite = false;
    let startX = 0;
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const isWhite = r > 248 && g > 248 && b > 248;
        
        if (!isWhite) {
            if (!inNonWhite) {
                inNonWhite = true;
                startX = x;
            }
        } else {
            if (inNonWhite) {
                inNonWhite = false;
                console.log(`Column Border: x=${startX} to x=${x - 1}`);
            }
        }
    }
    
    // Scan Column 50 for row borders
    const x = 50;
    console.log(`Scanning Column ${x} for row borders...`);
    inNonWhite = false;
    let startY = 0;
    for (let y = 0; y < info.height; y++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const isWhite = r > 248 && g > 248 && b > 248;
        
        if (!isWhite) {
            if (!inNonWhite) {
                inNonWhite = true;
                startY = y;
            }
        } else {
            if (inNonWhite) {
                inNonWhite = false;
                console.log(`Row Border: y=${startY} to y=${y - 1}`);
            }
        }
    }
}
run();
