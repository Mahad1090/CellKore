const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const devices = [
    // Samsung S-series
    { label: 'Galaxy S26 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2026/03/Samsung-Galaxy-S26-Ultra.webp', filename: 'samsung_s26_ultra.png' },
    { label: 'Galaxy S26 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2026/03/Samsung-Galaxy-S26-Plus.webp', filename: 'samsung_s26_plus.png' },
    { label: 'Galaxy S26', url: 'https://www.smartphonesplus.com/wp-content/uploads/2026/03/Samsung-Galaxy-S26.webp', filename: 'samsung_s26.png' },
    { label: 'Galaxy S25 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2025/02/Samsung-Galaxy-S25-Ultra.jpg', filename: 'samsung_s25_ultra.png' },
    { label: 'Galaxy S25 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2025/02/Samsung-Galaxy-S25-Plus.jpg', filename: 'samsung_s25_plus.png' },
    { label: 'Galaxy S25', url: 'https://www.smartphonesplus.com/wp-content/uploads/2025/02/Samsung-Galaxy-S25.jpg', filename: 'samsung_s25.png' },
    { label: 'Galaxy S24 FE', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/10/Samsung-Galaxy-S24-FE.jpg', filename: 'samsung_s24_fe.png' },
    { label: 'Galaxy S24 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/02/Samsung-Galaxy-S24-Ultra.jpg', filename: 'samsung_s24_ultra.png' },
    { label: 'Galaxy S24 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/02/Samsung-Galaxy-S24.jpg', filename: 'samsung_s24_plus.png' },
    { label: 'Galaxy S24', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/02/Samsung-Galaxy-S24-1.jpg', filename: 'samsung_s24.png' },
    { label: 'Galaxy S23 FE', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/10/Samsung-Galaxy-S23-FE.jpg', filename: 'samsung_s23_fe.png' },
    { label: 'Galaxy S23 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/02/Samsung-Galaxy-S23-Ultra.jpg', filename: 'samsung_s23_ultra.png' },
    { label: 'Galaxy S23 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/02/Samsung-Galaxy-S23-1.jpg', filename: 'samsung_s23_plus.png' },
    { label: 'Galaxy S23', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/02/Samsung-Galaxy-S23.jpg', filename: 'samsung_s23.png' },
    { label: 'Galaxy S22 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/03/RepairDesk-Photos-5-400-%C3%97-400-px-500-%C3%97-500-px-1-450x450.jpg', filename: 'samsung_s22_ultra.png' },
    { label: 'Galaxy S22 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/03/RepairDesk-Photos-5-400-%C3%97-400-px-500-%C3%97-500-px-450x450.jpg', filename: 'samsung_s22_plus.png' },
    { label: 'Galaxy S22', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/03/Galaxy-S22-450x450.jpg', filename: 'samsung_s22.png' },
    { label: 'Galaxy S21 FE', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/03/Samsung-Galaxy-S21-FE-5G.jpg', filename: 'samsung_s21_fe.png' },
    { label: 'Galaxy S21 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/02/Samsung-Galaxy-S21-Ultra-5G-1.jpg', filename: 'samsung_s21_ultra.png' },
    { label: 'Galaxy S21 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/02/Samsung-Galaxy-S21-5G-1.jpg', filename: 'samsung_s21_plus.png' },
    { label: 'Galaxy S21', url: 'https://www.smartphonesplus.com/wp-content/uploads/2021/02/Samsung-Galaxy-S21-5G.jpg', filename: 'samsung_s21.png' },
    { label: 'Galaxy S20 FE', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/11/Samsung-Galaxy-S20-FE-5G.jpg', filename: 'samsung_s20_fe.png' },
    { label: 'Galaxy S20 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/08/Samsung-Galaxy-S20-Ultra.jpg', filename: 'samsung_s20_ultra.png' },
    { label: 'Galaxy S20 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/08/Samsung-Galaxy-S20-1.jpg', filename: 'samsung_s20_plus.png' },
    { label: 'Galaxy S20', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/08/Samsung-Galaxy-S20-2.jpg', filename: 'samsung_s20.png' },
    { label: 'Galaxy S10 Plus', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/02/Samsung-Galaxy-S10-1.jpg', filename: 'samsung_s10_plus.png' },
    { label: 'Galaxy S10', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/02/Samsung-Galaxy-S10.jpg', filename: 'samsung_s10.png' },
    
    // Samsung Note / Fold / Flip
    { label: 'Galaxy Note 20 Ultra', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/09/Samsung-Galaxy-Note-20-Ultra-5G.jpg', filename: 'samsung_note20_ultra.png' },
    { label: 'Galaxy Note 20', url: 'https://www.smartphonesplus.com/wp-content/uploads/2020/09/Samsung-Galaxy-Note-20-5G-1.jpg', filename: 'samsung_note20.png' },
    { label: 'Galaxy Z Fold6', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/08/Samsung-Galaxy-Z-Fold6.jpg', filename: 'samsung_z_fold6.png' },
    { label: 'Galaxy Z Fold5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/08/Galaxy-Z-Fold5.jpg', filename: 'samsung_z_fold5.png' },
    { label: 'Galaxy Z Flip6', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/08/Samsung-Galaxy-Z-Flip6.jpg', filename: 'samsung_z_flip6.png' },
    { label: 'Galaxy Z Flip5', url: 'https://www.smartphonesplus.com/wp-content/uploads/2023/08/Galaxy-Z-Flip5.jpg', filename: 'samsung_z_flip5.png' },

    // Apple iPads (All 26)
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
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (res.ok) return res;
            console.log(`  Received status ${res.status}, retrying (${i + 1}/${retries})...`);
        } catch (e) {
            console.log(`  Fetch failed: ${e.message}, retrying (${i + 1}/${retries})...`);
        }
        await sleep(delay);
    }
    throw new Error('All fetch retries failed');
}

async function processUncropped() {
    const publicDir = path.join(__dirname, '..', 'public');
    console.log(`Starting uncropped processing for ${devices.length} models...`);

    for (const dev of devices) {
        try {
            console.log(`Downloading ${dev.label}...`);
            const res = await fetchWithRetry(dev.url);
            const buf = await res.arrayBuffer();
            const inputBuf = Buffer.from(buf);

            // Save uncropped, centered on a 198x110 white canvas
            const finalPath = path.join(publicDir, dev.filename);
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
                    input: await sharp(inputBuf)
                        .resize({
                            width: 178, // Let it fill more of the canvas to look premium and match
                            height: 102,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .png()
                        .toBuffer(),
                    left: 10,
                    top: 4
                }
            ])
            .png()
            .toFile(finalPath);

            console.log(`  Saved uncropped: public/${dev.filename}`);
            await sleep(500); // Friendly rate limit protection
        } catch (e) {
            console.error(`  Error processing ${dev.label}:`, e.message);
        }
    }

    console.log('Finished processing all uncropped models!');
}

processUncropped();
