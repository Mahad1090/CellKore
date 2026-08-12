const sharp = require('sharp');
const fs = require('fs');

async function check() {
    try {
        const xMeta = await sharp('public/iphone_x_group.png').metadata();
        const xsMeta = await sharp('public/iphone_xs_group.png').metadata();
        const elevenMeta = await sharp('public/iphone_11_group.png').metadata();
        console.log('iphone_x_group.png metadata:', xMeta.width, 'x', xMeta.height, 'size:', fs.statSync('public/iphone_x_group.png').size);
        console.log('iphone_xs_group.png metadata:', xsMeta.width, 'x', xsMeta.height, 'size:', fs.statSync('public/iphone_xs_group.png').size);
        console.log('iphone_11_group.png metadata:', elevenMeta.width, 'x', elevenMeta.height, 'size:', fs.statSync('public/iphone_11_group.png').size);
    } catch (e) {
        console.log('Error:', e.message);
    }
}

check();
