const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact device-only coordinates (excluding card outline borders entirely)
const columns = [
    { left: 33, width: 142 },  // Col 0: MacBook Pro 16"
    { left: 213, width: 114 }, // Col 1: MacBook Pro 14"
    { left: 365, width: 129 }, // Col 2: MacBook Pro 16"
    { left: 542, width: 111 }, // Col 3: MacBook Pro 14"
    { left: 710, width: 121 }, // Col 4: MacBook Air 15"
    { left: 872, width: 101 }  // Col 5: MacBook Air 13" / 12"
];

const rowTops = [65, 210, 355];
const rowHeight = 86;

const macbooks = [
    // Row 0
    { label: 'MacBook Pro 16" (2024)', filename: 'macbook_pro_16_2024.png', r: 0, c: 0 },
    { label: 'MacBook Pro 14" (2024)', filename: 'macbook_pro_14_2024.png', r: 0, c: 1 },
    { label: 'MacBook Pro 16" (2023)', filename: 'macbook_pro_16_2023.png', r: 0, c: 2 },
    { label: 'MacBook Pro 14" (2023)', filename: 'macbook_pro_14_2023.png', r: 0, c: 3 },
    { label: 'MacBook Air 15" (2024)', filename: 'macbook_air_15_2024.png', r: 0, c: 4 },
    { label: 'MacBook Air 13" (2024)', filename: 'macbook_air_13_2024.png', r: 0, c: 5 },

    // Row 1
    { label: 'MacBook Pro 16" (2021)', filename: 'macbook_pro_16_2021.png', r: 1, c: 0 },
    { label: 'MacBook Pro 14" (2021)', filename: 'macbook_pro_14_2021.png', r: 1, c: 1 },
    { label: 'MacBook Air 13" (2022)', filename: 'macbook_air_13_2022.png', r: 1, c: 2 },
    { label: 'MacBook Pro 13" (2022)', filename: 'macbook_pro_13_2022.png', r: 1, c: 3 },
    { label: 'MacBook Air 13" (2020)', filename: 'macbook_air_13_2020.png', r: 1, c: 4 },
    { label: 'MacBook Pro 13" (2020)', filename: 'macbook_pro_13_2020.png', r: 1, c: 5 },

    // Row 2
    { label: 'MacBook Pro 16" (2019)', filename: 'macbook_pro_16_2019.png', r: 2, c: 0 },
    { label: 'MacBook Pro 15" (2019)', filename: 'macbook_pro_15_2019.png', r: 2, c: 1 },
    { label: 'MacBook Pro 13" (2019)', filename: 'macbook_pro_13_2019.png', r: 2, c: 2 },
    { label: 'MacBook Air 13" (2018)', filename: 'macbook_air_13_2018.png', r: 2, c: 3 },
    { label: 'MacBook 12" (2017)', filename: 'macbook_12_2017.png', r: 2, c: 4 },
    { label: 'MacBook 12" (2016)', filename: 'macbook_12_2016.png', r: 2, c: 5 }
];

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    console.log(`Starting device-only grid slice for ${macbooks.length} MacBook cards...`);

    for (const m of macbooks) {
        try {
            const col = columns[m.c];
            const cropTop = rowTops[m.r];

            const cropBuf = await sharp(src)
                .extract({ left: col.left, top: cropTop, width: col.width, height: rowHeight })
                .toBuffer();

            // Place centered inside standard 198x110 white canvas cell
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
            .toFile(path.join(publicDir, m.filename));

            console.log(`  Saved: public/${m.filename} for "${m.label}"`);
        } catch (e) {
            console.error(`  Error slicing ${m.filename}:`, e.message);
        }
    }

    console.log('Finished device-only grid slice for all MacBook cards!');
}

run();
