const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const items = [
    // Samsung Note / Fold / Flip
    { label: 'Galaxy Note 20 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/09/Samsung-Galaxy-Note-20-Ultra-5G.jpg', filename: 'samsung_note20_ultra.png', cropLeft: true },
    { label: 'Galaxy Note 20', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/09/Samsung-Galaxy-Note-20-5G-1.jpg', filename: 'samsung_note20.png', cropLeft: true },
    { label: 'Galaxy Z Fold6', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/08/Samsung-Galaxy-Z-Fold6.jpg', filename: 'samsung_z_fold6.png', cropLeft: true },
    { label: 'Galaxy Z Fold5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/08/Galaxy-Z-Fold5.jpg', filename: 'samsung_z_fold5.png', cropLeft: true },
    { label: 'Galaxy Z Flip6', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/08/Samsung-Galaxy-Z-Flip6.jpg', filename: 'samsung_z_flip6.png', cropLeft: true },
    { label: 'Galaxy Z Flip5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/08/Galaxy-Z-Flip5.jpg', filename: 'samsung_z_flip5.png', cropLeft: true },

    // iPads
    { label: 'iPad Pro (M4)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-13-inch-iPad-Pro-Standard-Glass.jpg', filename: 'ipad_pro_m4.png', cropLeft: true },
    { label: 'iPad Pro (M2)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-12.922-6th-Gen.jpg', filename: 'ipad_pro_m2.png', cropLeft: true },
    { label: 'iPad Air (M2)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-iPad-Air-13-inch-M2.jpg', filename: 'ipad_air_m2.png', cropLeft: true },
    { label: 'iPad (10th Gen)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-10th-Gen.jpg', filename: 'ipad_10th_gen.png', cropLeft: true },
    { label: 'iPad mini (6th Gen)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/10/iPad-mini-6.jpg', filename: 'ipad_mini_6th_gen.png', cropLeft: true },

    // MacBooks
    { label: 'MacBook Pro (M3)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/02/MacBook-Pro-16-inch-Nov-2023.jpg', filename: 'macbook_pro_m3.png', cropLeft: false },
    { label: 'MacBook Pro (M2)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/05/MacBook-Pro-13-inch-2022-1.jpg', filename: 'macbook_pro_m2.png', cropLeft: false },
    { label: 'MacBook Air (M3)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/MacBook-Air-15-inch-2024-1.jpg', filename: 'macbook_air_m3.png', cropLeft: false },
    { label: 'MacBook Air (M2)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/08/MacBook-Air-13-inch-2022.jpg', filename: 'macbook_air_m2.png', cropLeft: false },

    // Watches
    { label: 'Apple Watch Ultra 2', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/09/Apple-Watch-Ultra-2.jpg', filename: 'watch_ultra2.png', cropLeft: false },
    { label: 'Apple Watch Series 9', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/09/Apple-Watch-Series-9.jpg', filename: 'watch_series9.png', cropLeft: false },
    { label: 'Apple Watch Series 8', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-Watch-Series-8-45mm.jpg', filename: 'watch_series8.png', cropLeft: false },
    { label: 'Apple Watch SE (2nd Gen)', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-Watch-SE-2nd-Gen-44mm.jpg', filename: 'watch_se_2nd_gen.png', cropLeft: false },

    // Android Tablets
    { label: 'Galaxy Tab S9 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/10/Samsung-Galaxy-Tab-S9-Ultra.jpg', filename: 'tablet_s9_ultra.png', cropLeft: true },
    { label: 'Galaxy Tab S9', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/10/Samsung-Galaxy-Tab-S9.jpg', filename: 'tablet_s9.png', cropLeft: true },
    { label: 'Galaxy Tab S8', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/09/Samsung-Galaxy-Tab-S8.jpg', filename: 'tablet_s8.png', cropLeft: true }
];

async function processAll() {
    const publicDir = path.join(__dirname, '..', 'public');
    console.log(`Starting batch download and process of ${items.length} devices...`);

    for (const item of items) {
        try {
            console.log(`Processing ${item.label}...`);
            const res = await fetch(item.url);
            if (!res.ok) {
                console.error(`  Failed to download ${item.label}: HTTP ${res.status}`);
                continue;
            }
            const buf = await res.arrayBuffer();
            const inputBuf = Buffer.from(buf);

            // Read metadata
            const meta = await sharp(inputBuf).metadata();
            
            let croppedBuf;
            if (item.cropLeft) {
                // Crop left 78% to remove front screen / front view of device
                const cropWidth = Math.round(meta.width * 0.78);
                croppedBuf = await sharp(inputBuf)
                    .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
                    .png()
                    .toBuffer();
            } else {
                croppedBuf = inputBuf;
            }

            // Pad centered inside standard 198x110 canvas
            const finalPath = path.join(publicDir, item.filename);
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
                    input: await sharp(croppedBuf)
                        .resize({
                            width: 170,
                            height: 98,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .png()
                        .toBuffer(),
                    left: 14,
                    top: 6
                }
            ])
            .png()
            .toFile(finalPath);

            console.log(`  Saved to public/${item.filename}`);
        } catch (e) {
            console.error(`  Error processing ${item.label}:`, e.message);
        }
    }

    console.log('Finished batch processing all devices!');
}

processAll();
