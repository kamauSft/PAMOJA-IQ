"""Build the narrated Agentic AI tour with a real presenter and local voice.

The presenter clip is a licensed Pexels asset kept outside version control in
assets/video/. The narration is synthesised with a local Windows voice, and the
finished video and poster are the only generated files committed.

Run: python scripts/make-guide.py
"""

import json
import math
import shutil
import subprocess
import tempfile
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "video" / "presenter-source.mp4"
WORK = Path(tempfile.gettempdir()) / "pamoja-guide-build"
VIDEO = ROOT / "public" / "videos" / "guide.mp4"
POSTER = ROOT / "public" / "images" / "guide-poster.webp"
FPS = 24
WIDTH, HEIGHT = 1280, 720
CLIP_SECONDS = 7.8

SENTENCES = [
    "Welcome to Pamoja IQ. Agentic AI keeps the chama's books clear.",
    "It reads the Excel, names the columns, and places every payment on the right member's line.",
    "A member opens one door and sees only their own savings, loan and position.",
    "The treasurer opens the other door, reviews the month, and publishes each position.",
    "Nothing is shared until the treasurer is ready. Choose your door below.",
]


def ffmpeg_path() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        from imageio_ffmpeg import get_ffmpeg_exe

        return get_ffmpeg_exe()
    except ImportError as error:
        raise SystemExit("Install ffmpeg, or `pip install imageio-ffmpeg`, then try again.") from error


def synthesize(ff: str) -> list[dict]:
    WORK.mkdir(parents=True, exist_ok=True)
    (WORK / "sentences.json").write_text(json.dumps(SENTENCES), encoding="utf-8")
    script = WORK / "voice.ps1"
    script.write_text(
        textwrap.dedent(
            r"""
            $ErrorActionPreference = "Continue"
            $work = $args[0]
            $ff = $args[1]
            $sentences = Get-Content (Join-Path $work "sentences.json") -Raw -Encoding utf8 | ConvertFrom-Json
            function Get-Duration([string]$file) {
              $out = & $ff -hide_banner -i $file -f null NUL 2>&1 | Out-String
              $m = [regex]::Match($out, 'Duration: (\d+):(\d+):(\d+\.\d+)')
              if (-not $m.Success) { throw "No duration found for $file" }
              return ([double]$m.Groups[1].Value * 3600) + ([double]$m.Groups[2].Value * 60) + [double]$m.Groups[3].Value
            }
            Add-Type -AssemblyName System.Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq "Female" } | Select-Object -First 1
            if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
            $synth.Rate = -1
            $concat = @()
            $timings = @()
            $cursor = 0.0
            for ($i = 0; $i -lt $sentences.Count; $i++) {
              $wav = "s$i.wav"
              $synth.SetOutputToWaveFile((Join-Path $work $wav))
              $synth.Speak($sentences[$i])
              $duration = Get-Duration (Join-Path $work $wav)
              $concat += "file '$wav'"
              if ($i -lt $sentences.Count - 1) { $concat += "file 'silence.wav'" }
              $end = $cursor + $duration + 0.15
              $timings += [pscustomobject]@{ text = $sentences[$i]; start = $cursor; end = $end }
              $cursor += $duration + 0.35
            }
            $synth.Dispose()
            & $ff -y -hide_banner -loglevel error -f lavfi -i anullsrc=r=22050:cl=mono -t 0.35 -c:a pcm_s16le (Join-Path $work "silence.wav")
            $concat | Set-Content -Encoding ascii (Join-Path $work "concat.txt")
            & $ff -y -hide_banner -loglevel error -f concat -safe 0 -i (Join-Path $work "concat.txt") -c:a pcm_s16le (Join-Path $work "narration.wav")
            $timings | ConvertTo-Json -Depth 3 | Set-Content -Encoding utf8 (Join-Path $work "timings.json")
            """
        ),
        encoding="utf-8",
    )
    subprocess.run(
        ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script), str(WORK), ff],
        check=True,
    )
    return json.loads((WORK / "timings.json").read_text(encoding="utf-8-sig"))


def write_captions(timings: list[dict]) -> None:
    def stamp(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int(round((seconds - math.floor(seconds)) * 100))
        return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

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
    for entry in timings:
        lines.append(
            f"Dialogue: 0,{stamp(entry['start'])},{stamp(entry['end'])},Default,,0,0,0,,{entry['text']}"
        )
    (WORK / "captions.ass").write_text("\n".join(lines) + "\n", encoding="utf-8")


def still_frame(ff: str) -> None:
    subprocess.run(
        [
            ff,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            "3",
            "-i",
            str(SOURCE),
            "-frames:v",
            "1",
            "-vf",
            "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720",
            str(WORK / "still.png"),
        ],
        check=True,
    )
    image = Image.open(WORK / "still.png").convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, WIDTH, 92), fill=(7, 19, 28, 205))
    draw.rectangle((0, HEIGHT - 96, WIDTH, HEIGHT), fill=(7, 19, 28, 215))
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 26)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 17)
    draw.text((56, 28), "PAMOJA IQ", font=font, fill=(246, 241, 231, 255))
    draw.text((56, HEIGHT - 70), "AGENTIC AI FOR CHAMAS", font=small, fill=(125, 222, 200, 255))
    Image.alpha_composite(image, overlay).convert("RGB").save(POSTER, "WEBP", quality=80)


def build_video(ff: str, total: float) -> None:
    """Keep the presenter on screen by cross-fading the licensed clip as needed."""
    scale = (
        "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,"
        "setsar=1,setpts=PTS-STARTPTS,fps=24,format=yuv420p"
    )
    overlap = 0.45
    advance = CLIP_SECONDS - overlap
    segments = max(1, math.ceil((total - overlap) / advance))
    labels = [f"s{index}" for index in range(segments)]

    parts = [
        f"[0:v]trim=start=0:duration={CLIP_SECONDS},{scale}[v0];",
        f"[v0]split={segments}" + "".join(f"[{label}]" for label in labels) + ";",
    ]
    previous = labels[0]
    offset = advance
    for index in range(1, segments):
        output = f"x{index}"
        parts.append(
            f"[{previous}][{labels[index]}]xfade=transition=fade:duration={overlap}:offset={offset:.3f}[{output}];"
        )
        previous = output
        offset += advance
    parts.append(f"[{previous}]trim=duration={total:.3f},setpts=PTS-STARTPTS,fps=24[bg];")
    parts.append(
        "[bg]drawbox=x=0:y=0:w=1280:h=92:color=0x07131c@0.80:t=fill,"
        "drawbox=x=0:y=624:w=1280:h=96:color=0x07131c@0.84:t=fill,"
        "drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='PAMOJA IQ':fontcolor=0xF6F1E7:fontsize=26:x=56:y=28,"
        "drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='AGENTIC AI FOR CHAMAS':fontcolor=0x7DDEC8:fontsize=17:x=56:y=650,"
        "ass=captions.ass[v]"
    )
    filter_complex = "".join(parts)

    subprocess.run(
        [
            ff,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(SOURCE),
            "-i",
            str(WORK / "narration.wav"),
            "-filter_complex",
            filter_complex,
            "-map",
            "[v]",
            "-map",
            "1:a",
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
            "96k",
            "-shortest",
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
    ff = ffmpeg_path()
    timings = synthesize(ff)
    total = timings[-1]["end"] + 0.2
    write_captions(timings)
    still_frame(ff)
    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    POSTER.parent.mkdir(parents=True, exist_ok=True)
    build_video(ff, total)
    print(f"Tour: {total:.1f} seconds")
    print(f"Video: {VIDEO.stat().st_size} bytes")
    print(f"Poster: {POSTER.stat().st_size} bytes")


if __name__ == "__main__":
    main()
