import { PixelCrop } from 'react-image-crop'

const TO_RADIANS = Math.PI / 180

export async function canvasPreview(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop,
    scale = 1,
    rotate = 0,
) {
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }
    console.log(image.src)
    const response = await fetch(`http://localhost:8000/files?x=${Math.round(crop.x)}&y=${Math.round(crop.y)}&width=${Math.round(crop.width)}&height=${Math.round(crop.height)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: image.src
    });
    const data = await response.json();
    console.log(data);

    let drawn = false;

    const newimage = new Image();
    newimage.onload = function() {
        console.log(newimage);
        if (!drawn){
            ctx.drawImage(newimage, 0, 0, newimage.width, newimage.height, 0, 0, newimage.width, newimage.height);
        }
        drawn = true;
    };
    newimage.src = data.image;

    // ctx.restore()
}
