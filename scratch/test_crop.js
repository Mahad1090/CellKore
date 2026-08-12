const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imageFile = path.join(brainDir, 'media__1786525249314.png');

async function testCrop() {
    // Let's create a temporary directory inside public to test and see crops
    const testDir = path.join(__dirname, '..', 'public', 'test_crops');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const img = sharp(imageFile);
    const metadata = await img.metadata();
    console.log(`Original Image metadata:`, metadata);

    // Let's write a script that does a grid crop based on estimated coordinates
    // Col width ~ 240, height ~ 180, margins ~ 10
    // Let's test a slice of row 1, col 1
    await img.clone()
        .extract({ left: 30, top: 40, width: 200, height: 120 })
        .toFile(path.join(testDir, 'r1_c1.png'));

    await img.clone()
        .extract({ left: 270, top: 40, width: 200, height: 120 })
        .toFile(path.join(testDir, 'r1_c2.png'));

    console.log('Test crops created in public/test_crops/');
}

testCrop();
