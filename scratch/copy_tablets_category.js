const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\tablets_category_new_1786560828093.png';
    const publicDir = path.join(__dirname, '..', 'public');
    
    try {
        await sharp(src)
            .webp({ quality: 90 })
            .toFile(path.join(publicDir, 'tablets_category.webp'));
            
        console.log('Converted and copied tablets_category.webp successfully!');
    } catch(e) {
        console.error(e.message);
    }
}
run();
