const fs = require('fs');

async function run() {
    try {
        const res = await fetch('https://www.apple.com/newsroom/2024/05/apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-ipad-air-supercharged-by-the-m2-chip/');
        const html = await res.text();
        fs.writeFileSync('scratch/apple_newsroom_ipad_air.html', html);
        console.log('Saved scratch/apple_newsroom_ipad_air.html');
        
        // Find all jpg or png urls
        const regex = /https:\/\/www\.apple\.com\/newsroom\/images\/[^"]+\.(jpg|png|webp)/gi;
        let match;
        const urls = [];
        while ((match = regex.exec(html)) !== null) {
            urls.push(match[0]);
        }
        
        const uniq = [...new Set(urls)];
        console.log(`Found ${uniq.length} images:`);
        uniq.forEach((u, i) => {
            console.log(`  ${i}: ${u}`);
        });
    } catch(e) {
        console.error(e.message);
    }
}
run();
