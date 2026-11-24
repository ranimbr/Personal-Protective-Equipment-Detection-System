import os
import uuid
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from pymongo import MongoClient
from bson import ObjectId
from .utils import get_model

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client["ppe_db"]
collection = db["detections"]

@csrf_exempt
def detect_ppe(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    # Save uploaded image
    uid = str(uuid.uuid4())
    ext = os.path.splitext(image.name)[1]
    filename = uid + ext
    upload_dir = os.path.join(settings.MEDIA_ROOT, "original")
    os.makedirs(upload_dir, exist_ok=True)
    save_path = os.path.join(upload_dir, filename)
    with open(save_path, "wb") as f:
        for chunk in image.chunks():
            f.write(chunk)

    # YOLO inference
    model = get_model()
    results = model.predict(save_path, imgsz=640, conf=0.25)
    r = results[0]

    boxes = r.boxes.xyxy.tolist()
    confs = r.boxes.conf.tolist()
    classes = r.boxes.cls.tolist()

    # Save annotated image
    ann_dir = os.path.join(settings.MEDIA_ROOT, "annotated")
    os.makedirs(ann_dir, exist_ok=True)
    r.save(filename=os.path.join(ann_dir, filename))

    # Save to MongoDB
    doc = {
        "filename": filename,
        "original_path": os.path.join("media/original", filename),
        "annotated_path": os.path.join("media/annotated", filename),
        "boxes": boxes,
        "classes": classes,
        "confidences": confs,
        "created_at": datetime.datetime.utcnow(),
    }
    inserted = collection.insert_one(doc)

    return JsonResponse({
        "id": str(inserted.inserted_id),
        "annotated": f"/media/annotated/{filename}",
        "boxes": boxes,
        "classes": classes,
        "confidences": confs
    })


def get_result(request, id):
    doc = collection.find_one({"_id": ObjectId(id)})
    if not doc:
        return JsonResponse({"error": "Not found"}, status=404)

    doc["_id"] = str(doc["_id"])
    doc["created_at"] = doc["created_at"].isoformat()
    return JsonResponse(doc)
