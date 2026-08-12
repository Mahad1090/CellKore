const sharp = require('sharp');
const path = require('path');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imgFile = path.join(brainDir, 'media__1786529832227.png');

async function check() {
    const meta = await sharp(imgFile).metadata();
    console.log(`Samsung Screenshot: ${meta.width}x${meta.height}`);
}

check();
