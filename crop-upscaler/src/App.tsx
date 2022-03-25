import React, { useState, useRef } from 'react'

import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
} from 'react-image-crop'
import { canvasPreview } from './canvasPreview'
import { useDebounceEffect } from './useDebounceEffect'

import 'react-image-crop/dist/ReactCrop.css'

// CREDIT: https://codesandbox.io/s/y831o
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function App() {
    const [imgSrc, setImgSrc] = useState('')
    const [cropImg, setCropImg] = useState('')
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [crop, setCrop] = useState<PixelCrop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [scale, setScale] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [aspect, setAspect] = useState<number | undefined>(16 / 9)

    function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined) // Makes crop preview update between images.
            const reader = new FileReader()
            reader.addEventListener('load', () =>
                setImgSrc(reader.result.toString() || ''),
            )
            reader.readAsDataURL(e.target.files[0])
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget
            setCrop(centerAspectCrop(width, height, aspect))
        }
    }

    useDebounceEffect(
        async () => {
            if (
                completedCrop?.width &&
                completedCrop?.height &&
                imgRef.current
            ) {
                console.log(imgRef)
                const x = Math.floor(crop.x * imgRef.current.naturalWidth / 100);
                const y = Math.floor(crop.y * imgRef.current.naturalHeight / 100);
                const width = Math.floor(crop.width * imgRef.current.naturalWidth / 100);
                const height = Math.floor(crop.height * imgRef.current.naturalHeight / 100);
                // We use canvasPreview as it's much faster than imgPreview.
                console.log(`http://localhost:8000/files?x=${x}&y=${y}&width=${width}&height=${height}`)
                const response = await fetch(`http://localhost:8000/files?x=${x}&y=${y}&width=${width}&height=${height}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'image/jpeg' },
                    body: imgRef.current.currentSrc + "=="
                });
                const data = await response.json();
                console.log(data);
                setCropImg(data.image);
            }
        },
        100,
        [completedCrop, setCropImg],
    )

    function handleToggleAspectClick() {
        if (aspect) {
            setAspect(undefined)
        } else if (imgRef.current) {
            const { width, height } = imgRef.current
            setAspect(16 / 9)
            setCrop(centerAspectCrop(width, height, 16 / 9))
        }
    }

    return (
        <div className="App">
            <div>
                <input type="file" accept="image/*" onChange={onSelectFile} />
                <div>
                    <label htmlFor="scale-input">Scale: </label>
                    <input
                        id="scale-input"
                        type="number"
                        step="0.1"
                        value={scale}
                        disabled={!imgSrc}
                        onChange={(e) => setScale(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label htmlFor="rotate-input">Rotate: </label>
                    <input
                        id="rotate-input"
                        type="number"
                        value={rotate}
                        disabled={!imgSrc}
                        onChange={(e) =>
                            setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))
                        }
                    />
                </div>
                <div>
                    <button onClick={handleToggleAspectClick}>
                        Toggle aspect {aspect ? 'off' : 'on'}
                    </button>
                </div>
            </div>
            {Boolean(imgSrc) && (
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => {
                        console.log(c)
                        setCompletedCrop(c)
                    }}
                    aspect={aspect}
                >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                        onLoad={onImageLoad}
                    />
                </ReactCrop>
            )}
            <div>
                {Boolean(cropImg) && (
                    <img
                        src={cropImg}
                        className="resize"
                        alt={"cropped image"}
                    />

                )}
            </div>
        </div>
    )
}
