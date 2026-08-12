const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Tailored crop ranges to extract ONLY the device itself (excluding any card outlines)
    const columns = [
        { left: 34, width: 136 },
        { left: 214, width: 112 },
        { left: 366, width: 126 },
        { left: 543, width: 108 },
        { left: 711, width: 118 },
        { left: 873, width: 98 }
    ];
    
    const rowTops = [65, 210, 355];
    const rowHeight = 86;
    
    const tests = [
        { name: 'test_mac_0.png', left: columns[0].left, top: rowTops[0], width: columns[0].width, height: rowHeight },
        { name: 'test_mac_2.png', left: columns[2].left, top: rowTops[0], width: columns[2].width, height: rowHeight },
        { name: 'test_mac_7.png', left: columns[1].left, top: rowTops[1], width: columns[1].width, height: rowHeight },
        { name: 'test_mac_16.png', left: columns[4].left, top: rowTops[2], width: columns[4].width, height: rowHeight }
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
