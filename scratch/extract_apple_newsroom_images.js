const fs = require('fs');

const pages = [
    'https://www.apple.com/newsroom/2024/05/apple-unveils-stunning-new-ipad-pro-with-m4-chip-and-apple-pencil-pro/',
    'https://www.apple.com/newsroom/2024/05/apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-ipad-air-supercharged-by-the-m2-chip/',
    'https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-ipad-air-powered-by-m4/'
];

async function run() {
    for (const url of pages) {
        try {
            console.log(`\n--- Fetching Newsroom: ${url} ---`);
            const res = await fetch(url);
            const html = await res.text();
            
            const regex = /"url"\s*:\s*"([^"]+\.jpg|[^"]+\.png|[^"]+\.webp)"/gi;
            let match;
            const urls = [];
            while ((match = regex.exec(html)) !== null) {
                urls.push(match[1]);
            }
            
            // Also standard img src
            const regex2 = /src="([^"]+\.jpg|[^"]+\.png|[^"]+\.webp)"/gi;
            while ((match = regex2.exec(html)) !== null) {
                urls.push(match[1]);
            }
            
            const uniqueUrls = [...new Set(urls)].filter(u => u.includes('newsroom/images/product/'));
            console.log(`Found ${uniqueUrls.length} product images:`);
            uniqueUrls.forEach((u, i) => {
                console.log(`  ${i}: ${u}`);
            });
        } catch (e) {
            console.error(e.message);
        }
    }
}
run();
