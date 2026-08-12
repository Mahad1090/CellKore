const fs = require('fs');

async function run() {
    try {
        const res = await fetch('https://www.smartphonesplus.com/sell-samsung/sell-galaxy-s-series/');
        const html = await res.text();
        console.log('Fetched HTML length:', html.length);
        
        // Find all img tags or links containing upload urls
        const regex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]*)"/g;
        let match;
        const images = [];
        while ((match = regex.exec(html)) !== null) {
            images.push({ src: match[1], alt: match[2] });
        }
        
        console.log(`Found ${images.length} images:`);
        images.forEach((img, i) => {
            console.log(`${i}: Alt="${img.alt}" Src="${img.src}"`);
        });
        
        // Save HTML for debugging
        fs.writeFileSync('scratch/samsung_s_series_page.html', html);
    } catch (e) {
        console.error('Error fetching page:', e.message);
    }
}

run();
