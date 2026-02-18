const Jimp = require('jimp');

async function analyze() {
    const image = await Jimp.read('public/puddlefoot.png');
    const color = image.getPixelColor(0, 0);
    const rgba = Jimp.intToRGBA(color);
    console.log(`Top-Left Color: rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`);
    const hex = '#' + ((1 << 24) + (rgba.r << 16) + (rgba.g << 8) + rgba.b).toString(16).slice(1).toUpperCase();
    console.log(`Hex: ${hex}`);
}

analyze().catch(err => console.error(err));
