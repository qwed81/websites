import cv2
import numpy as np
from skimage import transform as trans

# landmarks for arcface alignment
# [left_eye, right_eye, nose, left_mouth_corner, right_mouth_corner]
arcface_dst = np.array(
    [
        [38.2946, 51.6963],
        [73.5318, 51.5014],
        [56.0252, 71.7366],
        [41.5493, 92.3655],
        [70.7299, 92.2041],
    ],
    dtype=np.float32,
)


def estimate_norm(landmarks, img_size=112):
    assert landmarks.shape == (5, 2)
    assert img_size % 112 == 0 or img_size % 128 == 0

    # scaling ratio based on desired image size
    if img_size % 112 == 0:
        ratio = float(img_size) / 112.0
        diff_x = 0
    else:
        ratio = float(img_size) / 128.0
        diff_x = 8.0 * ratio

    # scale landmarks and apply horizontal offset
    dst = arcface_dst * ratio
    dst[:, 0] += diff_x

    # est similarity tform
    tform = trans.SimilarityTransform()
    tform.estimate(landmarks, dst)
    M = tform.params[0:2, :]

    return M


def norm_crop2(img, landmark, image_size=112):
    M = estimate_norm(landmark, image_size)
    warped = cv2.warpAffine(img, M, (image_size, image_size), borderValue=0.0)
    return warped, M
