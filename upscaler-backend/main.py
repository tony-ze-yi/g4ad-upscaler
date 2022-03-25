import io

from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
import base64
import subprocess
import cv2
from PIL import Image



app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/files")
async def create_file(
    x: int = 0,
    y: int = 0,
    width: int = 128,
    height: int = 128,
    data: str = Body(...),
):
    print(data)
    base64_image_str = data[data.find(",") + 1:]
    imgdata = base64.b64decode(base64_image_str)
    img = Image.open(io.BytesIO(imgdata))
    img.save("oldimg.png")
    print(width)
    cropped_img = img.crop((x, y, min(img.width, width+x), min(img.height, height+y)))
    cropped_img.save("newimage.png")
    subprocess.run(["./realesrgan-ncnn-vulkan.exe", "-i", "newimage.png", "-o", "output.png", "-n", "realesrnet-x4plus"])
    img = cv2.imread('output.png')
    jpg_img = cv2.imencode('.png', img)
    b64_string = base64.b64encode(jpg_img[1]).decode('utf-8')
    return {"image": "data:image/png;base64," + b64_string}
