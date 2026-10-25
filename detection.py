import cv2
import time
from ultralytics import YOLO
from datetime import datetime
from pathlib import Path

from recorder import SecurityRecorder


# ==================================================
# CONFIGURATION
# ==================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "yolo11n.pt"
LOG_FILE = BASE_DIR / "security_log.txt"

CAMERA_INDEX = 0
CONFIDENCE_THRESHOLD = 0.35

ALERT_COOLDOWN = 5.0
RECORDING_GRACE_PERIOD = 2.0


# ==================================================
# LOAD YOLO MODEL
# ==================================================

print("Loading YOLO model...")

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"YOLO model not found: {MODEL_PATH}"
    )

model = YOLO(str(MODEL_PATH))

print("YOLO model loaded successfully!")


# ==================================================
# SECURITY EVENT LOGGING
# ==================================================

def save_security_alert(timestamp):
    """Save an intrusion alert to the security log."""

    message = (
        f"[{timestamp}] "
        "ALERT: Person detected in restricted zone.\n"
    )

    with open(LOG_FILE, "a", encoding="utf-8") as file:
        file.write(message)

    print(message.strip())


# ==================================================
# MAIN SURVEILLANCE FUNCTION
# ==================================================

def start_surveillance():

    camera = cv2.VideoCapture(CAMERA_INDEX)

    if not camera.isOpened():
        print("ERROR: Could not access the webcam.")
        camera.release()
        return

    recorder = SecurityRecorder()

    last_alert_time = 0.0
    last_person_inside_time = None

    print("\n==========================================")
    print(" VIGILYX AI - SMART VIDEO SURVEILLANCE")
    print("==========================================")
    print("Webcam: Connected")
    print("Person Detection: Active")
    print("Restricted Zone: Active")
    print("Security Logging: Active")
    print("Video Recording: Active")
    print("Press Q to stop surveillance.\n")

    try:
        while True:

            # --------------------------------------
            # READ CAMERA FRAME
            # --------------------------------------

            success, frame = camera.read()

            if not success or frame is None:
                print("WARNING: Could not read camera frame.")
                time.sleep(0.1)
                continue

            height, width = frame.shape[:2]

            # --------------------------------------
            # DEFINE RESTRICTED ZONE
            # --------------------------------------

            x1 = int(width * 0.30)
            y1 = int(height * 0.25)
            x2 = int(width * 0.70)
            y2 = int(height * 0.80)

            # --------------------------------------
            # YOLO PERSON DETECTION
            # --------------------------------------

            results = model(
                frame,
                conf=CONFIDENCE_THRESHOLD,
                verbose=False
            )
            person_count = 0
            person_inside = False

            for box in results[0].boxes:

                class_id = int(box.cls[0])

                # COCO class 0 represents a person
                if class_id != 0:
                    continue
                    person_count += 1
                bx1, by1, bx2, by2 = map(
                    int,
                    box.xyxy[0].tolist()
                )

                confidence = float(box.conf[0])

                center_x = (bx1 + bx2) // 2
                center_y = (by1 + by2) // 2

                inside_zone = (
                    x1 <= center_x <= x2
                    and y1 <= center_y <= y2
                )

                if inside_zone:
                    person_inside = True
                    box_color = (0, 0, 255)
                    label = "RESTRICTED ZONE INTRUSION"
                else:
                    box_color = (0, 255, 0)
                    label = "PERSON"

                # Draw bounding box
                cv2.rectangle(
                    frame,
                    (bx1, by1),
                    (bx2, by2),
                    box_color,
                    2
                )

                # Draw label
                label_y = max(by1 - 10, 20)

                cv2.putText(
                    frame,
                    f"{label} {confidence:.2f}",
                    (bx1, label_y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    box_color,
                    2
                )

                # Draw centre point
                cv2.circle(
                    frame,
                    (center_x, center_y),
                    4,
                    box_color,
                    -1
                )

            # --------------------------------------
            # DRAW RESTRICTED ZONE
            # --------------------------------------

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 0, 255),
                2
            )

            cv2.putText(
                frame,
                "RESTRICTED ZONE",
                (x1, max(y1 - 10, 25)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2
            )

            current_time = time.monotonic()

            # --------------------------------------
            # INTRUSION DETECTED
            # --------------------------------------

            if person_inside:

                last_person_inside_time = current_time

                cv2.putText(
                    frame,
                    "SECURITY ALERT!",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (0, 0, 255),
                    2
                )

                # Start recording once per intrusion episode
                if not recorder.recording:
                    recorder.start_recording(frame)

                # Save current frame
                recorder.write_frame(frame)

                # Log alerts periodically
                if current_time - last_alert_time >= ALERT_COOLDOWN:

                    timestamp = datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )

                    save_security_alert(timestamp)
                    last_alert_time = current_time

            # --------------------------------------
            # NO PERSON IN RESTRICTED ZONE
            # --------------------------------------

            else:

                cv2.putText(
                    frame,
                    "STATUS: NORMAL",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 200, 0),
                    2
                )

                if recorder.recording:

                    if last_person_inside_time is None:
                        last_person_inside_time = current_time

                    elapsed = (
                        current_time - last_person_inside_time
                    )

                    if elapsed >= RECORDING_GRACE_PERIOD:

                        recorder.stop_recording()
                        last_person_inside_time = None

            # --------------------------------------
            # DISPLAY CAMERA
            # --------------------------------------

            cv2.imshow(
                "VIGILYX AI - Smart Video Surveillance",
                frame
            )

            # Press Q to exit
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        print("\nSurveillance interrupted by user.")

    except Exception as error:
        print(f"\nSURVEILLANCE ERROR: {error}")
        raise

    finally:

        # Close any active recording
        recorder.close()

        # Release webcam
        camera.release()

        # Close OpenCV windows
        cv2.destroyAllWindows()

        print("\nSurveillance stopped.")
        print("Camera released successfully.")
        print(f"Security log: {LOG_FILE}")


# ==================================================
# PROGRAM ENTRY POINT
# ==================================================

if __name__ == "__main__":
    start_surveillance()