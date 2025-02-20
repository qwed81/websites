from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import Response
from PIL import Image

from futil import qswap
import insightface
import onnxruntime
import numpy as np
import uvicorn
import io

app = FastAPI()

analyzer = insightface.app.FaceAnalysis(name="buffalo_l")
analyzer.prepare(ctx_id=0)

sess_options = onnxruntime.SessionOptions()
sess_options.graph_optimization_level = (
    onnxruntime.GraphOptimizationLevel.ORT_ENABLE_ALL
)

SWAP_MODEL_PATH = "./swapmodel.onnx"
swapper_session = onnxruntime.InferenceSession(
    SWAP_MODEL_PATH,
    sess_options=sess_options,
    providers=onnxruntime.get_available_providers(),
)

swapper_model = qswap.Swapper(model_file=SWAP_MODEL_PATH, session=swapper_session)


async def load_image(img: bytes):
    image = Image.open(io.BytesIO(img))

    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.array(image)


@app.post("/swap-face/")
async def swap_face(
    source_image: UploadFile = File(...), target_image: UploadFile = File(...)
):
    try:
        source_img = await load_image(await source_image.read())
        target_img = await load_image(await target_image.read())

        source_faces = analyzer.get(source_img)
        if not source_faces:
            raise HTTPException(
                status_code=400, detail="No face detected in source image"
            )
        source_face = max(source_faces, key=lambda x: x.det_score)

        target_faces = analyzer.get(target_img)
        if not target_faces:
            raise HTTPException(
                status_code=400, detail="No face detected in target image"
            )
        target_face = max(target_faces, key=lambda x: x.det_score)

        swapped_img = swapper_model.get(
            target_img, target_face, source_face, paste_back=True
        )

        img_pil = Image.fromarray(swapped_img)
        img_byte_array = io.BytesIO()
        img_pil.save(img_byte_array, format="JPEG")
        img_byte_array = img_byte_array.getvalue()

        return Response(content=img_byte_array, media_type="image/jpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
