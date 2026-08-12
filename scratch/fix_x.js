const sharp = require('sharp');
const path = require('path');

async function fixIphoneX() {
    const publicDir = path.join(__dirname, '..', 'public');
    const xsPath = path.join(publicDir, 'iphone_xs_group.png');
    const xPath = path.join(publicDir, 'iphone_x_group.png');

    try {
        const metadata = await sharp(xsPath).metadata();
        console.log('iphone_xs_group.png dimensions:', metadata.width, 'x', metadata.height);

        // Crop the left ~68% of the image to remove the Gold phone and keep only Space Gray & Silver
        await sharp(xsPath)
            .clone()
            .extract({
                left: 0,
                top: 0,
                width: Math.floor(metadata.width * 0.70),
                height: metadata.height
            })
            .toFile(xPath, { overwrite: true });

        console.log('Successfully cropped Space Gray & Silver backs to create a back-view only iphone_x_group.png!');
    } catch (e) {
        console.log('Error:', e.message);
    }
}

fixIphoneX();
