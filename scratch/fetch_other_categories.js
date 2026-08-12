const fs = require('fs');

const urls = [
    { name: 'note_series', url: 'https://www.smartphonesplus.com/sell-samsung/sell-galaxy-note-series/' },
    { name: 'z_series', url: 'https://www.smartphonesplus.com/sell-samsung/sell-galaxy-z-series/' },
    { name: 'ipad', url: 'https://www.smartphonesplus.com/sell-ipad/' },
    { name: 'macbook', url: 'https://www.smartphonesplus.com/sell-macbook/' },
    { name: 'watch', url: 'https://www.smartphonesplus.com/sell-apple-watch/' },
    { name: 'tablet', url: 'https://www.smartphonesplus.com/sell-android-tablet/' }
];

async function run() {
    for (const item of urls) {
        try {
            console.log(`\n--- Fetching ${item.name} from ${item.url} ---`);
            const res = await fetch(item.url);
            const html = await res.text();
            
            // Extract all images
            const regex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]*)"/g;
            let match;
            const images = [];
            while ((match = regex.exec(html)) !== null) {
                images.push({ src: match[1], alt: match[2] });
            }
            
            console.log(`Found ${images.length} images:`);
            images.forEach((img, i) => {
                if (img.alt && !img.alt.includes('SmartphonesPLUS') && !img.src.includes('logo') && !img.src.includes('svg')) {
                    console.log(`  ${img.alt}: ${img.src}`);
                }
            });
            
            // Save html
            fs.writeFileSync(`scratch/${item.name}_page.html`, html);
        } catch (e) {
            console.error(`Error fetching ${item.name}:`, e.message);
        }
    }
}

run();
