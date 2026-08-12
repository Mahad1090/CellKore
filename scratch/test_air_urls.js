const fs = require('fs');

const base = 'https://www.apple.com/newsroom/images/2024/05/apple-unveils-the-redesigned-11-inch-and-all-new-13-inch-ipad-air/article/';
const filenames = [
    'Apple-iPad-Air-colors-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-color-lineup-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-blue-2-up-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-purple-2-up-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-starlight-2-up-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-space-gray-2-up-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-features-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-hero-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-profile-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-landscape-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-portrait-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-lineup-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-blue-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-purple-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-starlight-240507_big.jpg.large.jpg',
    'Apple-iPad-Air-spacegray-240507_big.jpg.large.jpg',
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
