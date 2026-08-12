const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const y = 100;
    console.log(`Scanning Row ${y} from x = 490 to 560:`);
    
    for (let x = 490; x <= 560; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        console.log(`x = ${x} -> RGB(${r}, ${g}, ${b})`);
    }
}
run();
