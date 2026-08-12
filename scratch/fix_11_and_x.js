const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const imageFile = path.join(brainDir, 'media__1786525249314.png');

async function fix11AndX() {
    const publicDir = path.join(__dirname, '..', 'public');

    // 1. Fix iPhone 11: Crop the left 164px of public/iphone_11_group.png to remove the blue front-screen phone
    const iphone11Path = path.join(publicDir, 'iphone_11_group.png');
    const iphone11Temp = path.join(publicDir, 'iphone_11_group_temp.png');
    try {
        if (fs.existsSync(iphone11Path)) {
            const meta = await sharp(iphone11Path).metadata();
            await sharp(iphone11Path)
                .clone()
                .extract({ left: 0, top: 0, width: 164, height: meta.height })
                .toFile(iphone11Temp);
            
            fs.unlinkSync(iphone11Path);
            fs.renameSync(iphone11Temp, iphone11Path);
            console.log('iPhone 11 group image successfully cropped to back views only!');
        }
    } catch (e) {
        console.error('Error fixing iPhone 11:', e.message);
    }

    // 2. Fix iPhone X: Crop the Space Gray and White backs from media__1786525249314.png (Row 2, Col 4) and merge them side-by-side
    try {
        const xCard = sharp(imageFile).clone().extract({ left: 745, top: 242, width: 198, height: 110 });
        
        // Extract Part 1: Space Gray back (left: 0 to 52)
        const part1Buf = await xCard.clone()
            .extract({ left: 0, top: 0, width: 52, height: 110 })
            .toBuffer();

        // Extract Part 2: White back (left: 98 to 48)
        const part2Buf = await xCard.clone()
            .extract({ left: 98, top: 0, width: 48, height: 110 })
            .toBuffer();

        // Create a blank white canvas of 100x110
        const finalImage = await sharp({
            create: {
                width: 100,
                height: 110,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: part1Buf, left: 0, top: 0 },
            { input: part2Buf, left: 52, top: 0 }
        ])
        .png()
        .toFile(path.join(publicDir, 'iphone_x_group.png'));

        console.log('iPhone X group image successfully merged back views (Space Gray & Silver) only!');
    } catch (e) {
        console.error('Error fixing iPhone X:', e.message);
    }
}

fix11AndX();
