const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Scan Row 100 for near-white spans (R > 250, G > 250, B > 250)
    const y = 100;
    console.log(`Scanning Row ${y} for near-white spans...`);
    
    let inSpan = false;
    let startX = 0;
    let spans = [];
    
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const isNearWhite = r > 250 && g > 250 && b > 250;
        
        if (isNearWhite) {
            if (!inSpan) {
                inSpan = true;
                startX = x;
            }
        } else {
            if (inSpan) {
                inSpan = false;
                if (x - startX > 5) {
                    spans.push({ start: startX, end: x - 1 });
                }
            }
        }
    }
    if (inSpan) {
        if (info.width - startX > 5) {
            spans.push({ start: startX, end: info.width - 1 });
        }
    }
    
    console.log(`Found ${spans.length} near-white spans:`);
    spans.forEach((s, idx) => {
        console.log(`  Span ${idx}: [${s.start}, ${s.end}] (width: ${s.end - s.start + 1})`);
    });
}
run();
