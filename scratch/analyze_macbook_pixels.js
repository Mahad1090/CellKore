const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const y = 110;
    console.log(`Sampling Row ${y} every 20 pixels...`);
    for (let x = 0; x < info.width; x += 20) {
        const offset = (y * info.width + x) * info.channels;
        console.log(`x = ${x} -> RGB(${data[offset]}, ${data[offset+1]}, ${data[offset+2]})`);
    }
}
run();
