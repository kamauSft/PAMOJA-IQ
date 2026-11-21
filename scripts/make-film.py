"""Build the silent sign-in loop from the three desktop photographs.

Usage: python scripts/make-film.py

It uses `ffmpeg` from PATH, or the one supplied by Python's imageio-ffmpeg.
After replacing the photographs in public/images with a real chama's pictures,
run this again so the film and the stills match.
"""

import os
import shutil
import subprocess


def ffmpeg_path() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        from imageio_ffmpeg import get_ffmpeg_exe

        return get_ffmpeg_exe()
    except ImportError as error:
        raise SystemExit("Install ffmpeg, or `pip install imageio-ffmpeg`, then try again.") from error


root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
images = [
    os.path.join(root, "public", "images", "chama-meeting-desktop.webp"),
    os.path.join(root, "public", "images", "treasurer-desk-desktop.webp"),
    os.path.join(root, "public", "images", "member-morning-desktop.webp"),
]
out = os.path.join(root, "public", "videos", "scenes.mp4")
os.makedirs(os.path.dirname(out), exist_ok=True)

# Each still sits on a soft, blurred copy of itself so the whole photograph is
# kept, then drifts slowly. A short fade joins the three scenes.
def scene(n: int) -> str:
    return (
        f"[{n}:v]fps=12,split=2[bg{n}][fg{n}];"
        f"[bg{n}]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=20:2,eq=brightness=-0.10[bg{n}b];"
        f"[fg{n}]scale=1280:720:force_original_aspect_ratio=decrease[fg{n}s];"
        f"[bg{n}b][fg{n}s]overlay=(W-w)/2:(H-h)/2,"
        f"zoompan=z='1+0.06*on/96':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1280x720:fps=12,"
        f"fps=12,trim=duration=8,setpts=PTS-STARTPTS,"
        f"fade=t=in:st=0:d=0.6,fade=t=out:st=7.4:d=0.6[s{n}];"
    )


filter_complex = "".join(scene(n) for n in range(3)) + "[s0][s1][s2]concat=n=3:v=1:a=0[v]"

command = [ffmpeg_path(), "-y", "-hide_banner", "-loglevel", "warning"]
for image in images:
    command += ["-loop", "1", "-t", "8", "-i", image]
command += [
    "-filter_complex",
    filter_complex,
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    out,
]
subprocess.run(command, check=True)
print(f"Wrote {out} ({os.path.getsize(out) // 1024} KB)")
