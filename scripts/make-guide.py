"""Build the lip-synced guided tour with D-ID.

A still is taken from the licensed Pexels presenter clip, uploaded to D-ID,
and animated one sentence at a time with a natural neural voice. Each D-ID
render gives an exact duration, so the burned-in captions match the audio.
The API key is read from D_ID_API_KEY and is never written to disk.

Run: D_ID_API_KEY=... python scripts/make-guide.py
On Windows PowerShell: $env:D_ID_API_KEY="..."; python scripts/make-guide.py
"""

import base64
import json
import os
import platform
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "video" / "presenter-source.mp4"
SCRIPT_JSON = ROOT / "content" / "guide-script.json"
WORK = Path(tempfile.gettempdir()) / "pamoja-guide-build"
VIDEO = ROOT / "public" / "videos" / "guide.mp4"
POSTER = ROOT / "public" / "images" / "guide-poster.webp"

API = "https://api.d-id.com"
POLL_SECONDS = 5
FONT_BOLD = (
    "C:/Windows/Fonts/arialbd.ttf"
    if platform.system() == "Windows"
    else "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
)
FONT_REGULAR = (
    "C:/Windows/Fonts/arial.ttf"
    if platform.system() == "Windows"
    else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
)


def ffmpeg_path() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        from imageio_ffmpeg import get_ffmpeg_exe

        return get_ffmpeg_exe()
    except ImportError as error:
        raise SystemExit("Install ffmpeg, or `pip install imageio-ffmpeg`, then try again.") from error


def auth_header() -> str:
    """D-ID Studio keys are `user:password`; some accounts expect base64 Basic."""
    key = os.environ.get("D_ID_API_KEY", "").strip()
    if not key:
        raise SystemExit(
            "Set D_ID_API_KEY in the environment before building the tour. "
            "The key is not stored in this repository."
        )
    mode = os.environ.get("D_ID_AUTH_MODE", "auto").strip().lower()
    if mode == "base64" or (mode == "auto" and ":" not in key):
        key = base64.b64encode(key.encode("utf-8")).decode("ascii")
    return f"Basic {key}"


def request_json(method: str, path: str, auth: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Authorization": auth, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:600]
        raise SystemExit(f"D-ID {method} {path} failed ({error.code}): {detail}") from error
    except urllib.error.URLError as error:
        raise SystemExit(f"D-ID {method} {path} could not be reached: {error.reason}") from error


def absolute_url(url: str) -> str:
    if url.startswith(("https://", "http://")):
        return url
    if url.startswith("/"):
        return API + url
    raise SystemExit(f"D-ID returned an unexpected URL: {url[:120]}")


def upload_presenter_still(image: Path, auth: str) -> str:
    boundary = "----PamojaGuide" + uuid.uuid4().hex
    header = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="image"; filename="presenter-still.jpg"\r\n'
        "Content-Type: image/jpeg\r\n\r\n"
    ).encode("ascii")
    footer = f"\r\n--{boundary}--\r\n".encode("ascii")
    body = header + image.read_bytes() + footer
    request = urllib.request.Request(
        API + "/images",
        data=body,
        headers={
            "Authorization": auth,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:600]
        raise SystemExit(f"D-ID image upload failed ({error.code}): {detail}") from error
    url = result.get("url")
    if not url:
        raise SystemExit("D-ID accepted the presenter still but returned no URL.")
    return absolute_url(url)


def create_talk(source_url: str, sentence: str, index: int, auth: str) -> str:
    provider = os.environ.get("D_ID_VOICE_PROVIDER", "microsoft").strip().lower()
    voice = os.environ.get("D_ID_VOICE_ID", "en-US-JennyNeural").strip()
    rate = os.environ.get("D_ID_VOICE_RATE", "1.0").strip()
    speaking = {
        "type": "text",
        "input": sentence,
        "ssml": False,
        "subtitles": False,
        "provider": {
            "type": provider,
            "voice_id": voice,
            "voice_config": {"rate": rate},
        },
    }
    payload = {
        "source_url": source_url,
        "name": f"Pamoja IQ guide {index + 1}",
        "script": speaking,
        "config": {"fluent": True, "pad_audio": 0.15, "result_format": "mp4"},
        "user_data": "pamoja-iq-guide",
    }
    result = request_json("POST", "/talks", auth, payload)
    talk_id = result.get("id")
    if not talk_id:
        raise SystemExit(f"D-ID did not return a talk id for sentence {index + 1}.")
    return talk_id


def wait_for_talk(talk_id: str, auth: str) -> str:
    timeout = int(os.environ.get("GUIDE_LIPSYNC_TIMEOUT", "900"))
    started = time.monotonic()
    while True:
        result = request_json("GET", f"/talks/{talk_id}", auth)
        status = result.get("status")
        if status == "done" and result.get("result_url"):
            return absolute_url(result["result_url"])
        if status in {"error", "rejected"}:
            raise SystemExit(f"D-ID rejected talk {talk_id}: {json.dumps(result)[:600]}")
        if time.monotonic() - started > timeout:
            raise SystemExit(f"D-ID talk {talk_id} did not finish within {timeout} seconds.")
        time.sleep(POLL_SECONDS)


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"Accept": "video/mp4"})
    try:
        with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
            shutil.copyfileobj(response, output)
    except urllib.error.HTTPError as error:
        raise SystemExit(f"Could not download the D-ID result ({error.code}).") from error
    if destination.stat().st_size < 10_000:
        raise SystemExit(f"The D-ID result for {destination.name} was unexpectedly small.")


def duration_of(ff: str, path: Path) -> float:
    result = subprocess.run(
        [ff, "-hide_banner", "-i", str(path), "-f", "null", "NUL"],
        capture_output=True,
        text=True,
    )
    import re

    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", result.stderr)
    if not match:
        raise SystemExit(f"Could not read the duration of {path.name}.")
    return float(match.group(1)) * 3600 + float(match.group(2)) * 60 + float(match.group(3))


def extract_still(ff: str) -> Path:
    destination = WORK / "presenter-still.jpg"
    second = os.environ.get("GUIDE_FRAME_SECOND", "3").strip()
    subprocess.run(
        [
            ff,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            second,
            "-i",
            str(SOURCE),
            "-frames:v",
            "1",
            "-vf",
            "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
            "-q:v",
            "2",
            str(destination),
        ],
        check=True,
    )
    return destination


def caption_stamp(seconds: float) -> str:
    centiseconds = int(round(seconds * 100))
    hours, centiseconds = divmod(centiseconds, 360_000)
    minutes, centiseconds = divmod(centiseconds, 6_000)
    secs, centis = divmod(centiseconds, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def write_captions(sentences: list[str], durations: list[float]) -> float:
    lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        "PlayResX: 1280",
        "PlayResY: 720",
        "WrapStyle: 2",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Default,Arial,24,&H00FFFFFF,&H00FFFFFF,&H003D2A0F,&H90000000,-1,0,0,0,100,100,0,0,1,2,0,2,70,70,42,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    cursor = 0.0
    for sentence, duration in zip(sentences, durations):
        lines.append(
            f"Dialogue: 0,{caption_stamp(cursor + 0.05)},"
            f"{caption_stamp(cursor + max(0.35, duration - 0.08))},"
            f"Default,,0,0,0,,{sentence}"
        )
        cursor += duration
    (WORK / "captions.ass").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return cursor


def ffmpeg_font(path: str) -> str:
    return path.replace("\\", "/").replace(":", "\\:")


def write_poster(still: Path) -> None:
    image = Image.open(still).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, 1280, 92), fill=(7, 19, 28, 205))
    draw.rectangle((0, 624, 1280, 720), fill=(7, 19, 28, 215))
    bold = ImageFont.truetype(FONT_BOLD, 26)
    small = ImageFont.truetype(FONT_REGULAR, 17)
    tiny = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((56, 28), "PAMOJA IQ", font=bold, fill=(246, 241, 231, 255))
    draw.text((56, 650), "AGENTIC AI FOR CHAMAS", font=small, fill=(125, 222, 200, 255))
    disclosure = "ILLUSTRATIVE PRESENTER"
    right = 1280 - 56 - int(draw.textlength(disclosure, font=tiny))
    draw.text((right, 36), disclosure, font=tiny, fill=(125, 222, 200, 255))
    POSTER.parent.mkdir(parents=True, exist_ok=True)
    Image.alpha_composite(image, overlay).convert("RGB").save(POSTER, "WEBP", quality=80)


def finish_video(ff: str, segments: list[Path], total: float) -> None:
    concat = WORK / "concat.txt"
    concat.write_text(
        "".join(f"file '{segment.name}'\n" for segment in segments),
        encoding="ascii",
    )
    combined = WORK / "combined.mp4"
    subprocess.run(
        [
            ff,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-c",
            "copy",
            str(combined),
        ],
        cwd=WORK,
        check=True,
    )
    video_filter = (
        "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,"
        "setsar=1,setpts=PTS-STARTPTS,fps=24,format=yuv420p,"
        "drawbox=x=0:y=0:w=1280:h=92:color=0x07131c@0.80:t=fill,"
        "drawbox=x=0:y=624:w=1280:h=96:color=0x07131c@0.84:t=fill,"
        f"drawtext=fontfile='{ffmpeg_font(FONT_BOLD)}':text='PAMOJA IQ':"
        "fontcolor=0xF6F1E7:fontsize=26:x=56:y=28,"
        f"drawtext=fontfile='{ffmpeg_font(FONT_REGULAR)}':text='ILLUSTRATIVE PRESENTER':"
        "fontcolor=0x7DDEC8:fontsize=14:x=w-text_w-56:y=36,"
        f"drawtext=fontfile='{ffmpeg_font(FONT_REGULAR)}':text='AGENTIC AI FOR CHAMAS':"
        "fontcolor=0x7DDEC8:fontsize=17:x=56:y=650,"
        "ass=captions.ass[v]"
    )
    subprocess.run(
        [
            ff,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(combined),
            "-filter_complex",
            video_filter,
            "-map",
            "[v]",
            "-map",
            "0:a:0",
            "-t",
            f"{total:.3f}",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "30",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "112k",
            "-movflags",
            "+faststart",
            str(VIDEO),
        ],
        cwd=WORK,
        check=True,
    )


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Presenter clip is missing: {SOURCE}")
    sentences = json.loads(SCRIPT_JSON.read_text(encoding="utf-8"))
    if not isinstance(sentences, list) or not sentences:
        raise SystemExit(f"The guide script is empty: {SCRIPT_JSON}")

    auth = auth_header()
    ff = ffmpeg_path()
    WORK.mkdir(parents=True, exist_ok=True)
    VIDEO.parent.mkdir(parents=True, exist_ok=True)

    still = extract_still(ff)
    source_url = upload_presenter_still(still, auth)
    print(f"D-ID source ready for {len(sentences)} sentences")

    segments: list[Path] = []
    durations: list[float] = []
    for index, sentence in enumerate(sentences):
        talk_id = create_talk(source_url, sentence, index, auth)
        result_url = wait_for_talk(talk_id, auth)
        segment = WORK / f"segment_{index}.mp4"
        download(result_url, segment)
        durations.append(duration_of(ff, segment))
        segments.append(segment)
        print(f"Sentence {index + 1}/{len(sentences)} rendered ({durations[-1]:.2f}s)")

    total = write_captions(sentences, durations)
    write_poster(still)
    finish_video(ff, segments, total)
    (WORK / "timings.json").write_text(
        json.dumps(
            [
                {"text": sentence, "duration": duration}
                for sentence, duration in zip(sentences, durations)
            ],
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Tour: {total:.1f} seconds")
    print(f"Video: {VIDEO.stat().st_size} bytes")
    print(f"Poster: {POSTER.stat().st_size} bytes")


if __name__ == "__main__":
    main()
