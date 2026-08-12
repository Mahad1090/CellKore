const fs = require('fs');

async function run() {
    try {
        const html = fs.readFileSync('scratch/apple_newsroom_ipad_air.html', 'utf8');
        
        const regex = /\/newsroom\/images\/[^\s"']+\.(jpg|png|webp)/gi;
        let match;
        const urls = [];
        while ((match = regex.exec(html)) !== null) {
            urls.push('https://www.apple.com' + match[0]);
        }
        
        const uniq = [...new Set(urls)];
        console.log(`Found ${uniq.length} iPad Air M2 images:`);
        uniq.forEach((u, i) => {
            console.log(`  ${i}: ${u}`);
        });
    } catch(e) {
        console.error(e.message);
    }
}
run();
