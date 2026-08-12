const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const models = [
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
];

async function downloadAndProcess() {
    const publicDir = path.join(__dirname, '..', 'public');
    const tempDir = path.join(__dirname, 'temp_samsung');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    console.log(`Starting download and process of ${models.length} Samsung models...`);

    for (const m of models) {
        try {
            console.log(`Downloading ${m.label} from ${m.url}...`);
            const res = await fetch(m.url);
            if (!res.ok) {
                console.error(`  Failed to download ${m.label}: HTTP ${res.status}`);
                continue;
            }
            const buf = await res.arrayBuffer();
            const inputBuf = Buffer.from(buf);

            // Read metadata to get dimensions
            const meta = await sharp(inputBuf).metadata();
            
            // We want to crop out the front screen phone on the far right.
            // On these images, the phone group is centered on a white canvas.
            // Let's crop the left ~78% of the image to remove the screen, and standard vertical bounds.
            const cropWidth = Math.round(meta.width * 0.78);
            
            // Extract the cropped group (left: 0 to cropWidth, full height)
            const croppedBuf = await sharp(inputBuf)
                .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
                .png()
                .toBuffer();

            // Place it centered inside a clean standard 198x110 canvas
            const finalPath = path.join(publicDir, m.filename);
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
                            width: 170, // Scale it down slightly to sit nicely inside the 198x110 canvas
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

            console.log(`  Successfully processed and saved to public/${m.filename}`);
        } catch (e) {
            console.error(`  Error processing ${m.label}:`, e.message);
        }
    }

    console.log('Finished processing all Samsung models!');
}

downloadAndProcess();
