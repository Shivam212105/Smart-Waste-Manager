from pathlib import Path
import json, joblib
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from .image_features import extract_features_from_path

BASE = Path(__file__).resolve().parents[1]
TRAIN_DIR = BASE / "data" / "samples"
MODEL_PATH = BASE / "model" / "model.pkl"
LABELS_PATH = BASE / "model" / "label_map.json"

def collect_data(root: Path):
    X, y, label_to_id = [], [], {}
    cid = 0
    for cls_dir in sorted([p for p in root.iterdir() if p.is_dir()]):
        label = cls_dir.name.lower()
        if label not in label_to_id:
            label_to_id[label] = cid
            cid += 1
        for img in cls_dir.glob("*.*"):
            try:
                feat = extract_features_from_path(img)
                X.append(feat)
                y.append(label_to_id[label])
            except Exception:
                pass
    if len(X) == 0:
        return np.array([]).reshape(0, 48), np.array([]), {}
    return np.vstack(X), np.array(y), label_to_id

def main():
    X, y, l2i = collect_data(TRAIN_DIR)
    if len(y) < 10:
        raise SystemExit("Add a few sample images per class under data/samples/<class>/")
    knn = KNeighborsClassifier(n_neighbors=3, weights="distance")
    knn.fit(X, y)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(knn, MODEL_PATH)
    with open(LABELS_PATH, "w", encoding="utf-8") as f:
        json.dump({str(v):k for k,v in l2i.items()}, f, indent=2)
    print("Saved:", MODEL_PATH, LABELS_PATH)

if __name__ == "__main__":
    main()
