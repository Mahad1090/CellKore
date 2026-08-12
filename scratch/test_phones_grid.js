const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testPhonesCrop() {
    const testDir = path.join(__dirname, '..', 'public', 'scan_test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const imageFile = 'public/phones.png';
    try {
        const meta = await sharp(imageFile).metadata();
        console.log(`phones.png dimensions: ${meta.width}x${meta.height}`);
        
        // Let's crop a 4x4 grid of 250x250 squares to see what is inside phones.png!
        const size = Math.floor(meta.width / 4);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                await sharp(imageFile).clone()
                    .extract({
                        left: col * size,
                        top: row * size,
                        width: size,
                        height: size
                    })
                    .toFile(path.join(testDir, `phones_crop_r${row}_c${col}.png`));
            }
        }
        console.log('Grid crops of phones.png created in public/scan_test/');
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testPhonesCrop();
