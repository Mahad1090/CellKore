const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Scan Row 163 (horizontal line dividing Row 1 and Row 2 card boxes)
    const y = 163;
    console.log(`Scanning Row ${y} across entire width to find vertical line coordinates...`);
    
    let inBorder = false;
    let startX = 0;
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        // Outline is grey. Standard background is RGB(248, 247, 249).
        // Let's find any pixels with r < 240
        if (r < 240) {
            if (!inBorder) {
                inBorder = true;
                startX = x;
            }
        } else {
            if (inBorder) {
                inBorder = false;
                console.log(`Border line from x = ${startX} to x = ${x - 1}`);
            }
        }
    }
}
run();
