const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';

const files = [
    'media__1786521951084.png',
    'media__1786522448780.png',
    'media__1786522707078.png',
    'media__1786523346475.png',
    'media__1786523850125.png',
    'media__1786524317970.png',
    'media__1786524746873.png'
];

async function scan() {
    const testDir = path.join(__dirname, '..', 'public', 'scan_test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    for (const f of files) {
        const fullPath = path.join(brainDir, f);
        if (fs.existsSync(fullPath)) {
            try {
                // Let's crop a small square in the middle to identify
                const meta = await sharp(fullPath).metadata();
                await sharp(fullPath)
                    .clone()
                    .extract({ left: Math.floor(meta.width/2) - 100, top: Math.floor(meta.height/2) - 100, width: 200, height: 200 })
                    .toFile(path.join(testDir, `center_${f}`));
                console.log(`Cropped center of ${f}`);
            } catch (e) {
                console.log(`Error on ${f}:`, e.message);
            }
        }
    }
}

scan();
