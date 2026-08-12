const fs = require('fs');

async function run() {
    try {
        const res = await fetch('https://www.apple.com/newsroom/2024/05/apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-ipad-air/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        fs.writeFileSync('scratch/apple_newsroom_ipad_air_full.html', html);
        console.log('Saved scratch/apple_newsroom_ipad_air_full.html. Size:', html.length);
        
        // Find relative image links
        const regex = /\/newsroom\/images\/[^\s"']+\.(jpg|png|webp)/gi;
        let match;
        const urls = [];
        while ((match = regex.exec(html)) !== null) {
            urls.push('https://www.apple.com' + match[0]);
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
