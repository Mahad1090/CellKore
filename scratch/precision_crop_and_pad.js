const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const screenshot175 = path.join(brainDir, 'media__1786525050175.png'); // Has iPhone 11 (Row 2, Col 4)
const screenshot314 = path.join(brainDir, 'media__1786525249314.png'); // Has iPhone X (Row 2, Col 4)

async function cleanCropAndPad() {
    const publicDir = path.join(__dirname, '..', 'public');

    // 1. iPhone 11
    try {
        const elevenCropBuf = await sharp(screenshot175)
            .extract({ left: 760, top: 423, width: 140, height: 100 })
            .png()
            .toBuffer();

        const dest11 = path.join(publicDir, 'iphone_11_group.png');
        if (fs.existsSync(dest11)) {
            fs.unlinkSync(dest11);
        }

        await sharp({
            create: {
                width: 198,
                height: 110,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: elevenCropBuf, left: 29, top: 5 }
        ])
        .png()
        .toFile(dest11);

        console.log('iPhone 11 group successfully cropped, padded, and saved!');
    } catch (e) {
        console.error('Error cropping/padding iPhone 11:', e.message);
    }

    // 2. iPhone X
    try {
        const sgBuf = await sharp(screenshot314)
            .extract({ left: 769, top: 252, width: 32, height: 90 })
            .png()
            .toBuffer();

        const whiteBuf = await sharp(screenshot314)
            .extract({ left: 843, top: 252, width: 32, height: 90 })
            .png()
            .toBuffer();

        const destX = path.join(publicDir, 'iphone_x_group.png');
        if (fs.existsSync(destX)) {
            fs.unlinkSync(destX);
        }

        await sharp({
            create: {
                width: 198,
                height: 110,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: sgBuf, left: 61, top: 10 },
            { input: whiteBuf, left: 94, top: 10 }
        ])
        .png()
        .toFile(destX);

        console.log('iPhone X group successfully cropped, merged, padded, and saved!');
    } catch (e) {
        console.error('Error cropping/padding iPhone X:', e.message);
    }
}

cleanCropAndPad();
