const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imageFile = path.join(brainDir, 'media__1786524317970.png');

async function testCrop() {
    const testDir = path.join(__dirname, '..', 'public', 'scan_test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    try {
        const meta = await sharp(imageFile).metadata();
        console.log(`media__1786524317970.png dimensions: ${meta.width}x${meta.height}`);
        
        // Let's crop 4 cells from row 1 to see if they are iPhone 17 models!
        await sharp(imageFile).clone()
            .extract({ left: 30, top: 40, width: 200, height: 120 })
            .toFile(path.join(testDir, '17_r1_c1.png'));

        await sharp(imageFile).clone()
            .extract({ left: 270, top: 40, width: 200, height: 120 })
            .toFile(path.join(testDir, '17_r1_c2.png'));

        await sharp(imageFile).clone()
            .extract({ left: 500, top: 40, width: 200, height: 120 })
            .toFile(path.join(testDir, '17_r1_c3.png'));

        await sharp(imageFile).clone()
            .extract({ left: 730, top: 40, width: 200, height: 120 })
            .toFile(path.join(testDir, '17_r1_c4.png'));

        console.log('iPhone 17 test crops created in public/scan_test/');
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testCrop();
