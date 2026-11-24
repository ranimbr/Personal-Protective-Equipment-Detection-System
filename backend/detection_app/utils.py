from ultralytics import YOLO
import os

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "..",
    "model",
    "best.pt"
)
MODEL_PATH = os.getenv("PPE_MODEL_PATH", DEFAULT_MODEL_PATH)

_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            print(f"[PPE Warning] Custom model not found at '{MODEL_PATH}'.")
            print("[PPE Info] Falling back to 'yolov8n.pt' for demonstration/fallback.")
            _model = YOLO("yolov8n.pt")
        else:
            print(f"[PPE Info] Loading YOLO PPE model from '{MODEL_PATH}'...")
            _model = YOLO(MODEL_PATH)
    return _model
