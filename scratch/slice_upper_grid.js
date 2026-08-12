const sharp = require('sharp');
const path = require('path');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const artifactDir = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5';
    
    try {
        await sharp(src)
            .extract({ left: 0, top: 0, width: 400, height: 250 })
            .png()
            .toFile(path.join(artifactDir, 'upper_grid.png'));
            
        console.log('Saved upper_grid.png to artifacts.');
    } catch(e) {
        console.error(e.message);
    }
}
run();
