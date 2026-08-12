const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imageFile = path.join(brainDir, 'media__1786525249314.png');

async function segment() {
    const img = sharp(imageFile);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;

    // Projection profiles
    const rowWhite = [];
    const colWhite = [];

    // Analyze rows
    for (let y = 0; y < height; y++) {
        let whiteCount = 0;
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            // Threshold for white
            if (r > 248 && g > 248 && b > 248) {
                whiteCount++;
            }
        }
        rowWhite.push(whiteCount / width);
    }

    // Analyze columns
    for (let x = 0; x < width; x++) {
        let whiteCount = 0;
        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            if (r > 248 && g > 248 && b > 248) {
                whiteCount++;
            }
        }
        colWhite.push(whiteCount / height);
    }

    console.log('Row white profile (first 20):', rowWhite.slice(0, 50).map(v => v.toFixed(2)));
    console.log('Col white profile (first 20):', colWhite.slice(0, 50).map(v => v.toFixed(2)));
}

segment();
