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

| File                          | Where it appears                                                                | Source                                                                                                                                                                                                                       | Licence                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `public/videos/gathering.mp4` | Member sign-in door and member home                                             | [Pexels clip 9653701](https://www.pexels.com/video/group-of-african-women-reading-book-under-tree-9653701/), [direct HD file](https://videos.pexels.com/video-files/9653701/9653701-hd_1920_1080_25fps.mp4)           | [Pexels License](https://www.pexels.com/license/) — free commercial use, editing allowed, no attribution required |
| `public/videos/meeting.mp4`   | Treasurer/chair sign-in door, chama meeting, treasurer desk, and the front page | [Pexels clip 7950977](https://www.pexels.com/video/people-talking-together-7950977/), [direct HD file](https://videos.pexels.com/video-files/7950977/7950977-hd_1920_1080_30fps.mp4)                                 | [Pexels License](https://www.pexels.com/license/) — free commercial use, editing allowed, no attribution required |

The member film shows African women gathered outdoors, reading together in the shade. It reads as a group learning and talking, not a conference room. The officer film shows three Black women in conversation indoors: members talking through a matter, without suits or a boardroom table. Both are more like a chama than the earlier corporate stock clips.

Both finished loops are 6 seconds, 1280 × 720, H.264, 25 frames a second, silent, and under 1 MB, with a 0.5-second fade in and out. They autoplay muted in a loop. The matching still is the poster, and a device asking for less motion gets no video at all.

The footage is credited here even though the Pexels licence does not require it. Mixkit clip 23381 is deliberately **not** used: its page is marked as a Restricted License, not the free one previously used here.

## Rebuilding or replacing the loops

The source clips are not committed; only the small finished loops are. To rebuild, download the sources into `assets/video/` as:

- `gathering-source.mp4` — the Pexels HD file above
- `meeting-source.mp4` — the Pexels HD file above

Then run `npm run film`. You can instead point `GATHERING_SRC` and `MEETING_SRC` at files elsewhere. The script takes 0.3–6.3 s from the gathering source and 0.7–6.7 s from the meeting source, scales and centre-crops to 1280 × 720, fades the ends, drops the sound, and writes H.264 with `+faststart`. It needs `ffmpeg` on PATH, or Python's `imageio-ffmpeg` package. If a source is missing, that loop is left untouched.

When real chama footage arrives, keep the same file names and rough size, or update `FILMS` in `components/moving-scenes.tsx` and these notes together. Get written consent from everyone filmed before using footage of a real chama.

## Exporting a premium still set

Canva exports work as long as the six files keep their names. Export each scene twice:

| Size        | Use                      | Format           |
| ----------- | ------------------------ | ---------------- |
| 1600 × 1200 | Desktop, `-desktop.webp` | WebP, quality 78 |
| 900 × 1400  | Phone, `-phone.webp`     | WebP, quality 78 |

Aim for 80–150 KB a file. Warm, natural light and real hands around a table carry the brand better than a posed studio shot. Do not show a real person's face unless they have given written consent.

Replace the stills later with pictures of the pilot chama, and only after each person in the picture has given written consent.
