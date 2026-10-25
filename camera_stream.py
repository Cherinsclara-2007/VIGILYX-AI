import cv2
import threading
import time
from datetime import datetime
from pathlib import Path
from ultralytics import YOLO

from recorder import SecurityRecorder


class CameraStream:

    def __init__(self, model_path="yolo11n.pt"):

        self.base_dir = Path(__file__).resolve().parent
        self.detection_count_lock = threading.Lock()
        self.total_detections = 0
        supplied_path = Path(model_path)
        if not supplied_path.is_absolute():
            supplied_path = self.base_dir / supplied_path

        self.model_path = supplied_path

        self.model = None
        self.camera = None
        self.latest_frame = None

        self.running = False
        self.thread = None

        self.lock = threading.Lock()
        self.lifecycle_lock = threading.Lock()

        self.recorder = SecurityRecorder()
        self.log_file = self.base_dir / "security_log.txt"

        self.last_alert_time = 0

        # Keep recording briefly after the last detected intrusion.
        self.recording_grace_period = 2.0
        self.last_intrusion_time = 0

        # Detection confidence threshold.
        self.confidence_threshold = 0.35

    # ==================================================
    # START CAMERA
    # ==================================================

    def start(self):

        with self.lifecycle_lock:

            if self.running:
                return True

            if not self.model_path.is_file():
                print(f"ERROR: YOLO model not found: {self.model_path}")
                return False

            try:
                print("Loading YOLO model...")

                self.model = YOLO(str(self.model_path))

                print("Opening webcam...")

                self.camera = cv2.VideoCapture(0)

                if not self.camera.isOpened():
                    print("ERROR: Could not open webcam.")

                    self.camera.release()
                    self.camera = None
                    self.model = None

                    return False

                self.last_alert_time = 0
                self.last_intrusion_time = 0

                self.running = True

                self.thread = threading.Thread(
                    target=self._process_frames,
                    daemon=True
                )

                self.thread.start()

                print("VIGILYX AI camera monitoring started.")

                return True

            except Exception as error:

                print(f"ERROR starting camera: {error}")

                self.running = False

                if self.camera is not None:
                    self.camera.release()
                    self.camera = None

                self.model = None

                return False

    # ==================================================
    # PROCESS CAMERA FRAMES
    # ==================================================

    def _process_frames(self):

        try:

            while self.running and self.camera is not None:

                success, frame = self.camera.read()

                if not success:
                    time.sleep(0.05)
                    continue

                height, width = frame.shape[:2]

                # --------------------------------------
                # RESTRICTED ZONE
                # --------------------------------------

                x1 = int(width * 0.30)
                y1 = int(height * 0.25)
                x2 = int(width * 0.70)
                y2 = int(height * 0.80)

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
                    (x1, max(25, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2
                )

                # --------------------------------------
                # YOLO DETECTION
                # --------------------------------------
                person_count = 0
                results = self.model(
                    frame,
                    verbose=False,
                    conf=self.confidence_threshold
                )

                intrusion = False

                for result in results:

                    for box in result.boxes:

                        # COCO class 0 = person
                        if int(box.cls[0]) != 0:
                            continue
                        person_count += 1

                        with self.detection_count_lock:
                            self.total_detections += 1
                        bx1, by1, bx2, by2 = map(
                            int,
                            box.xyxy[0].tolist()
                        )

                        center_x = (bx1 + bx2) // 2
                        center_y = (by1 + by2) // 2

                        inside_zone = (
                            x1 <= center_x <= x2
                            and y1 <= center_y <= y2
                        )

                        color = (
                            (0, 0, 255)
                            if inside_zone
                            else (0, 255, 0)
                        )

                        label = (
                            "INTRUSION ALERT"
                            if inside_zone
                            else "Person"
                        )

                        cv2.rectangle(
                            frame,
                            (bx1, by1),
                            (bx2, by2),
                            color,
                            2
                        )

                        cv2.putText(
                            frame,
                            label,
                            (bx1, max(20, by1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            color,
                            2
                        )

                        if inside_zone:
                            intrusion = True

                # --------------------------------------
                # INTRUSION RESPONSE
                # --------------------------------------

                now = time.time()

                if intrusion:

                    self.last_intrusion_time = now

                    cv2.putText(
                        frame,
                        "WARNING: RESTRICTED ZONE BREACH",
                        (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.65,
                        (0, 0, 255),
                        2
                    )

                    # Start recording once.
                    # start_recording() saves its first frame.
                    if not self.recorder.recording:
                        self.recorder.start_recording(frame)

                    else:
                        self.recorder.write_frame(frame)

                    # Log alerts no more than once every 5 seconds.
                    if now - self.last_alert_time >= 5:

                        timestamp = datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )

                        with open(
                            self.log_file,
                            "a",
                            encoding="utf-8"
                        ) as log:

                            log.write(
                                f"[{timestamp}] ALERT: "
                                "Person detected in restricted zone.\n"
                            )

                        print(
                            f"[SECURITY ALERT] {timestamp}"
                        )

                        self.last_alert_time = now

                # --------------------------------------
                # CONTINUE RECORDING DURING SHORT GAPS
                # --------------------------------------

                elif self.recorder.recording:

                    elapsed = (
                        now - self.last_intrusion_time
                    )

                    if elapsed < self.recording_grace_period:

                        # Keep the short gap inside the same clip.
                        self.recorder.write_frame(frame)

                    else:

                        self.recorder.stop_recording()

                # --------------------------------------
                # SHARE LATEST FRAME WITH FLASK
                # --------------------------------------

                with self.lock:
                    self.latest_frame = frame.copy()

        except Exception as error:

            print(f"CAMERA PROCESSING ERROR: {error}")

        finally:

            self.running = False

            self.recorder.close()

            self._release_camera()

            print("VIGILYX AI camera processing stopped.")

    # ==================================================
    # GET LATEST FRAME
    # ==================================================

    def get_frame(self):

        with self.lock:

            if self.latest_frame is None:
                return None

            return self.latest_frame.copy()

    # ==================================================
    # STOP CAMERA
    # ==================================================

    def stop(self):

        self.running = False

        current_thread = threading.current_thread()

        if (
            self.thread
            and self.thread.is_alive()
            and self.thread is not current_thread
        ):
            self.thread.join(timeout=5)

        # Do not release the camera while the worker is
        # still reading from it.
        if self.thread and self.thread.is_alive():
            print(
                "Camera thread is still stopping. "
                "Wait before restarting the camera."
            )
            return

        self.recorder.close()
        self._release_camera()

        with self.lock:
            self.latest_frame = None

        self.model = None
        self.thread = None

        print("Camera released successfully.")

    # ==================================================
    # RELEASE CAMERA
    # ==================================================
    def get_total_detections(self):
        with self.detection_count_lock:
            return self.total_detections
        
    def _release_camera(self):

        if self.camera is not None:

            self.camera.release()
            self.camera = None