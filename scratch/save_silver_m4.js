const fs = require('fs');

async function run() {
    try {
        const res = await fetch('https://www.apple.com/newsroom/images/2024/05/apple-unveils-stunning-new-ipad-pro-with-m4-chip-and-apple-pencil-pro/article/Apple-iPad-Pro-silver-2-up-240507_big.jpg.large.jpg');
        const buf = await res.arrayBuffer();
        fs.writeFileSync('public/temp_inspect/silver_m4_back.jpg', Buffer.from(buf));
        console.log('Saved public/temp_inspect/silver_m4_back.jpg');
    } catch(e) {
        console.error(e.message);
    }
}
run();
