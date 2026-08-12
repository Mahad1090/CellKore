const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786545363906.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const y = 600;
    console.log(`Scanning Row ${y} for 8 columns...`);
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
                console.log(`Non-white section from x=${startX} to x=${x - 1} (r:${data[(y*info.width + startX)*info.channels]}, g:${data[(y*info.width + startX)*info.channels+1]}, b:${data[(y*info.width + startX)*info.channels+2]})`);
            }
        }
    }
}
run();
