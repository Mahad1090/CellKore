const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';

async function scan() {
    const testDir = path.join(__dirname, '..', 'public', 'test_crops_scan');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    // Let's test crop a few cells of media__1786522707078.png (1024x454)
    // and media__1786521951084.png (1024x425)
    // to see if they contain the iPhone 17 and 16 model cards
    try {
        const file1 = path.join(brainDir, 'media__1786522707078.png');
        if (fs.existsSync(file1)) {
            await sharp(file1).clone()
                .extract({ left: 30, top: 40, width: 200, height: 120 })
                .toFile(path.join(testDir, 'file1_r1_c1.png'));
            console.log('file1 test crop created');
        }
    } catch (e) {
        console.log('file1 error:', e.message);
    }

    try {
        const file2 = path.join(brainDir, 'media__1786521951084.png');
        if (fs.existsSync(file2)) {
            await sharp(file2).clone()
                .extract({ left: 30, top: 40, width: 200, height: 120 })
                .toFile(path.join(testDir, 'file2_r1_c1.png'));
            console.log('file2 test crop created');
        }
    } catch (e) {
        console.log('file2 error:', e.message);
    }
    
    try {
        const file3 = path.join(brainDir, 'media__1786522448780.png');
        if (fs.existsSync(file3)) {
            await sharp(file3).clone()
                .extract({ left: 30, top: 40, width: 200, height: 120 })
                .toFile(path.join(testDir, 'file3_r1_c1.png'));
            console.log('file3 test crop created');
        }
    } catch (e) {
        console.log('file3 error:', e.message);
    }
}

scan();
