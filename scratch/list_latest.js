const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';

function listLatest() {
    const files = fs.readdirSync(brainDir)
        .filter(f => f.startsWith('media__') && f.endsWith('.png'))
        .map(f => {
            const stat = fs.statSync(path.join(brainDir, f));
            return { name: f, time: stat.mtimeMs };
        });
    files.sort((a, b) => b.time - a.time);
    console.log('Latest 5 media files:');
    files.slice(0, 5).forEach(f => console.log(`${f.name}: ${new Date(f.time).toISOString()}`));
}

listLatest();
