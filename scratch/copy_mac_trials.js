const fs = require('fs');
const path = require('path');

const files = [
    'try_mac_left_15_w150.png',
    'try_mac_left_20_w150.png',
    'try_mac_left_25_w150.png',
    'try_mac_left_20_w160.png',
    'try_mac_left_15_w160.png'
];
const artifactDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const publicDir = path.join(__dirname, '..', 'public');

for (const f of files) {
    fs.copyFileSync(path.join(publicDir, f), path.join(artifactDir, f));
    console.log(`Copied ${f} to artifacts directory.`);
}
