# Build the narrated landing-page tour from the presenter portrait and a local voice.
#
# Put the source portrait at assets/video/presenter.jpg first. The portrait is
# licensed stock and is deliberately not committed. Only the finished video and
# poster go into public/.
#
# Run: powershell -ExecutionPolicy Bypass -File scripts/make-guide.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$work = Join-Path $env:TEMP "pamoja-guide-build"
$source = Join-Path $root "assets\video\presenter.jpg"
$video = Join-Path $root "public\videos\guide.mp4"
$poster = Join-Path $root "public\images\guide-poster.webp"
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff) {
  $ff = & python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
}

if (-not (Test-Path $source)) {
  Write-Error "Put the presenter portrait at assets/video/presenter.jpg first."
  exit 1
}
New-Item -ItemType Directory -Force -Path $work | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $video) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $poster) | Out-Null

$sentences = @(
  "Welcome to Pamoja IQ. I am Asha, your guide.",
  "One treasurer keeps the books. Each member sees only their own account.",
  "A member chooses Member, enters a phone number and PIN, and sees their own position.",
  "A treasurer chooses Treasurer, brings in Excel, checks the month, then publishes each position.",
  "No member sees another member's numbers. An official locks for fifteen minutes after three wrong PINs.",
  "Choose your door below. Pamoja IQ, together the numbers are clearer."
)

function Get-Duration([string]$file) {
  $out = & $ff -hide_banner -i $file -f null NUL 2>&1 | Out-String
  $m = [regex]::Match($out, 'Duration: (\d+):(\d+):(\d+\.\d+)')
  if (-not $m.Success) { throw "No duration found for $file" }
  return ([double]$m.Groups[1].Value * 3600) + ([double]$m.Groups[2].Value * 60) + [double]$m.Groups[3].Value
}

function To-AssTime([double]$seconds) {
  $h = [math]::Floor($seconds / 3600)
  $m = [math]::Floor(($seconds % 3600) / 60)
  $s = [math]::Floor($seconds % 60)
  $cs = [math]::Round(($seconds - [math]::Floor($seconds)) * 100)
  if ($cs -ge 100) { $s += 1; $cs = 0 }
  return ('{0}:{1:00}:{2:00}.{3:00}' -f $h, $m, $s, $cs)
}

Push-Location $work
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq "Female" } | Select-Object -First 1
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$synth.Rate = -1

$concat = @()
$dialogues = @()
$cursor = 0.0
for ($i = 0; $i -lt $sentences.Count; $i++) {
  $wav = "s$i.wav"
  $synth.SetOutputToWaveFile((Join-Path $work $wav))
  $synth.Speak($sentences[$i])
  $duration = Get-Duration (Join-Path $work $wav)
  $concat += "file '$wav'"
  if ($i -lt $sentences.Count - 1) { $concat += "file 'silence.wav'" }
  $end = $cursor + $duration + 0.15
  $dialogues += "Dialogue: 0,$(To-AssTime $cursor),$(To-AssTime $end),Default,,0,0,0,,$($sentences[$i])"
  $cursor += $duration + 0.35
}
$synth.Dispose()

& $ff -y -hide_banner -loglevel error -f lavfi -i anullsrc=r=22050:cl=mono -t 0.35 -c:a pcm_s16le silence.wav
$concat | Set-Content -Encoding ascii concat.txt
& $ff -y -hide_banner -loglevel error -f concat -safe 0 -i concat.txt -c:a pcm_s16le narration.wav
$total = Get-Duration (Join-Path $work "narration.wav")

$ass = @"
[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,30,&H00FFFFFF,&H00FFFFFF,&H003D2A0F,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,70,70,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
$($dialogues -join "`n")
"@
$ass | Set-Content -Encoding utf8 captions.ass
Copy-Item "C:\Windows\Fonts\arialbd.ttf" -Destination "arialbd.ttf" -Force

$filter = "scale=1600:-2,zoompan=z='min(zoom+0.00035,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=24,eq=brightness=-0.04:contrast=1.05,drawbox=x=0:y=0:w=1280:h=92:color=0x0F2A3D@0.88:t=fill,drawtext=fontfile=arialbd.ttf:text='ASHA  |  YOUR GUIDE':fontcolor=0xF6F1E7:fontsize=24:x=58:y=32,ass=captions.ass"
& $ff -y -hide_banner -loglevel error -loop 1 -framerate 24 -t $total -i $source -i narration.wav -vf $filter -c:v libx264 -preset medium -crf 26 -pix_fmt yuv420p -c:a aac -b:a 96k -shortest -movflags +faststart $video
& $ff -y -hide_banner -loglevel error -ss 2.5 -i $video -frames:v 1 -vf "scale=960:-2" -c:v libwebp -quality 78 $poster

"Tour: $([math]::Round($total, 1)) seconds"
"Video: $((Get-Item $video).Length) bytes"
"Poster: $((Get-Item $poster).Length) bytes"
Pop-Location
