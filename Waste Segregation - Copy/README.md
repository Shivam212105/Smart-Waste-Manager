# Waste Segregation Assistant

Simple Flask app that classifies waste items via image or text and suggests disposal tips.

## Setup (Windows PowerShell)

```
cd "E:\PROJECT FOLDERS\Waste Segregation"
py -3 -m venv .venv
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Train

Add a few sample images to `data/samples/<category>/` (e.g., `organic`, `recyclable`, `hazardous`, `landfill`). Then run:

```
python model/train.py
```

## Run

```
python app.py
```

Open http://127.0.0.1:5000 and test.


