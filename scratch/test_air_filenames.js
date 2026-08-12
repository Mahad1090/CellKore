const fs = require('fs');

const base = 'https://www.apple.com/newsroom/images/2024/05/apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-ipad-air/article/';
const filenames = [
    'Apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-iPad-Air_big.jpg.large.jpg',
    'Apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-iPad-Air_big.jpg.large_2x.jpg',
    'Apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-iPad-Air-colors_big.jpg.large.jpg',
    'Apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-iPad-Air-colors_big.jpg.large_2x.jpg',
];

async function run() {
    for (const fn of filenames) {
        const url = base + fn;
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log(`URL: ${fn} -> Status: ${res.status}`);
        } catch(e) {
            console.error(`URL: ${fn} -> Error: ${e.message}`);
        }
    }
}
run();
