const sharp = require('sharp');

async function checkPhones() {
    try {
        const metadata = await sharp('public/phones.png').metadata();
        console.log('phones.png dimensions:', metadata.width, 'x', metadata.height);
    } catch (e) {
        console.log('Error reading phones.png:', e.message);
    }
}

checkPhones();
