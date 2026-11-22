"""Build the narrated Agentic AI tour with a moving, faceless avatar.

The narrator voice is synthesised with a local Windows voice. The avatar is
drawn here from shapes, so it is not a photograph of an individual. Only the
finished video and poster are committed.

Run: python scripts/make-guide.py
"""

import json
import math
import os
import shutil
import struct
import subprocess
import tempfile
import textwrap
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WORK = Path(tempfile.gettempdir()) / "pamoja-guide-build"
VIDEO = ROOT / "public" / "videos" / "guide.mp4"
POSTER = ROOT / "public" / "images" / "guide-poster.webp"
FPS = 24
WIDTH, HEIGHT = 1280, 720

SENTENCES = [
    "Welcome to Pamoja IQ. I am Asha, your agentic AI guide.",
    "This is not just a ledger. An agent reads the chama's Excel and names the columns.",
    "It puts every payment on the right member's line and checks the month for the treasurer.",
    "A member opens their own door and sees only their savings, loan and position.",
    "The treasurer reviews the work, then publishes each position when it is ready.",
    "Choose your door below. Pamoja IQ, together the numbers are clearer.",
]

KEYWORDS = ["WELCOME", "EXCEL", "MEMBER", "TREASURER", "PUBLISH", "START"]


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
    script = WORK / "voice.ps1"
    script.write_text(
        textwrap.dedent(
            r"""
            $ErrorActionPreference = "Continue"
            $work = $args[0]
            $ff = $args[1]
            $sentences = @(
              "Welcome to Pamoja IQ. I am Asha, your agentic AI guide.",
              "This is not just a ledger. An agent reads the chama's Excel and names the columns.",
              "It puts every payment on the right member's line and checks the month for the treasurer.",
              "A member opens their own door and sees only their savings, loan and position.",
              "The treasurer reviews the work, then publishes each position when it is ready.",
              "Choose your door below. Pamoja IQ, together the numbers are clearer."
            )
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


def amplitudes(frames: int) -> list[float]:
    with wave.open(str(WORK / "narration.wav"), "rb") as wav:
        rate = wav.getframerate()
        raw = wav.readframes(wav.getnframes())
    samples = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    window = max(1, rate // FPS)
    values = []
    peak = 1e-6
    for frame in range(frames):
        chunk = samples[frame * window : (frame + 1) * window]
        rms = math.sqrt(sum(sample * sample for sample in chunk) / len(chunk)) if chunk else 0.0
        values.append(rms)
        peak = max(peak, rms)
    smoothed = []
    previous = 0.0
    for value in values:
        current = min(1.0, value / peak)
        smoothed.append(0.65 * previous + 0.35 * current)
        previous = smoothed[-1]
    return smoothed


def fonts() -> tuple[ImageFont.FreeTypeFont, ...]:
    folder = Path("C:/Windows/Fonts")
    return (
        ImageFont.truetype(str(folder / "arialbd.ttf"), 21),
        ImageFont.truetype(str(folder / "arial.ttf"), 17),
        ImageFont.truetype(str(folder / "georgia.ttf"), 68),
        ImageFont.truetype(str(folder / "georgia.ttf"), 30),
    )


def active_index(timings: list[dict], seconds: float) -> int:
    for index, entry in enumerate(timings):
        if entry["start"] <= seconds < entry["end"]:
            return index
    return len(timings) - 1


def draw_frame(seconds: float, level: float, index: int, font_pack: tuple) -> Image.Image:
    bold, small, display, subdisplay = font_pack
    image = Image.new("RGB", (WIDTH, HEIGHT), (7, 19, 28))
    draw = ImageDraw.Draw(image, "RGBA")

    for y in range(HEIGHT):
        ratio = y / (HEIGHT - 1)
        draw.line(
            [(0, y), (WIDTH, y)],
            fill=(int(7 + 9 * ratio), int(19 + 23 * ratio), int(28 + 33 * ratio), 255),
        )

    for radius, alpha in ((330, 16), (270, 24), (210, 34)):
        draw.ellipse(
            [930 - radius, 300 - radius, 930 + radius, 300 + radius],
            fill=(125, 222, 200, alpha),
        )

    draw.rounded_rectangle((70, 80, 78, 640), radius=4, fill=(31, 107, 79, 255))
    draw.text((106, 82), "PAMOJA IQ", font=bold, fill=(246, 241, 231, 255))
    draw.text((106, 116), "AGENTIC AI", font=small, fill=(125, 222, 200, 255))
    draw.text((102, 244), KEYWORDS[index], font=display, fill=(246, 241, 231, 255))
    draw.text((106, 330), "Your chama, read and ready.", font=subdisplay, fill=(125, 222, 200, 220))

    # Shoulders, neck and head are deliberately geometric: no individual is shown.
    draw.ellipse((750, 505, 1110, 865), fill=(15, 42, 61, 255), outline=(31, 107, 79, 255), width=5)
    draw.rounded_rectangle((888, 440, 952, 570), radius=28, fill=(31, 107, 79, 255))
    draw.ellipse((810, 176, 1030, 420), fill=(15, 59, 68, 255), outline=(125, 222, 200, 255), width=5)
    draw.ellipse((836, 204, 1004, 392), fill=(10, 42, 52, 255))

    blinking = int(seconds * 2) % 19 == 0
    if blinking:
        draw.rounded_rectangle((866, 284, 906, 287), radius=2, fill=(246, 241, 231, 255))
        draw.rounded_rectangle((934, 284, 974, 287), radius=2, fill=(246, 241, 231, 255))
    else:
        draw.rounded_rectangle((866, 280, 906, 287), radius=4, fill=(246, 241, 231, 255))
        draw.rounded_rectangle((934, 280, 974, 287), radius=4, fill=(246, 241, 231, 255))

    mouth_height = 5 + level * 38
    draw.ellipse(
        (900, 346 - mouth_height / 2, 960, 346 + mouth_height / 2),
        fill=(125, 222, 200, 255),
    )

    for bar in range(12):
        phase = 0.45 + 0.55 * abs(math.sin(seconds * 5 + bar * 0.7))
        height = 6 + level * 46 * phase
        x = 1090 + bar * 12
        draw.rounded_rectangle(
            (x, 350 - height / 2, x + 5, 350 + height / 2),
            radius=2,
            fill=(125, 222, 200, 190),
        )

    draw.text((898, 452), "ASHA", font=bold, fill=(246, 241, 231, 255))
    return image


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
        "Style: Default,Arial,28,&H00FFFFFF,&H00FFFFFF,&H003D2A0F,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,80,80,54,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for entry in timings:
        lines.append(
            f"Dialogue: 0,{stamp(entry['start'])},{stamp(entry['end'])},Default,,0,0,0,,{entry['text']}"
        )
    (WORK / "captions.ass").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ff = ffmpeg_path()
    timings = synthesize(ff)
    total = timings[-1]["end"] + 0.2
    frames = math.ceil(total * FPS)
    levels = amplitudes(frames)
    font_pack = fonts()
    write_captions(timings)

    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    POSTER.parent.mkdir(parents=True, exist_ok=True)
    command = [
        ff,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(WORK / "narration.wav"),
        "-vf",
        "ass=captions.ass",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "26",
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
    ]
    process = subprocess.Popen(command, cwd=WORK, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for frame in range(frames):
        seconds = frame / FPS
        image = draw_frame(seconds, levels[frame], active_index(timings, seconds), font_pack)
        process.stdin.write(image.tobytes())
        if frame == int(2 * FPS):
            image.save(POSTER, "WEBP", quality=78)
    process.stdin.close()
    if process.wait() != 0:
        raise SystemExit("ffmpeg failed while building the guided tour")

    print(f"Tour: {total:.1f} seconds")
    print(f"Video: {VIDEO.stat().st_size} bytes")
    print(f"Poster: {POSTER.stat().st_size} bytes")


if __name__ == "__main__":
    main()
