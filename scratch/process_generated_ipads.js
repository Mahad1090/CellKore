const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const mappings = [
    { source: 'ipad_pro_m4_back_group_1786544914234.png', dest: 'ipad_pro_group_back.png' },
    { source: 'ipad_air_group_back_1786544938808.png', dest: 'ipad_air_group_back.png' },
    { source: 'ipad_standard_group_back_1786544965416.png', dest: 'ipad_standard_group_back.png' },
    { source: 'ipad_mini_group_back_1786544988126.png', dest: 'ipad_mini_group_back.png' }
];

async function run() {
    const artifactDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
    const publicDir = path.join(__dirname, '..', 'public');
    
    console.log('Processing generated iPad group images...');
    
    for (const item of mappings) {
        const srcPath = path.join(artifactDir, item.source);
        const destPath = path.join(publicDir, item.dest);
        
        try {
            if (!fs.existsSync(srcPath)) {
                console.error(`Source file not found: ${srcPath}`);
                continue;
            }
            
            // Read generated image, resize, and composite onto a clean 198x110 white canvas
            await sharp({
                create: {
                    width: 198,
                    height: 110,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            })
            .composite([
                {
                    input: await sharp(srcPath)
                        .resize({
                            width: 165,
                            height: 98,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .png()
                        .toBuffer(),
                    left: 16,
                    top: 6
                }
            ])
            .png()
            .toFile(destPath);
            
            console.log(`  Saved processed image: public/${item.dest}`);
        } catch(e) {
            console.error(`  Error processing ${item.dest}:`, e.message);
        }
    }
    
    console.log('Finished processing generated iPad images!');
}

run();
