const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ipads = [
    { label: 'iPad 10', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-10th-Gen.jpg', filename: 'ipad_10.png' },
    { label: 'iPad 9', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/10/iPad-9th-Generation.jpg', filename: 'ipad_9.png' },
    { label: 'iPad 8', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/10/Apple-iPad-8.jpg', filename: 'ipad_8.png' },
    { label: 'iPad 7', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/02/Apple-iPad-7.jpg', filename: 'ipad_7.png' },
    { label: 'iPad Mini 7', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/10/iPad-mini-A17-Pro.jpg', filename: 'ipad_mini_7.png' },
    { label: 'iPad Mini 6', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/10/iPad-mini-6.jpg', filename: 'ipad_mini_6.png' },
    { label: 'iPad Mini 5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/02/Apple-iPad-mini-5.jpg', filename: 'ipad_mini_5.png' },
    { label: 'iPad Air 7 - 13"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2026/03/iPad-Air-13-inch-M4-2026.webp', filename: 'ipad_air_7_13.png' },
    { label: 'iPad Air 7 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2026/03/iPad-Air-11-inch-M4-2026.webp', filename: 'ipad_air_7_11.png' },
    { label: 'iPad Air 6 - 13"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-iPad-Air-13-inch-M2.jpg', filename: 'ipad_air_6_13.png' },
    { label: 'iPad Air 6 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-iPad-Air-11-inch-M2.jpg', filename: 'ipad_air_6_11.png' },
    { label: 'iPad Air 5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/05/iPad-Air-5.jpg', filename: 'ipad_air_5.png' },
    { label: 'iPad Air 4', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/01/Apple-iPad-Air-4.jpg', filename: 'ipad_air_4.png' },
    { label: 'iPad Air 3', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/02/Apple-iPad-Air-3.jpg', filename: 'ipad_air_3.png' },
    { label: 'iPad Pro 7 - 13"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-13-inch-iPad-Pro-Standard-Glass.jpg', filename: 'ipad_pro_7_13.png' },
    { label: 'iPad Pro 5 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-11-inch-iPad-Pro-Standard-Glass.jpg', filename: 'ipad_pro_5_11.png' },
    { label: 'iPad Pro 6 - 12.9"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-12.922-6th-Gen.jpg', filename: 'ipad_pro_6_129.png' },
    { label: 'iPad Pro 4 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/10/Apple-iPad-11-2022.jpg', filename: 'ipad_pro_4_11.png' },
    { label: 'iPad Pro 5 - 12.9"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/07/Apple-iPad-Pro-12.9-inch-5th-Gen.jpg', filename: 'ipad_pro_5_129.png' },
    { label: 'iPad Pro 3 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/07/iPad-Pro-11-inch-2021.jpg', filename: 'ipad_pro_3_11.png' },
    { label: 'iPad Pro 4 - 12.9"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/04/Apple-iPad-Pro-12.9-4th-Gen.jpg', filename: 'ipad_pro_4_129.png' },
    { label: 'iPad Pro 2 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/04/Apple-iPad-Pro-11-4th-Gen.jpg', filename: 'ipad_pro_2_11.png' },
    { label: 'iPad Pro 3 - 12.9"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2018/11/Apple-iPad-Pro-12.9-3rd-Gen.jpg', filename: 'ipad_pro_3_129.png' },
    { label: 'iPad Pro 1 - 11"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2018/11/Apple-iPad-Pro-11-3rd-Gen.jpg', filename: 'ipad_pro_1_11.png' },
    { label: 'iPad Pro 2 - 12.9"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2018/12/Apple-iPad-Pro-12.9-2nd-Gen.jpg', filename: 'ipad_pro_2_129.png' },
    { label: 'iPad Pro 1 - 10.5"', url: 'https://www.smartphonesplus.com/wp-content/uploads/2019/02/Apple-iPad-Pro-10.5-2nd-Gen.jpg', filename: 'ipad_pro_1_105.png' }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return res;
            console.log(`  Received status ${res.status}, retrying (${i + 1}/${retries})...`);
        } catch (e) {
            console.log(`  Fetch failed: ${e.message}, retrying (${i + 1}/${retries})...`);
        }
        await sleep(delay);
    }
    throw new Error('All fetch retries failed');
}

async function processIpads() {
    const publicDir = path.join(__dirname, '..', 'public');
    console.log(`Starting download and crop of ${ipads.length} iPads with retry & delay protection...`);

    for (const ipad of ipads) {
        try {
            console.log(`Downloading ${ipad.label}...`);
            const res = await fetchWithRetry(ipad.url);
            const buf = await res.arrayBuffer();
            const inputBuf = Buffer.from(buf);

            // Read metadata
            const meta = await sharp(inputBuf).metadata();
            
            // Crop left 78% to remove front screen
            const cropWidth = Math.round(meta.width * 0.78);
            const croppedBuf = await sharp(inputBuf)
                .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
                .png()
                .toBuffer();

            // Center inside standard 198x110 canvas
            const finalPath = path.join(publicDir, ipad.filename);
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

            console.log(`  Saved to public/${ipad.filename}`);
            // Wait 600ms between downloads to avoid rate limits
            await sleep(600);
        } catch (e) {
            console.error(`  Error processing ${ipad.label}:`, e.message);
        }
    }

    console.log('Finished processing all iPads!');
}

processIpads();
