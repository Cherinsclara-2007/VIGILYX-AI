import cv2
import subprocess
from pathlib import Path
from datetime import datetime


class SecurityRecorder:

    def __init__(self):
        self.recording = False
        self.video_writer = None
        self.frame_count = 0
        self.filename = None
        self.frame_size = None

        self.recordings_folder = (
            Path(__file__).resolve().parent / "recordings"
        )
        self.recordings_folder.mkdir(
            parents=True,
            exist_ok=True
        )

        # FFmpeg executable path
        self.ffmpeg_path = (
            r"C:\Users\cheri\Downloads\ffmpeg-9.0.2-essentials_build"
            r"\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
        )

    def start_recording(self, frame):

        if self.recording:
            return

        if frame is None or frame.size == 0:
            print("ERROR: Invalid frame. Recording not started.")
            return

        height, width = frame.shape[:2]

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        # Temporary AVI file
        filename = (
            self.recordings_folder
            / f"alert_{timestamp}.avi"
        )

        fourcc = cv2.VideoWriter_fourcc(*"XVID")

        writer = cv2.VideoWriter(
            str(filename),
            fourcc,
            20.0,
            (width, height)
        )

        if not writer.isOpened():
            print("ERROR: Could not start video recording.")
            writer.release()
            return

        self.video_writer = writer
        self.filename = filename
        self.frame_size = (width, height)
        self.frame_count = 0
        self.recording = True

        print(f"[RECORDING STARTED] {filename}")

        self.write_frame(frame)

    def write_frame(self, frame):

        if not self.recording or self.video_writer is None:
            return

        if frame is None or frame.size == 0:
            return

        height, width = frame.shape[:2]
        expected_width, expected_height = self.frame_size

        if (width, height) != (
            expected_width,
            expected_height
        ):
            frame = cv2.resize(
                frame,
                (expected_width, expected_height)
            )

        self.video_writer.write(frame)
        self.frame_count += 1

    def stop_recording(self):

        if self.video_writer is None:
            self.recording = False
            return

        writer = self.video_writer
        avi_filename = self.filename
        frames = self.frame_count

        # Reset recording state
        self.recording = False
        self.video_writer = None
        self.filename = None
        self.frame_size = None
        self.frame_count = 0

        # Close AVI file before conversion
        writer.release()

        print(f"[FRAMES SAVED] {frames}")
        print(f"[RECORDING SAVED] {avi_filename}")

        if frames == 0 or not avi_filename.exists():
            print("ERROR: Recording file was not created properly.")
            return

        mp4_filename = avi_filename.with_suffix(".mp4")

        command = [
            self.ffmpeg_path,
            "-y",
            "-i", str(avi_filename),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-an",
            str(mp4_filename)
        ]

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode == 0 and mp4_filename.exists():
                print(f"[MP4 CONVERSION SUCCESS] {mp4_filename}")

                # Delete AVI only after successful conversion.
                avi_filename.unlink(missing_ok=True)
                print("[TEMPORARY AVI DELETED]")
            else:
                print("[MP4 CONVERSION FAILED]")
                print(result.stderr[-3000:])
                print(f"[ORIGINAL AVI KEPT] {avi_filename}")

        except FileNotFoundError:
            print("ERROR: FFmpeg was not found. Check ffmpeg_path.")
            print(f"[ORIGINAL AVI KEPT] {avi_filename}")

        except subprocess.TimeoutExpired:
            print("ERROR: FFmpeg conversion timed out.")
            print(f"[ORIGINAL AVI KEPT] {avi_filename}")

        except Exception as error:
            print(f"ERROR during MP4 conversion: {error}")
            print(f"[ORIGINAL AVI KEPT] {avi_filename}")

    def close(self):
        self.stop_recording()