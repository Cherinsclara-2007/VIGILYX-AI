from flask import (
    Flask,
    jsonify,
    Response,
    send_from_directory,
    abort
)
from pathlib import Path
from camera_stream import CameraStream
from datetime import datetime
import cv2
import time
from collections import Counter
from datetime import datetime, timedelta
# ==================================================
# INITIALIZATION
# ==================================================

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR
RECORDINGS_DIR = BASE_DIR / "recordings"
LOG_FILE = BASE_DIR / "security_log.txt"

RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

# Shared camera stream controller
camera_stream = CameraStream()

def read_security_events():
    """Read and parse events from security_log.txt."""
    events = []

    if not LOG_FILE.exists():
        return events

    with LOG_FILE.open("r", encoding="utf-8", errors="replace") as file:
        for line in file:
            line = line.strip()

            if not line:
                continue

            # Expected format:
            # [2026-10-21 20:36:46] ALERT: Person detected in restricted zone.
            try:
                closing_bracket = line.index("]")
                timestamp_text = line[1:closing_bracket]
                message = line[closing_bracket + 1:].strip()

                timestamp = datetime.strptime(
                    timestamp_text, "%Y-%m-%d %H:%M:%S"
                )

                is_alert = "ALERT" in message.upper()

                events.append({
                    "time": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "timestamp": timestamp,
                    "message": message,
                    "type": "Intrusion Alert" if is_alert else "System Event",
                    "severity": "high" if is_alert else "low",
                })

            except (ValueError, IndexError):
                # Skip malformed lines rather than crashing the dashboard.
                continue

    return events
def build_analytics(events):
    now = datetime.now()
    today = now.date()
    last_7_days_start = today - timedelta(days=6)

    # Hourly chart: alerts recorded during the last 24 hours.
    last_24_hours = now - timedelta(hours=24)

    recent_alerts = [
        event for event in events
        if event["severity"] == "high"
        and last_24_hours <= event["timestamp"] <= now
    ]

    hourly_counts = Counter(
        event["timestamp"].hour
        for event in recent_alerts
    )

    hourly = [
        {
            "hour": f"{hour:02d}:00",
            "count": hourly_counts[hour]
        }
        for hour in range(24)
    ]

    # Weekly chart: alerts from the last seven calendar days.
    daily_counts = Counter(
        event["timestamp"].date()
        for event in events
        if event["severity"] == "high"
        and last_7_days_start <= event["timestamp"].date() <= today
    )

    weekly = [
        {
            "day": (
                last_7_days_start + timedelta(days=offset)
            ).strftime("%d %b"),
            "count": daily_counts[
                last_7_days_start + timedelta(days=offset)
            ]
        }
        for offset in range(7)
    ]

    # Event type distribution from actual parsed log entries.
    type_counts = Counter(
        event["type"] for event in events
    )

    types = [
        {"type": event_type, "count": count}
        for event_type, count in type_counts.items()
    ]

    return hourly, weekly, types


# ==================================================
# FRONTEND ROUTES
# ==================================================

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ==================================================
# CAMERA CONTROL
# ==================================================

@app.route("/api/camera/start", methods=["POST"])
def start_camera():
    success = camera_stream.start()

    if not success:
        return jsonify({
            "status": "error",
            "message": (
                "Camera could not be opened. "
                "Check the connection or close other apps "
                "using the webcam."
            )
        }), 500

    return jsonify({
        "status": "success",
        "message": "Camera monitoring started."
    })


@app.route("/api/camera/stop", methods=["POST"])
def stop_camera():
    camera_stream.stop()

    return jsonify({
        "status": "success",
        "message": "Camera monitoring stopped."
    })


# ==================================================
# LIVE CAMERA STREAM
# ==================================================

@app.route("/api/camera/stream")
def camera_video_stream():

    def generate_frames():

        while camera_stream.running:

            frame = camera_stream.get_frame()

            if frame is None:
                time.sleep(0.05)
                continue

            success, buffer = cv2.imencode(".jpg", frame)

            if not success:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )

            time.sleep(0.03)

    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ==================================================
# RECORDING FILES
# ==================================================

def get_recording_files():
    """Return supported video files, newest first."""

    if not RECORDINGS_DIR.exists():
        return []

    allowed_extensions = {".avi", ".mp4"}

    files = [
        file
        for file in RECORDINGS_DIR.iterdir()
        if file.is_file()
        and file.suffix.lower() in allowed_extensions
    ]

    return sorted(
        files,
        key=lambda file: file.stat().st_mtime,
        reverse=True
    )


# ==================================================
# DASHBOARD API
# ==================================================

@app.route("/api/dashboard")
def dashboard():
    # Read all events using the helper function from Step 1
    all_events = read_security_events()

    # Latest 20 events for the dashboard
    latest_events = list(reversed(all_events[-20:]))

    events = []

    for index, event in enumerate(latest_events, start=1):
        events.append({
            "id": index,
            "time": event["time"],
            "message": event["message"],
            "severity": event["severity"],
            "type": event["type"]
        })

    # Count security alerts
    alert_count = sum(
        1 for event in all_events
        if event["severity"] == "high"
    )

    # Count recording files
    recording_files = get_recording_files()
    recording_count = len(recording_files)

    recordings = []

    for file in recording_files:
        try:
            file_size = file.stat().st_size
            modified_time = datetime.fromtimestamp(
                file.stat().st_mtime
            )

            recordings.append({
                "file": file.name,
                "date": modified_time.strftime("%Y-%m-%d %H:%M"),
                "duration": "Recorded video",
                "size": f"{file_size / (1024 * 1024):.2f} MB"
            })

        except OSError:
            continue

    # Generate analytics from the parsed log events
    hourly, weekly, types = build_analytics(all_events)
    print(
        "DEBUG:",
        "Camera running =", camera_stream.running,
        "| Total detections =", camera_stream.get_total_detections()
    )
    return jsonify({
        "stats": {
            "detections": camera_stream.get_total_detections(),
            "alerts": len(events),
            "recordings": len(recordings),
            "system": "Online" if camera_stream.running else "Idle"
        },
        "events": events,
        "recordings": recordings,
        "hourly": hourly,
        "weekly": weekly,
        "types": types
    })


# ==================================================
# SERVE RECORDED VIDEOS
# ==================================================

@app.route("/api/recordings/<path:filename>")
def serve_recording(filename):

    # Only permit supported video formats
    if Path(filename).suffix.lower() not in {".avi", ".mp4"}:
        abort(403)

    # Prevent requests for files outside the recordings folder
    safe_name = Path(filename).name

    if safe_name != filename or filename in {".", ".."}:
        abort(403)

    file_path = RECORDINGS_DIR / safe_name

    if not file_path.is_file():
        abort(404)

    return send_from_directory(
        RECORDINGS_DIR,
        safe_name,
        conditional=True
    )


# ==================================================
# HEALTH CHECK
# ==================================================

@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "online",
        "application": "VIGILYX AI",
        "time": datetime.now().isoformat(timespec="seconds")
    })


# ==================================================
# APPLICATION ENTRY POINT
# ==================================================

if __name__ == "__main__":

    print("======================================")
    print(" VIGILYX AI BACKEND")
    print("======================================")
    print("Dashboard: http://127.0.0.1:5000")
    print("Health:    http://127.0.0.1:5000/api/health")
    print("Dashboard API: http://127.0.0.1:5000/api/dashboard")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        threaded=True
    )
