const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const publicDir = path.join(__dirname, '..', 'public');

fs.copyFileSync(path.join(publicDir, 'macbook_pro_16_2024.png'), path.join(artifactDir, 'test_mac_0_new2.png'));
fs.copyFileSync(path.join(publicDir, 'macbook_pro_16_2023.png'), path.join(artifactDir, 'test_mac_2_new2.png'));

console.log('Copied files successfully!');
