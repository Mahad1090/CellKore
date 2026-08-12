const sharp = require('sharp');

async function run() {
    const src = 'C:\\Users\\waree\\.gemini\\antigravity-ide\\brain\\240aede1-d491-424d-80b2-efff4628aad5\\media__1786546589089.png';
    const image = sharp(src);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // We scan Row 148 to find the horizontal boundaries of the 6 laptops.
    // Row 148 is where the keyboard bases are. Any pixel that is darker than the light grey background
    // (RGB 247, 247, 249) indicates a laptop graphic!
    const y = 148;
    console.log(`Scanning Row ${y} for laptop base coordinates...`);
    
    let inLaptop = false;
    let startX = 0;
    
    for (let x = 0; x < info.width; x++) {
        const offset = (y * info.width + x) * info.channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        
        // If color is darker than the standard background (e.g. any channel < 244)
        const isBackground = r >= 244 && g >= 244 && b >= 244;
        
        if (!isBackground) {
            if (!inLaptop) {
                inLaptop = true;
                startX = x;
            }
        } else {
            if (inLaptop) {
                inLaptop = false;
                console.log(`Laptop base: from x = ${startX} to x = ${x - 1} (width: ${x - startX})`);
            }
        }
    }
    if (inLaptop) {
        console.log(`Laptop base: from x = ${startX} to x = ${info.width - 1} (width: ${info.width - startX})`);
    }
}
run();
