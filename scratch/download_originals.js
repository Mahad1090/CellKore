const fs = require('fs');
const path = require('path');

const urls = [
    { name: 'ipad_air_6_13_orig.jpg', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-iPad-Air-13-inch-M2.jpg' },
    { name: 'ipad_air_5_orig.jpg', url: 'https://www.smartphonesplus.com/wp-content/uploads/2022/05/iPad-Air-5.jpg' },
    { name: 'ipad_pro_7_13_orig.jpg', url: 'https://www.smartphonesplus.com/wp-content/uploads/2024/05/Apple-13-inch-iPad-Pro-Standard-Glass.jpg' }
];

async function run() {
    const dir = path.join(__dirname, '..', 'public', 'temp_inspect');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    for (const item of urls) {
        try {
            console.log(`Downloading ${item.name}...`);
            const res = await fetch(item.url);
            const buf = await res.arrayBuffer();
            fs.writeFileSync(path.join(dir, item.name), Buffer.from(buf));
            console.log(`  Saved to public/temp_inspect/${item.name}`);
        } catch (e) {
            console.error(e.message);
        }
    }
}
run();
