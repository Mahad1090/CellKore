const fs = require('fs');

const subcategories = [
    { name: 'ipad_pro', url: 'https://www.smartphonesplus.com/sell-ipad/sell-ipad-pro/' },
    { name: 'ipad_air', url: 'https://www.smartphonesplus.com/sell-ipad/sell-ipad-air/' },
    { name: 'ipad_mini', url: 'https://www.smartphonesplus.com/sell-ipad/sell-ipad-mini/' },
    { name: 'ipad_standard', url: 'https://www.smartphonesplus.com/sell-ipad/sell-ipad/' }
];

async function run() {
    for (const sub of subcategories) {
        try {
            console.log(`\n--- Fetching ${sub.name} from ${sub.url} ---`);
            const res = await fetch(sub.url);
            const html = await res.text();
            
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
        } catch (e) {
            console.error(`Error fetching ${sub.name}:`, e.message);
        }
    }
}

run();
