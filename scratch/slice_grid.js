const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imageFile = path.join(brainDir, 'media__1786525249314.png');

const crops = [
    // Row 1
    { name: 'iphone_12_mini_group.png', rect: { left: 45, top: 55, width: 198, height: 110 } },
    { name: 'iphone_11_pro_max_group.png', rect: { left: 278, top: 55, width: 198, height: 110 } },
    { name: 'iphone_11_pro_group.png', rect: { left: 512, top: 55, width: 198, height: 110 } },
    { name: 'iphone_11_group.png', rect: { left: 745, top: 55, width: 198, height: 110 } },

    // Row 2
    { name: 'iphone_xr_group.png', rect: { left: 45, top: 242, width: 198, height: 110 } },
    { name: 'iphone_xs_max_group.png', rect: { left: 278, top: 242, width: 198, height: 110 } },
    { name: 'iphone_xs_group.png', rect: { left: 512, top: 242, width: 198, height: 110 } },
    { name: 'iphone_x_group.png', rect: { left: 745, top: 242, width: 198, height: 110 } },

    // Row 3
    { name: 'iphone_8_plus_group.png', rect: { left: 45, top: 428, width: 198, height: 110 } },
    { name: 'iphone_8_group.png', rect: { left: 278, top: 428, width: 198, height: 110 } },
    { name: 'iphone_se_group.png', rect: { left: 512, top: 428, width: 198, height: 110 } }
];

async function runCrop() {
    const publicDir = path.join(__dirname, '..', 'public');
    const img = sharp(imageFile);

    for (const crop of crops) {
        const destPath = path.join(publicDir, crop.name);
        try {
            await img.clone()
                .extract(crop.rect)
                .toFile(destPath);
            console.log(`Cropped and saved: ${crop.name}`);
        } catch (e) {
            console.error(`Failed to crop ${crop.name}:`, e.message);
        }
    }
}

runCrop();
