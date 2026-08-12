const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';

async function scan() {
    const files = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') && f.endsWith('.png'));
    for (const file of files) {
        const fullPath = path.join(brainDir, file);
        try {
            const metadata = await sharp(fullPath).metadata();
            console.log(`${file}: ${metadata.width}x${metadata.height}`);
        } catch (e) {
            console.log(`${file}: failed to read - ${e.message}`);
        }
    }
}

scan();
