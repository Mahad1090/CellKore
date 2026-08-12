const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const res = await fetch('https://www.apple.com/newsroom/2024/05/apple-unveils-stunning-new-ipad-pro-with-m4-chip-and-apple-pencil-pro/');
        const html = await res.text();
        fs.writeFileSync('scratch/apple_newsroom.html', html);
        console.log('Saved scratch/apple_newsroom.html');
    } catch(e) {
        console.error(e.message);
    }
}
run();
