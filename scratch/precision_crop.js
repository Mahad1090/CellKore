const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const screenshot175 = path.join(brainDir, 'media__1786525050175.png'); // Has iPhone 11 (Row 2, Col 4)
const screenshot314 = path.join(brainDir, 'media__1786525249314.png'); // Has iPhone X (Row 2, Col 4)

async function debugAndFix() {
    const publicDir = path.join(__dirname, '..', 'public');

    // --- FIX IPHONE 11 ---
    // Crop Row 2, Col 4 from media__1786525050175.png (original iPhone 11 card area: left 745, top 418, width 198, height 110)
    try {
        const raw11 = sharp(screenshot175).clone().extract({ left: 745, top: 418, width: 198, height: 110 });
        const { data, info } = await raw11.raw().toBuffer({ resolveWithObject: true });
        
        // Scan columns from right to left to find where the white background before the front screen is
        // The rightmost phone (blue front screen) sits on the right. Let's find its left edge.
        // We look for columns that are mostly white separating the white back (6th phone) and the front screen (7th phone)
        // Let's print column intensities
        const colIntensity = [];
        for (let x = 0; x < info.width; x++) {
            let sum = 0;
            for (let y = 0; y < info.height; y++) {
                const idx = (y * info.width + x) * 4;
                sum += (data[idx] + data[idx+1] + data[idx+2]) / 3;
            }
            colIntensity.push(sum / info.height);
        }

        // Print column intensities around the right side to find the split
        console.log('iPhone 11 col intensities (120-198):', colIntensity.slice(120, 198).map(v => Math.round(v)));

        // Looking at typical layouts, the front screen phone on the far right starts around x=155.
        // Let's crop from x=15 to x=150 to get a perfect group of only back views (black, green, yellow, purple, red, white)
        await raw11.clone()
            .extract({ left: 15, top: 5, width: 135, height: 100 })
            .toFile(path.join(publicDir, 'iphone_11_group.png'));
        
        console.log('iPhone 11 group image successfully recreated and cropped.');
    } catch (e) {
        console.error('Error fixing iPhone 11:', e.message);
    }

    // --- FIX IPHONE X ---
    // Crop Row 2, Col 4 from media__1786525249314.png (original iPhone X card area: left 745, top 242, width 198, height 110)
    try {
        const rawX = sharp(screenshot314).clone().extract({ left: 745, top: 242, width: 198, height: 110 });
        const { data, info } = await rawX.raw().toBuffer({ resolveWithObject: true });

        // Let's measure columns to find:
        // Phone 1 (Space Gray back): ~x=20 to x=60
        // Phone 2 (Green screen): ~x=60 to x=100
        // Phone 3 (White back): ~x=100 to x=140
        // Phone 4 (Pink screen): ~x=140 to x=180
        const colIntensity = [];
        for (let x = 0; x < info.width; x++) {
            let sum = 0;
            for (let y = 0; y < info.height; y++) {
                const idx = (y * info.width + x) * 4;
                sum += (data[idx] + data[idx+1] + data[idx+2]) / 3;
            }
            colIntensity.push(sum / info.height);
        }

        console.log('iPhone X col intensities (0-198):', colIntensity.map(v => Math.round(v)));

        // Crop Space Gray back: left 24, width 32, top 10, height 90
        const sgBuf = await rawX.clone()
            .extract({ left: 24, top: 10, width: 32, height: 90 })
            .toBuffer();

        // Crop White back: left 98, width 32, top 10, height 90
        const whiteBuf = await rawX.clone()
            .extract({ left: 98, top: 10, width: 32, height: 90 })
            .toBuffer();

        // Merge onto a clean white canvas
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
        .toFile(path.join(publicDir, 'iphone_x_group.png'));

        console.log('iPhone X group image successfully recreated and merged.');
    } catch (e) {
        console.error('Error fixing iPhone X:', e.message);
    }
}

debugAndFix();
