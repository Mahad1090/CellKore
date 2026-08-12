const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const screenshot175 = path.join(brainDir, 'media__1786525050175.png'); // Has iPhone 11 (Row 2, Col 4)
const screenshot314 = path.join(brainDir, 'media__1786525249314.png'); // Has iPhone X (Row 2, Col 4)

async function cropDirect() {
    const publicDir = path.join(__dirname, '..', 'public');

    // 1. Fix iPhone 11
    // iPhone 11 card is at left: 745, top: 418, width: 198, height: 110 in media__1786525050175.png.
    // The blue front screen starts around x=155.
    // We crop left: 745 + 15, top: 418 + 5, width: 140, height: 100 to get only back views.
    try {
        const dest11 = path.join(publicDir, 'iphone_11_group.png');
        await sharp(screenshot175)
            .extract({ left: 760, top: 423, width: 140, height: 100 })
            .png()
            .toFile(dest11);
        console.log('iPhone 11 group image successfully cropped to back views (direct crop)!');
    } catch (e) {
        console.error('Error cropping iPhone 11:', e.message);
    }

    // 2. Fix iPhone X
    // iPhone X card is at left: 745, top: 242, width: 198, height: 110 in media__1786525249314.png.
    // We crop:
    // - Space Gray back: left 745 + 24 = 769, top 242 + 10 = 252, width 32, height 90
    // - White back: left 745 + 98 = 843, top 242 + 10 = 252, width 32, height 90
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
        await sharp({
            create: {
                width: 75,
                height: 90,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: sgBuf, left: 5, top: 0 },
            { input: whiteBuf, left: 38, top: 0 }
        ])
        .png()
        .toFile(destX);

        console.log('iPhone X group image successfully merged back views (direct crop)!');
    } catch (e) {
        console.error('Error cropping iPhone X:', e.message);
    }
}

cropDirect();
