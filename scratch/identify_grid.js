const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786545363906.png';
    try {
        const meta = await sharp(src).metadata();
        console.log(`Dimensions: ${meta.width} x ${meta.height}`);
    } catch(e) {
        console.error(e.message);
    }
}
run();
