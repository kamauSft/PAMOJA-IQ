# Pictures and films

The stills are illustrative. They were generated for the product, not taken in a real chama. The films are royalty-free stock footage of other people; they are demo assets, not a record of Umoja Savings Group.

## Still pictures

| File                                                                        | Where it appears                     | Meaning                                                    |
| --------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `public/images/chama-meeting-desktop.webp` and `chama-meeting-phone.webp`   | Sign-in, member home, treasurer desk | Members reviewing papers around a table                    |
| `public/images/treasurer-desk-desktop.webp` and `treasurer-desk-phone.webp` | Sign-in and treasurer desk           | A treasurer comparing a handwritten register with a laptop |
| `public/images/member-morning-desktop.webp` and `member-morning-phone.webp` | Sign-in and member home              | A member reading a message on a phone beside a window      |

Each file is under 200 KB. The phone file is the narrower crop. The desktop file is the wider crop.

## How the stills move

`components/moving-scenes.tsx` cross-fades the stills every eight seconds and each one drifts slowly while it is shown. The drift is the `scene-drift` keyframes in `app/globals.css`. The stills sit under the video as its poster and as the fallback if playback fails, and they are the whole experience for a device that asks for less motion.

Because the pictures move, the edges matter: a crop that loses the subject when it zooms to 113% will look wrong. Keep the person or the table inside the middle 80% of the frame.

## The films

| File                          | Where it appears                                                                | Source                                                                                                                                                                                                                 | Licence                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `public/videos/gathering.mp4` | Member sign-in door and member home                                             | [Pexels clip 4433631](https://www.pexels.com/video/men-and-women-having-a-meeting-4433631/), [direct HD file](https://videos.pexels.com/video-files/4433631/4433631-hd_1920_1080_25fps.mp4)                  | [Pexels License](https://www.pexels.com/license/) — free commercial use, editing allowed, no attribution required |
| `public/videos/meeting.mp4`   | Treasurer/chair sign-in door, chama meeting, treasurer desk, and the front page | [Pexels clip 6192937](https://www.pexels.com/video/people-having-a-meeting-6192937/), [direct HD file](https://videos.pexels.com/video-files/6192937/6192937-hd_1920_1080_25fps.mp4)                      | [Pexels License](https://www.pexels.com/license/) — free commercial use, editing allowed, no attribution required |

Both films show a formal meeting of men and women around a table, shot from a high angle. That framing and a light blur keep the people in the background, so nobody is identifiable, while the room and the gathering stay clear. The member loop uses the high-angle colleagues clip; the officer loop uses the overhead wooden-table clip.

Both finished loops are 6 seconds, 1440 × 810, H.264, 25 frames a second, silent, and under 1 MB, with a 0.5-second fade in and out. They autoplay muted in a loop and cover the whole first screen. The matching still is the poster, and a device asking for less motion gets no video at all.

The footage is credited here even though the Pexels licence does not require it. Mixkit clip 23381 is deliberately **not** used: its page is marked as a Restricted License, not the free one previously used here.

## Rebuilding or replacing the loops

The source clips are not committed; only the small finished loops are. To rebuild, download the sources into `assets/video/` as:

- `gathering-source.mp4` — the Pexels HD file above
- `meeting-source.mp4` — the Pexels HD file above

Then run `npm run film`. You can instead point `GATHERING_SRC` and `MEETING_SRC` at files elsewhere. The script takes 0.5–6.5 s from each source, scales and centre-crops to 1440 × 810, applies a light blur so faces stay unidentifiable without hiding the scene, fades the ends, drops the sound, and writes H.264 at CRF 25 with `+faststart`. It needs `ffmpeg` on PATH, or Python's `imageio-ffmpeg` package. If a source is missing, that loop is left untouched.

When real chama footage arrives, keep the same file names and rough size, or update `FILMS` in `components/moving-scenes.tsx` and these notes together. Get written consent from everyone filmed before using footage of a real chama.

## The guided tour

| File                              | Where it appears                      | Source                                                                                                                                       | Licence                                                              |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `public/images/guide-poster.webp` | Landing-page tour card and video poster | Drawn by `scripts/make-guide.py` from shapes; no photograph is used                                                                             | Original project artwork                                             |
| `public/videos/guide.mp4`         | Landing-page guided tour              | Drawn avatar, narration from a local Windows female voice, and captions and script from `scripts/make-guide.py`                                | Narration, captions, and artwork are original project work           |

Asha is a geometric agentic-AI avatar, not a photograph of an individual and not a member or employee of a real chama. Her mouth and the small waveform beside her move with the narration, so she is clearly speaking. The tour runs for 37 seconds, is 1280 × 720 H.264 with AAC audio and burned-in English captions, and stays under 1 MB. It is click-to-play with native controls, so no sound starts without the person asking for it. The transcript is also in `components/guide-tour.tsx`.

To rebuild it on Windows, run `python scripts/make-guide.py`. The script synthesises each sentence with an installed female voice, measures the audio, draws every frame so the mouth follows the speech, times the captions to the sentences, and writes both files above. If a different voice is installed, the timings and mouth movement are recalculated automatically.

## Exporting a premium still set

Canva exports work as long as the six files keep their names. Export each scene twice:

| Size        | Use                      | Format           |
| ----------- | ------------------------ | ---------------- |
| 1600 × 1200 | Desktop, `-desktop.webp` | WebP, quality 78 |
| 900 × 1400  | Phone, `-phone.webp`     | WebP, quality 78 |

Aim for 80–150 KB a file. Warm, natural light and real hands around a table carry the brand better than a posed studio shot. Do not show a real person's face unless they have given written consent.

Replace the stills later with pictures of the pilot chama, and only after each person in the picture has given written consent.
