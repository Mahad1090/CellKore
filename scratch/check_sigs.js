const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';

function checkSignatures() {
    const files = ['media__1786525050175.png', 'media__1786525249314.png'];
    for (const f of files) {
        const fullPath = path.join(brainDir, f);
        if (fs.existsSync(fullPath)) {
            const buf = fs.readFileSync(fullPath);
            console.log(`${f} length: ${buf.length}`);
            const head = buf.slice(0, 16).toString('hex');
            const ascii = buf.slice(0, 16).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
            console.log(`  Hex signature: ${head}`);
            console.log(`  ASCII signature: ${ascii}`);
        } else {
            console.log(`${f} does not exist`);
        }
    }
}

checkSignatures();
