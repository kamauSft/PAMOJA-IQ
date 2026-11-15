# Photographs

These pictures are illustrative. They were generated for the product, not taken in a real chama.

| File | Where it appears | Meaning |
|---|---|---|
| `public/images/chama-meeting-desktop.webp` and `chama-meeting-phone.webp` | Sign-in, member home, treasurer desk | Members reviewing papers around a table |
| `public/images/treasurer-desk-desktop.webp` and `treasurer-desk-phone.webp` | Sign-in and treasurer desk | A treasurer comparing a handwritten register with a laptop |
| `public/images/member-morning-desktop.webp` and `member-morning-phone.webp` | Sign-in and member home | A member reading a message on a phone beside a window |

Each file is under 200 KB. The phone file is the narrower crop. The desktop file is the wider crop.

## How they move

`components/moving-scenes.tsx` cross-fades the three photographs every eight seconds and each one drifts slowly while it is shown. The drift is the `scene-drift` keyframes in `app/globals.css`. Nothing is downloaded twice, and the motion stops for a device that asks for less motion.

Because the pictures move, the edges matter: a crop that loses the subject when it zooms to 113% will look wrong. Keep the person or the table inside the middle 80% of the frame.

## Exporting a premium set

Any stock library or Canva export works, as long as the six files keep their names. Export each scene twice:

| Size | Use | Format |
|---|---|---|
| 1600 × 1200 | Desktop, `-desktop.webp` | WebP, quality 78 |
| 900 × 1400 | Phone, `-phone.webp` | WebP, quality 78 |

Aim for 80–150 KB a file. Warm, natural light and real hands around a table carry the brand better than a posed studio shot. Do not show a real person's face unless they have given written consent.

Replace them later with photographs of the pilot chama, and only after each person in the picture has given written consent.
