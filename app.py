import streamlit as st
from pathlib import Path
from datetime import datetime
import subprocess
import sys

# -----------------------------------------
# PAGE CONFIGURATION
# -----------------------------------------

st.set_page_config(
    page_title="AI Surveillance Dashboard",
    page_icon="🛡️",
    layout="wide"
)

# -----------------------------------------
# PROJECT PATHS
# -----------------------------------------

BASE_DIR = Path(__file__).parent
LOG_FILE = BASE_DIR / "security_log.txt"
RECORDINGS_DIR = BASE_DIR / "recordings"

RECORDINGS_DIR.mkdir(exist_ok=True)

# -----------------------------------------
# CUSTOM STYLING
# -----------------------------------------

st.markdown("""
<style>
    .stApp {
        background-color: #0b1120;
        color: #f1f5f9;
    }

    .main-title {
        font-size: 34px;
        font-weight: bold;
        color: #38bdf8;
    }

    .subtitle {
        font-size: 16px;
        color: #94a3b8;
    }

    .metric-card {
        background-color: #172033;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #334155;
    }

    div[data-testid="stMetric"] {
        background-color: #172033;
        border: 1px solid #334155;
        padding: 15px;
        border-radius: 10px;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------
# HEADER
# -----------------------------------------

st.markdown(
    '<div class="main-title">🛡️ Smart Autonomous Video Surveillance</div>',
    unsafe_allow_html=True
)

st.markdown(
    '<div class="subtitle">AI-powered person detection, restricted-zone monitoring, and security event management</div>',
    unsafe_allow_html=True
)

st.divider()

# -----------------------------------------
# READ SECURITY LOG
# -----------------------------------------

if LOG_FILE.exists():
    log_entries = [
        line.strip()
        for line in LOG_FILE.read_text(
            encoding="utf-8"
        ).splitlines()
        if line.strip()
    ]
else:
    log_entries = []

# -----------------------------------------
# FIND RECORDINGS
# -----------------------------------------

recordings = sorted(
    RECORDINGS_DIR.glob("*.avi"),
    key=lambda path: path.stat().st_mtime,
    reverse=True
)

# -----------------------------------------
# SYSTEM STATUS
# -----------------------------------------

col1, col2, col3 = st.columns(3)

with col1:
    st.metric(
        "Security Events",
        len(log_entries)
    )

with col2:
    st.metric(
        "Recorded Videos",
        len(recordings)
    )

with col3:
    st.metric(
        "AI Detection",
        "YOLO"
    )

st.divider()

# -----------------------------------------
# SURVEILLANCE CONTROL
# -----------------------------------------

st.subheader("🎥 Surveillance Control")

st.info(
    "The webcam detection program and this dashboard run separately. "
    "Start the detection program in a terminal to activate surveillance."
)

if st.button("▶ Start Surveillance", use_container_width=True):

    if st.session_state.get("surveillance_process") is None:
        process = subprocess.Popen(
            [sys.executable, str(BASE_DIR / "detection.py")],
            cwd=str(BASE_DIR)
        )

        st.session_state["surveillance_process"] = process

        st.success("Surveillance program started.")

    else:
        process = st.session_state["surveillance_process"]

        if process.poll() is None:
            st.warning("Surveillance is already running.")
        else:
            process = subprocess.Popen(
                [sys.executable, str(BASE_DIR / "detection.py")],
                cwd=str(BASE_DIR)
            )

            st.session_state["surveillance_process"] = process

            st.success("Surveillance program restarted.")

# -----------------------------------------
# SECURITY EVENT HISTORY
# -----------------------------------------

st.subheader("🚨 Security Event History")

if log_entries:
    for entry in reversed(log_entries[-10:]):
        st.warning(entry)
else:
    st.info("No security events have been logged yet.")

# -----------------------------------------
# RECORDING LIBRARY
# -----------------------------------------

st.subheader("🎬 Recorded Video Library")

if recordings:

    for recording in recordings[:10]:

        with st.expander(recording.name):

            st.caption(
                f"File size: {recording.stat().st_size / (1024 * 1024):.2f} MB"
            )

            try:
                with open(recording, "rb") as video_file:
                    st.video(video_file.read())
            except OSError:
                st.error("Could not open this recording.")

else:
    st.info("No recorded videos available yet.")

# -----------------------------------------
# FOOTER
# -----------------------------------------

st.divider()

st.caption(
    "Smart Autonomous Video Surveillance System | "
    f"Dashboard refreshed at {datetime.now().strftime('%H:%M:%S')}"
)

if st.button("🔄 Refresh Dashboard"):
    st.rerun()