const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Grid layout parameters based on border scans
const rowDefinitions = [
    { top: 9, height: 92 },
    { top: 147, height: 92 },
    { top: 285, height: 85 },
    { top: 414, height: 76 },
    { top: 536, height: 60 },
    { top: 635, height: 65 },
    { top: 739, height: 62 },
    { top: 840, height: 58 },
    { top: 935, height: 49 }
];

const colDefinitions = [
    { left: 22, width: 105 },
    { left: 154, width: 100 },
    { left: 281, width: 96 },
    { left: 405, width: 118 },
    { left: 551, width: 103 }
];

const samsungModels = [
    // Row 0
    { label: 'Galaxy S25 Ultra', filename: 'samsung_s25_ultra.png', r: 0, c: 0 },
    { label: 'Galaxy S25+', filename: 'samsung_s25_plus.png', r: 0, c: 1 },
    { label: 'Galaxy S25', filename: 'samsung_s25.png', r: 0, c: 2 },
    { label: 'Galaxy Z Fold6', filename: 'samsung_z_fold6.png', r: 0, c: 3 },
    { label: 'Galaxy Z Flip6', filename: 'samsung_z_flip6.png', r: 0, c: 4 },

    // Row 1
    { label: 'Galaxy S24 Ultra', filename: 'samsung_s24_ultra.png', r: 1, c: 0 },
    { label: 'Galaxy S24+', filename: 'samsung_s24_plus.png', r: 1, c: 1 },
    { label: 'Galaxy S24', filename: 'samsung_s24.png', r: 1, c: 2 },
    { label: 'Galaxy Z Fold5', filename: 'samsung_z_fold5.png', r: 1, c: 3 },
    { label: 'Galaxy Z Flip5', filename: 'samsung_z_flip5.png', r: 1, c: 4 },

    // Row 2
    { label: 'Galaxy S23 Ultra', filename: 'samsung_s23_ultra.png', r: 2, c: 0 },
    { label: 'Galaxy S23+', filename: 'samsung_s23_plus.png', r: 2, c: 1 },
    { label: 'Galaxy S23', filename: 'samsung_s23.png', r: 2, c: 2 },
    { label: 'Galaxy Z Fold4', filename: 'samsung_z_fold4.png', r: 2, c: 3 },
    { label: 'Galaxy Z Flip4', filename: 'samsung_z_flip4.png', r: 2, c: 4 },

    // Row 3
    { label: 'Galaxy S22 Ultra', filename: 'samsung_s22_ultra.png', r: 3, c: 0 },
    { label: 'Galaxy S22+', filename: 'samsung_s22_plus.png', r: 3, c: 1 },
    { label: 'Galaxy S22', filename: 'samsung_s22.png', r: 3, c: 2 },
    { label: 'Galaxy Z Fold3', filename: 'samsung_z_fold3.png', r: 3, c: 3 },
    { label: 'Galaxy Z Flip3', filename: 'samsung_z_flip3.png', r: 3, c: 4 },

    // Row 4
    { label: 'Galaxy S21 Ultra', filename: 'samsung_s21_ultra.png', r: 4, c: 0 },
    { label: 'Galaxy S21+', filename: 'samsung_s21_plus.png', r: 4, c: 1 },
    { label: 'Galaxy S21', filename: 'samsung_s21.png', r: 4, c: 2 },
    { label: 'Galaxy Z Fold2', filename: 'samsung_z_fold2.png', r: 4, c: 3 },
    { label: 'Galaxy Z Flip', filename: 'samsung_z_flip.png', r: 4, c: 4 },

    // Row 5
    { label: 'Galaxy S20 Ultra', filename: 'samsung_s20_ultra.png', r: 5, c: 0 },
    { label: 'Galaxy S20+', filename: 'samsung_s20_plus.png', r: 5, c: 1 },
    { label: 'Galaxy S20', filename: 'samsung_s20.png', r: 5, c: 2 },
    { label: 'Galaxy Note20 Ultra', filename: 'samsung_note20_ultra.png', r: 5, c: 3 },
    { label: 'Galaxy Note20', filename: 'samsung_note20.png', r: 5, c: 4 },

    // Row 6
    { label: 'Galaxy S10+', filename: 'samsung_s10_plus.png', r: 6, c: 0 },
    { label: 'Galaxy S10', filename: 'samsung_s10.png', r: 6, c: 1 },
    { label: 'Galaxy S10e', filename: 'samsung_s10e.png', r: 6, c: 2 },
    { label: 'Galaxy Note10+', filename: 'samsung_note10_plus.png', r: 6, c: 3 },
    { label: 'Galaxy Note10', filename: 'samsung_note10.png', r: 6, c: 4 },

    // Row 7
    { label: 'Galaxy S9+', filename: 'samsung_s9_plus.png', r: 7, c: 0 },
    { label: 'Galaxy S9', filename: 'samsung_s9.png', r: 7, c: 1 },
    { label: 'Galaxy Note9', filename: 'samsung_note9.png', r: 7, c: 2 },
    { label: 'Galaxy S8+', filename: 'samsung_s8_plus.png', r: 7, c: 3 },
    { label: 'Galaxy S8', filename: 'samsung_s8.png', r: 7, c: 4 },

    // Row 8
    { label: 'Galaxy Note8', filename: 'samsung_note8.png', r: 8, c: 0 },
    { label: 'Galaxy S7 Edge', filename: 'samsung_s7_edge.png', r: 8, c: 1 },
    { label: 'Galaxy S7', filename: 'samsung_s7.png', r: 8, c: 2 },
    { label: 'Galaxy A54 5G', filename: 'samsung_a54_5g.png', r: 8, c: 3 },
    { label: 'Galaxy A34 5G', filename: 'samsung_a34_5g.png', r: 8, c: 4 }
];

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546104120.png';
    const publicDir = path.join(__dirname, '..', 'public');

    console.log(`Starting grid slice for ${samsungModels.length} Samsung cards...`);

    for (const m of samsungModels) {
        try {
            const row = rowDefinitions[m.r];
            const col = colDefinitions[m.c];

            // Safety trimming of card borders (inset of 3 pixels)
            const cropLeft = col.left + 3;
            const cropWidth = col.width - 6;
            const cropTop = row.top + 3;
            const cropHeight = row.height - 6;

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
            .toFile(path.join(publicDir, m.filename));

            console.log(`  Saved: public/${m.filename} for "${m.label}"`);
        } catch (e) {
            console.error(`  Error slicing ${m.filename}:`, e.message);
        }
    }

    console.log('Finished grid slice for all Samsung cards!');
}

run();
