const fs = require('fs');
const path = require('path');

const files = ['test_slice_0.png', 'test_slice_6.png', 'test_slice_12.png', 'test_slice_20.png'];
const artifactDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
const publicDir = path.join(__dirname, '..', 'public');

for (const f of files) {
    fs.copyFileSync(path.join(publicDir, f), path.join(artifactDir, f));
    console.log(`Copied ${f} to artifacts directory.`);
}
