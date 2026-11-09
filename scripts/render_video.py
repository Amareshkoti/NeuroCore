"""
NEUROCORE - render the 60 s LinkedIn video from video/neurocore_video.html.

1. Takes screenshots of the running workstation (needs scripts/run_server.py on :8000).
2. Renders every frame of the HTML timeline in headless Chrome at 1920x1080, 30 fps.
3. Pipes the frames to ffmpeg (bundled with imageio-ffmpeg) and writes H.264 MP4.

Needs: selenium + Chrome, and ffmpeg (imageio-ffmpeg, or set FFMPEG_EXE).
    python scripts/render_video.py [--skip-shots] [--frames N]
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.request

from selenium import webdriver

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VIDEO_DIR = os.path.join(ROOT, "video")
SHOTS = os.path.join(VIDEO_DIR, "shots")
OUT = os.path.join(ROOT, "linkedin_neurocore_presentation.mp4")
APP = "http://127.0.0.1:8000"
FPS, DURATION = 30, 60


def chrome(width, height):
    opts = webdriver.ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument(f"--window-size={width},{height}")
    opts.add_argument("--hide-scrollbars")
    opts.add_argument("--force-device-scale-factor=1")
    opts.add_argument("--allow-file-access-from-files")
    d = webdriver.Chrome(options=opts)
    d.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": False})
    return d


def api(path, body=None):
    req = urllib.request.Request(f"{APP}/api{path}", method="POST", data=json.dumps(body or {}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def take_shots():
    os.makedirs(SHOTS, exist_ok=True)
    d = chrome(1600, 1000)
    try:
        api("/simulation/create", {"num_neurons": 1000, "model_type": "lif", "excitatory_ratio": 0.8, "connection_probability": 0.03, "seed": 42})
        d.get(f"{APP}/#laboratory")
        time.sleep(2)
        api("/simulation/start")
        api("/simulation/inject", {"target_cluster": "all", "amplitude_na": 2.4, "duration_ms": 20})
        time.sleep(9)
        d.save_screenshot(os.path.join(SHOTS, "lab.png"))

        d.get(f"{APP}/#visualization")
        time.sleep(6)
        d.save_screenshot(os.path.join(SHOTS, "network.png"))

        api("/simulation/pause")
        d.get(f"{APP}/#memory")
        time.sleep(2)
        d.execute_script("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Recall').click()")
        time.sleep(10)
        d.execute_script("window.scrollTo(0, 0)")
        d.save_screenshot(os.path.join(SHOTS, "memory.png"))
    finally:
        d.quit()
    print("screenshots saved to", SHOTS)


def data_url(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return os.environ.get("FFMPEG_EXE", "ffmpeg")


def render(max_frames=None):
    with open(os.path.join(VIDEO_DIR, "video_data.json")) as f:
        data = json.load(f)
    images = {k: data_url(os.path.join(SHOTS, f"{k}.png")) for k in ("lab", "network", "memory") if os.path.exists(os.path.join(SHOTS, f"{k}.png"))}

    def open_page():
        drv = chrome(1920, 1080)
        drv.set_script_timeout(60)
        drv.get("file:///" + os.path.join(VIDEO_DIR, "neurocore_video.html").replace("\\", "/") + "?capture")
        drv.execute_async_script("const done = arguments[arguments.length - 1]; window.__init(arguments[0], arguments[1]).then(done);", data, images)
        return drv

    total = max_frames or FPS * DURATION
    cmd = [
        ffmpeg_exe(), "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", OUT,
    ]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    d = open_page()
    t0 = time.time()
    i = 0
    retries = 0
    while i < total:
        try:
            d.execute_script("render(arguments[0])", i / FPS)
            shot = d.execute_cdp_cmd("Page.captureScreenshot", {"format": "png", "clip": {"x": 0, "y": 0, "width": 1920, "height": 1080, "scale": 1}})
        except Exception as e:  # headless Chrome occasionally dies on long runs; restart and redo this frame
            retries += 1
            print(f"frame {i}: browser error ({type(e).__name__}), restarting [{retries}]", flush=True)
            if retries > 10:
                raise
            try:
                d.quit()
            except Exception:
                pass
            d = open_page()
            continue
        ff.stdin.write(base64.b64decode(shot["data"]))
        if i % 150 == 0:
            print(f"frame {i}/{total}  {time.time() - t0:.0f}s", flush=True)
        i += 1
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg failed")
    d.quit()
    print("wrote", OUT)


def stills(times):
    """Save single frames as PNG for review."""
    with open(os.path.join(VIDEO_DIR, "video_data.json")) as f:
        data = json.load(f)
    images = {k: data_url(os.path.join(SHOTS, f"{k}.png")) for k in ("lab", "network", "memory") if os.path.exists(os.path.join(SHOTS, f"{k}.png"))}
    d = chrome(1920, 1080)
    d.set_script_timeout(60)
    d.get("file:///" + os.path.join(VIDEO_DIR, "neurocore_video.html").replace("\\", "/") + "?capture")
    d.execute_async_script("const done = arguments[arguments.length - 1]; window.__init(arguments[0], arguments[1]).then(done);", data, images)
    out = os.environ.get("STILLS_DIR", os.path.join(VIDEO_DIR, "stills"))
    os.makedirs(out, exist_ok=True)
    for t in times:
        d.execute_script("render(arguments[0])", t)
        shot = d.execute_cdp_cmd("Page.captureScreenshot", {"format": "png", "clip": {"x": 0, "y": 0, "width": 1920, "height": 1080, "scale": 1}})
        with open(os.path.join(out, f"t{t:05.1f}.png"), "wb") as f:
            f.write(base64.b64decode(shot["data"]))
    d.quit()
    print("stills in", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-shots", action="store_true")
    ap.add_argument("--frames", type=int)
    ap.add_argument("--stills", type=str, help="comma-separated times in seconds; writes PNGs instead of video")
    a = ap.parse_args()
    if a.stills:
        stills([float(x) for x in a.stills.split(",")])
        sys.exit(0)
    if not a.skip_shots:
        take_shots()
    render(a.frames)
