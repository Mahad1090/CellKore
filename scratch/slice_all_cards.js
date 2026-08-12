const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const cards = [
    // Row 0
    { label: 'iPad Pro 7 - 13" (M4)', filename: 'ipad_pro_7_13_m4.png', left: 22, width: 202, top: 13, height: 111 },
    { label: 'iPad Pro 7 - 11" (M4)', filename: 'ipad_pro_7_11_m4.png', left: 241, width: 195, top: 13, height: 111 },
    { label: 'iPad Air 7 - 13" (M3)', filename: 'ipad_air_7_13_m3.png', left: 453, width: 223, top: 13, height: 111 },
    { label: 'iPad Air 7 - 11" (M3)', filename: 'ipad_air_7_11_m3.png', left: 692, width: 211, top: 13, height: 111 },
    
    // Row 1
    { label: 'iPad Pro 6 - 12.9" (M2)', filename: 'ipad_pro_6_129_m2.png', left: 22, width: 202, top: 149, height: 122 },
    { label: 'iPad Pro 6 - 11" (M2)', filename: 'ipad_pro_6_11_m2.png', left: 241, width: 195, top: 149, height: 122 },
    { label: 'iPad Air 6 - 13" (M2)', filename: 'ipad_air_6_13_m2.png', left: 453, width: 223, top: 149, height: 122 },
    { label: 'iPad Air 6 - 11" (M2)', filename: 'ipad_air_6_11_m2.png', left: 692, width: 211, top: 149, height: 122 },
    
    // Row 2
    { label: 'iPad Pro 5 - 12.9" (M1)', filename: 'ipad_pro_5_129_m1.png', left: 22, width: 202, top: 285, height: 118 },
    { label: 'iPad Pro 5 - 11" (M1)', filename: 'ipad_pro_5_11_m1.png', left: 241, width: 195, top: 285, height: 118 },
    { label: 'iPad Air 5 - 10.9" (M1)', filename: 'ipad_air_5_109_m1.png', left: 453, width: 223, top: 285, height: 118 },
    { label: 'iPad Air 4 - 10.9" (A14)', filename: 'ipad_air_4_109_a14.png', left: 692, width: 211, top: 285, height: 118 },
    
    // Row 3
    { label: 'iPad 10th gen - 10.9"', filename: 'ipad_10th_gen_109.png', left: 22, width: 202, top: 416, height: 103 },
    { label: 'iPad 9th gen - 10.2"', filename: 'ipad_9th_gen_102.png', left: 241, width: 195, top: 416, height: 103 },
    { label: 'iPad 8th gen - 10.2"', filename: 'ipad_8th_gen_102.png', left: 453, width: 223, top: 416, height: 103 },
    { label: 'iPad 7th gen - 10.2"', filename: 'ipad_7th_gen_102.png', left: 692, width: 211, top: 416, height: 103 },
    
    // Row 4
    { label: 'iPad 6th gen - 9.7"', filename: 'ipad_6th_gen_97.png', left: 22, width: 113, top: 544, height: 106 },
    { label: 'iPad 5th gen - 9.7"', filename: 'ipad_5th_gen_97.png', left: 149, width: 110, top: 544, height: 106 },
    { label: 'iPad mini 6 - 8.3"', filename: 'ipad_mini_6_83.png', left: 274, width: 115, top: 544, height: 106 },
    { label: 'iPad mini 5 - 7.9"', filename: 'ipad_mini_5_79.png', left: 405, width: 107, top: 544, height: 106 },
    { label: 'iPad mini 4 - 7.9"', filename: 'ipad_mini_4_79.png', left: 527, width: 106, top: 544, height: 106 },
    { label: 'iPad mini 3 - 7.9"', filename: 'ipad_mini_3_79.png', left: 647, width: 110, top: 544, height: 106 },
    { label: 'iPad mini 2 - 7.9"', filename: 'ipad_mini_2_79.png', left: 772, width: 111, top: 544, height: 106 },
    { label: 'iPad mini 1 - 7.9"', filename: 'ipad_mini_1_79.png', left: 898, width: 111, top: 544, height: 106 }
];

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786545363906.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    console.log(`Starting grid slice for ${cards.length} iPad cards...`);
    
    for (const c of cards) {
        try {
            // Trim borders: crop 3 pixels inside left/right, and 3 pixels inside top/bottom
            const cropLeft = c.left + 3;
            const cropWidth = c.width - 6;
            const cropTop = c.top + 3;
            const cropHeight = c.height - 6;
            
            const cropBuf = await sharp(src)
                .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
                .toBuffer();
                
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
                    input: await sharp(cropBuf)
                        .resize({
                            width: 178,
                            height: 100,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .png()
                        .toBuffer(),
                    left: 10,
                    top: 5
                }
            ])
            .png()
            .toFile(path.join(publicDir, c.filename));
            
            console.log(`  Saved: public/${c.filename} for "${c.label}"`);
        } catch(e) {
            console.error(`  Error slicing ${c.filename}:`, e.message);
        }
    }
    
    console.log('Finished grid slice for all iPad cards!');
}

run();
