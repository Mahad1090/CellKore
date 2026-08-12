const fs = require('fs');

const subcategories = [
    { name: 'ipad_standard', url: 'https://www.smartphonesplus.com/ipad/' },
    { name: 'ipad_air', url: 'https://www.smartphonesplus.com/ipadair/' },
    { name: 'ipad_mini', url: 'https://www.smartphonesplus.com/ipadmini/' },
    { name: 'ipad_pro', url: 'https://www.smartphonesplus.com/ipadpro/' },
    { name: 'samsung_tablet', url: 'https://www.smartphonesplus.com/samsungtablet/' },
    { name: 'macbook_pro', url: 'https://www.smartphonesplus.com/sell-macbookpro/' },
    { name: 'macbook_air', url: 'https://www.smartphonesplus.com/macbookair/' }
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
