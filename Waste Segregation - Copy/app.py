from flask import Flask, request, jsonify, render_template
import os, json, csv
import numpy as np
from pathlib import Path
from datetime import datetime

# ---- Paths
BASE = Path(__file__).parent
MODEL_PATH = BASE / "model" / "model.pkl"
LABELS_PATH = BASE / "model" / "label_map.json"
RULES_PATH = BASE / "data" / "knowledge" / "rules.json"
TIPS_PATH  = BASE / "data" / "knowledge" / "city_tips.json"
FEEDBACK_CSV = BASE / "data" / "feedback.csv"

# ---- Lazy imports (keep startup fast)
from PIL import Image
import joblib
from model.image_features import extract_features

# ---- Utilities
def load_json(p): 
    with open(p, "r", encoding="utf-8") as f: 
        return json.load(f)

rules = load_json(RULES_PATH)
tips_db = load_json(TIPS_PATH)

# Safe model loading (first run before training)
clf = None
label_map = None
if MODEL_PATH.exists() and LABELS_PATH.exists():
    clf = joblib.load(MODEL_PATH)
    label_map = load_json(LABELS_PATH)

# feature extraction is imported from model.image_features

def top1_prob_from_knn(distances):
    # Convert k-NN distances to a pseudo-probability (softmax over inverse distances)
    inv = 1.0 / (distances + 1e-6)
    probs = inv / inv.sum()
    return float(probs.max())

def classify_image(file_storage, threshold=0.6):
    global clf, label_map
    if clf is None or label_map is None:
        return {"pred": "unknown", "prob": 0.0, "reason": "model_not_trained"}
    try:
        pil_img = Image.open(file_storage.stream).convert("RGB")
        x = extract_features(pil_img).reshape(1, -1)
        dist, idx = clf.kneighbors(x, n_neighbors=clf.n_neighbors, return_distance=True)
        pred = clf.predict(x)[0]
        prob = top1_prob_from_knn(dist[0])
        label = label_map[str(int(pred))]
        return {"pred": label, "prob": prob, "reason": "knn"}
    except Exception as e:
        return {"pred": "unknown", "prob": 0.0, "reason": f"image_error: {str(e)}"}

def classify_text(text):
    text_l = text.lower()
    scores = {cat:0 for cat in rules["categories"]}
    for cat, kw in rules["keywords"].items():
        for k in kw:
            if k in text_l: scores[cat] += 1
    pred = max(scores, key=scores.get)
    return pred, scores[pred]

def get_tips(city, category):
    city_key = (city or "").lower().strip()
    if city_key in tips_db["cities"] and category in tips_db["categories"]:
        base = tips_db["base"].get(category, [])
        city_add = tips_db["cities"][city_key].get(category, [])
        return list(dict.fromkeys(base + city_add))  # unique while preserving order
    # fallback to base tips only
    return tips_db["base"].get(category, [])

# ---- Flask app
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/classify", methods=["POST"])
def classify():
    text = request.form.get("text", "").strip()
    city = request.form.get("city", "chennai").strip() or "chennai"
    file = request.files.get("image")

    # Try image first if provided
    if file and file.filename:
        out = classify_image(file)
        if out["reason"] == "model_not_trained":
            # fall back to text if available
            if text:
                cat, hits = classify_text(text)
                return jsonify({"mode":"text_fallback","category":cat,"confidence":hits,"tips":get_tips(city, cat)})
            return jsonify({"mode":"error","message":"Model not trained and no text provided."}), 400
        
        if out["reason"].startswith("image_error"):
            # Invalid image - fall back to text if available
            if text:
                cat, hits = classify_text(text)
                return jsonify({"mode":"text_fallback","category":cat,"confidence":hits,"tips":get_tips(city, cat)})
            return jsonify({"mode":"error","message":"Invalid image file. Please provide a valid image or text description."}), 400

        if out["prob"] >= 0.6:
            cat = out["pred"]
            return jsonify({"mode":"image","category":cat,"confidence":out["prob"],"tips":get_tips(city, cat)})
        # low confidence → try text fallback if any
        if text:
            cat, hits = classify_text(text)
            return jsonify({"mode":"image_then_text","category":cat,"confidence":max(out['prob'], float(hits>0)), "tips":get_tips(city, cat)})
        return jsonify({"mode":"image_uncertain","category":"unsure","confidence":out["prob"],"tips":get_tips(city, "unsure")})

    # No image → text only
    if text:
        cat, hits = classify_text(text)
        return jsonify({"mode":"text","category":cat,"confidence":hits,"tips":get_tips(city, cat)})

    return jsonify({"error":"Provide an image and/or text."}), 400

@app.route("/tips", methods=["GET"])
def tips():
    city = request.args.get("city", "chennai")
    category = request.args.get("category", "organic")
    return jsonify({"city": city, "category": category, "tips": get_tips(city, category)})

@app.route("/feedback", methods=["POST"])
def feedback():
    payload = request.get_json(force=True, silent=True) or {}
    row = {
        "ts": datetime.utcnow().isoformat(),
        "input_type": payload.get("input_type","image_or_text"),
        "user_text": payload.get("user_text",""),
        "predicted": payload.get("predicted",""),
        "correct_label": payload.get("correct_label",""),
        "city": payload.get("city",""),
        "notes": payload.get("notes","")
    }
    FEEDBACK_CSV.parent.mkdir(parents=True, exist_ok=True)
    new_file = not FEEDBACK_CSV.exists()
    with open(FEEDBACK_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=row.keys())
        if new_file: w.writeheader()
        w.writerow(row)
    return jsonify({"status":"saved"})
    
if __name__ == "__main__":
    app.run(debug=True)
