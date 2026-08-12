const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

async function padImages() {
    // 1. Pad iPhone 11 (width 140, height 100) to 198x110
    try {
        const file11 = path.join(publicDir, 'iphone_11_group.png');
        const buf11 = fs.readFileSync(file11);
        
        await sharp({
            create: {
                width: 198,
                height: 110,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: buf11, left: 29, top: 5 } // Centered: left = (198-140)/2 = 29, top = (110-100)/2 = 5
        ])
        .png()
        .toFile(file11, { overwrite: true });

        console.log('iPhone 11 group padded to standard 198x110!');
    } catch (e) {
        console.error('Error padding iPhone 11:', e.message);
    }

    // 2. Pad iPhone X (width 75, height 90) to 198x110
    try {
        const fileX = path.join(publicDir, 'iphone_x_group.png');
        const bufX = fs.readFileSync(fileX);

        await sharp({
            create: {
                width: 198,
                height: 110,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: bufX, left: 61, top: 10 } // Centered: left = (198-75)/2 = 61, top = (110-90)/2 = 10
        ])
        .png()
        .toFile(fileX, { overwrite: true });

        console.log('iPhone X group padded to standard 198x110!');
    } catch (e) {
        console.error('Error padding iPhone X:', e.message);
    }
}

padImages();
