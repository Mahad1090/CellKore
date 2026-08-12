const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    // We try different left offsets and widths for Card 0 (Row 0, Col 0)
    // to see which one fully encloses the MacBook Pro 16"
    const trials = [
        { name: 'try_mac_left_15_w150.png', left: 15, width: 150 },
        { name: 'try_mac_left_20_w150.png', left: 20, width: 150 },
        { name: 'try_mac_left_25_w150.png', left: 25, width: 150 },
        { name: 'try_mac_left_20_w160.png', left: 20, width: 160 },
        { name: 'try_mac_left_15_w160.png', left: 15, width: 160 }
    ];
    
    for (const t of trials) {
        try {
            const cropBuf = await sharp(src)
                .extract({ left: t.left, top: 75, width: t.width, height: 85 })
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
                            height: 98,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .png()
                        .toBuffer(),
                    left: 10,
                    top: 6
                }
            ])
            .png()
            .toFile(path.join(publicDir, t.name));
            
            console.log(`Saved: public/${t.name}`);
        } catch(e) {
            console.error(`Error on ${t.name}:`, e.message);
        }
    }
}
run();
