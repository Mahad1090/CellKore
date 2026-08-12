const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // We will scan Row 110, Row 260, Row 410 to find where the card boxes are.
    // Inside a card box, the background is pure white (R:255, G:255, B:255).
    // Let's print out the white spans for y = 110 (Row 1), y = 260 (Row 2), y = 410 (Row 3).
    
    const testY = [110, 260, 410];
    
    for (const y of testY) {
        console.log(`Scanning Row y = ${y} for white spans...`);
        let inWhite = false;
        let startX = 0;
        let spans = [];
        
        for (let x = 0; x < info.width; x++) {
            const offset = (y * info.width + x) * info.channels;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const isWhite = r === 255 && g === 255 && b === 255;
            
            if (isWhite) {
                if (!inWhite) {
                    inWhite = true;
                    startX = x;
                }
            } else {
                if (inWhite) {
                    inWhite = false;
                    // Only save spans wider than 10 pixels to filter out tiny gaps inside device graphics
                    if (x - startX > 10) {
                        spans.push({ start: startX, end: x - 1 });
                    }
                }
            }
        }
        if (inWhite) {
            if (info.width - startX > 10) {
                spans.push({ start: startX, end: info.width - 1 });
            }
        }
        
        console.log(`Found ${spans.length} white spans:`);
        spans.forEach(s => {
            console.log(`  Span: [${s.start}, ${s.end}] (width: ${s.end - s.start + 1})`);
        });
    }
}
run();
