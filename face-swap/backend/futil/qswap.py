import numpy as np
import cv2
import onnx
from onnx import numpy_helper
from . import align


class Swapper:
    def __init__(self, model_file, session):
        self.model_file = model_file
        self.session = session

        model = onnx.load(self.model_file)
        graph = model.graph

        # extract embedding map
        self.emap = numpy_helper.to_array(graph.initializer[-1])

        # input norm params
        self.input_mean = 0.0
        self.input_std = 255.0

        inputs = self.session.get_inputs()
        self.input_names = [inp.name for inp in inputs]
        outputs = self.session.get_outputs()
        self.output_names = [out.name for out in outputs]

        assert len(self.output_names) == 1
        self.input_shape = inputs[0].shape
        print("inswapper-shape:", self.input_shape)
        self.input_size = tuple(self.input_shape[2:4][::-1])

    def forward(self, img, latent):
        # normalization
        img = (img - self.input_mean) / self.input_std

        pred = self.session.run(
            self.output_names, {self.input_names[0]: img, self.input_names[1]: latent}
        )[0]
        return pred

    def get(self, img, target_face, source_face, paste_back=True):
        # target align and norm
        aimg, M = align.norm_crop2(img, target_face.kps, self.input_size[0])
        blob = cv2.dnn.blobFromImage(
            aimg,
            1.0 / self.input_std,
            self.input_size,
            (self.input_mean, self.input_mean, self.input_mean),
            swapRB=True,
        )

        # source face embedding
        latent = source_face.normed_embedding.reshape((1, -1))
        latent = np.dot(latent, self.emap)
        latent /= np.linalg.norm(latent)

        # swap face
        pred = self.session.run(
            self.output_names, {self.input_names[0]: blob, self.input_names[1]: latent}
        )[0]

        img_fake = pred.transpose((0, 2, 3, 1))[0]
        bgr_fake = np.clip(255 * img_fake, 0, 255).astype(np.uint8)[:, :, ::-1]

        if not paste_back:
            return bgr_fake, M

        # blend swapped face back into original img
        target_img = img

        # difference mask
        fake_diff = bgr_fake.astype(np.float32) - aimg.astype(np.float32)
        fake_diff = np.abs(fake_diff).mean(axis=2)

        # clear border artifacts
        fake_diff[:2, :] = fake_diff[-2:, :] = fake_diff[:, :2] = fake_diff[:, -2:] = 0

        # create blending mask
        IM = cv2.invertAffineTransform(M)
        img_white = np.full((aimg.shape[0], aimg.shape[1]), 255, dtype=np.float32)

        # Transform fake face and masks back to original image space
        bgr_fake = cv2.warpAffine(
            bgr_fake, IM, (target_img.shape[1], target_img.shape[0]), borderValue=0.0
        )
        img_white = cv2.warpAffine(
            img_white, IM, (target_img.shape[1], target_img.shape[0]), borderValue=0.0
        )
        fake_diff = cv2.warpAffine(
            fake_diff, IM, (target_img.shape[1], target_img.shape[0]), borderValue=0.0
        )

        # blending masks
        img_white[img_white > 20] = 255
        fake_diff[fake_diff < 10] = 0
        fake_diff[fake_diff >= 10] = 255
        img_mask = img_white

        ## lots of blending stuff

        # compute kernel size for blending
        mask_h_inds, mask_w_inds = np.where(img_mask == 255)
        mask_h = np.max(mask_h_inds) - np.min(mask_h_inds)
        mask_w = np.max(mask_w_inds) - np.min(mask_w_inds)
        mask_size = int(np.sqrt(mask_h * mask_w))

        # morphological blur
        k = max(mask_size // 10, 10)
        kernel = np.ones((k, k), np.uint8)
        img_mask = cv2.erode(img_mask, kernel, iterations=1)

        kernel = np.ones((2, 2), np.uint8)
        fake_diff = cv2.dilate(fake_diff, kernel, iterations=1)

        # gaussian blur
        k = max(mask_size // 20, 5)
        kernel_size = (k, k)
        blur_size = tuple(2 * i + 1 for i in kernel_size)
        img_mask = cv2.GaussianBlur(img_mask, blur_size, 0)

        k = 5
        kernel_size = (k, k)
        blur_size = tuple(2 * i + 1 for i in kernel_size)
        fake_diff = cv2.GaussianBlur(fake_diff, blur_size, 0)

        # normalize masks
        img_mask = (img_mask / 255).reshape([img_mask.shape[0], img_mask.shape[1], 1])
        fake_diff = fake_diff / 255

        # ok last blending
        fake_merged = img_mask * bgr_fake + (1 - img_mask) * target_img.astype(
            np.float32
        )
        fake_merged = fake_merged.astype(np.uint8)

        return fake_merged
