const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = path.join(__dirname, '..', 'public', 'tablets_category.png');
    const dest = path.join(__dirname, '..', 'public', 'tablets_category.webp');
    
    try {
        const fs = require('fs');
        if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
        }
        
        await sharp(src)
            .webp({ quality: 90 })
            .toFile(dest);
        console.log('Successfully converted tablets_category.png to tablets_category.webp');
    } catch (err) {
        console.error('Error during conversion:', err.message);
    }
}
run();
