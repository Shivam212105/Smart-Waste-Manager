import numpy as np
from PIL import Image
import json

def extract_features_from_path(path, bins=16):
    img = Image.open(path).convert("RGB").convert("HSV").resize((128,128))
    return extract_features(img, bins)

def extract_features(pil_img, bins=16):
    """Extract features from PIL Image object"""
    img = pil_img.convert("RGB").convert("HSV").resize((128,128))
    arr = np.array(img)
    h, s, v = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    hist_h, _ = np.histogram(h, bins=bins, range=(0,255), density=True)
    hist_s, _ = np.histogram(s, bins=bins, range=(0,255), density=True)
    hist_v, _ = np.histogram(v, bins=bins, range=(0,255), density=True)
    feat = np.concatenate([hist_h, hist_s, hist_v]).astype(np.float32)
    return feat

