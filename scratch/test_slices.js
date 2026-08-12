const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786545363906.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    const tests = [
        { name: 'test_slice_0.png', left: 20 + 9, top: 18 + 5, width: 220, height: 80 },
        { name: 'test_slice_6.png', left: 20 + 2 * 248 + 9, top: 18 + 1 * 135 + 5, width: 220, height: 80 },
        { name: 'test_slice_12.png', left: 20 + 9, top: 18 + 3 * 135 + 5, width: 220, height: 80 },
        { name: 'test_slice_20.png', left: 20 + 2 * 124 + 7, top: 558 + 5, width: 100, height: 65 }
    ];
    
    for (const t of tests) {
        try {
            const cropBuf = await sharp(src)
                .extract({ left: t.left, top: t.top, width: t.width, height: t.height })
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
