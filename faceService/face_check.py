from flask import Flask, request, jsonify
from flask_cors import CORS
CORS(app)
import cv2
import numpy as np
import mediapipe as mp

app = Flask(__name__)

# Initialize Mediapipe face detection
mp_face = mp.solutions.face_detection
face_detection = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.6)

@app.route('/detect-face', methods=['POST'])
def detect_face():
    try:
        if 'photo' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['photo'].read()
        img_bytes = np.frombuffer(file, np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        # Convert to RGB for Mediapipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detection.process(img_rgb)

        detections_data = []

        if results.detections:
            h, w, _ = img.shape
            for detection in results.detections:
                bboxC = detection.location_data.relative_bounding_box
                # Convert relative box to pixel coords
                bbox = {
                    "xmin": int(bboxC.xmin * w),
                    "ymin": int(bboxC.ymin * h),
                    "width": int(bboxC.width * w),
                    "height": int(bboxC.height * h)
                }

                # Keypoints: eyes, nose, mouth, ears
                keypoints = []
                for kp in detection.location_data.relative_keypoints:
                    keypoints.append({
                        "x": int(kp.x * w),
                        "y": int(kp.y * h)
                    })

                detections_data.append({
                    "score": float(detection.score[0]),  # confidence
                    "bbox": bbox,
                    "keypoints": keypoints
                })

            return jsonify({
                "faceDetected": True,
                "facesCount": len(detections_data),
                "detections": detections_data
            })
        else:
            return jsonify({"faceDetected": False, "facesCount": 0, "detections": []})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)
