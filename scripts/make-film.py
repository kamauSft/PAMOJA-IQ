"""Build the two silent scene loops from royalty-free footage.

Usage: npm run film

Put the downloaded source clips in assets/video/ first (the URLs and licences
are in docs/ASSETS.md), or point GATHERING_SRC and MEETING_SRC at them. The
sources are deliberately not committed: only the small finished loops are.

If a source is missing, its finished loop is left untouched.
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
out_dir = os.path.join(root, "public", "videos")
source_dir = os.path.join(root, "assets", "video")
os.makedirs(out_dir, exist_ok=True)

# name, default source, trim start, length in seconds
# Both sources are high-angle group meetings with men and women. The light blur
# keeps the people in the background unidentifiable without hiding the scene.
jobs = [
    ("gathering.mp4", "gathering-source.mp4", 0.5, 6),
    ("meeting.mp4", "meeting-source.mp4", 0.5, 6),
]

for name, default_source, start, length in jobs:
    source = os.environ.get(name.split(".")[0].upper() + "_SRC") or os.path.join(source_dir, default_source)
    if not os.path.isfile(source):
        print(f"Skipping {name}: source not found at {source}")
        continue

    fades = f"fade=t=in:st=0:d=0.5,fade=t=out:st={length - 0.5}:d=0.5"
    command = [
        ffmpeg_path(),
        "-y",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-ss",
        str(start),
        "-t",
        str(length),
        "-i",
        source,
        "-vf",
        f"fps=25,scale=1440:810:force_original_aspect_ratio=increase,crop=1440:810,gblur=sigma=0.8,{fades}",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "25",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        os.path.join(out_dir, name),
    ]
    subprocess.run(command, check=True)
    target = os.path.join(out_dir, name)
    print(f"Wrote {name} ({os.path.getsize(target) // 1024} KB)")
