# Changelog

## Unreleased

### Sign-in does not fill in a phone number

- The treasurer door and the member door open empty. A person types their own number.

### The app stays up on this computer

- Double-click `start-pamoja.bat` to open Pamoja IQ. Leave that window open. `stop-pamoja.bat` closes it.
- `/health` says whether the app and the records are running.
- If the app is down, sign-in says to start it, instead of saying the connection failed.
- The https lock is added only when the app is on the internet. On this computer the address stays http.

### A line that follows the member's own figures

- The member home opens with one sentence about that member: a cleared loan, a savings step, a goal, a streak, or a quiet proverb.
- The same idea can be shown on a phone alert. The alert does not include amounts unless the member later asks for them.
- The wording does not name other members, and it does not suggest borrowing.

### A quieter, banking look

- The pages use a navy, white, and deep green palette, with IBM Plex for words and figures.
- The treasurer has a left-hand menu. A member has a top bar and tabs along the bottom of the phone.
- The front page is a short statement, two buttons, and three plain lines.

### Removed by the owner

- Member circles are gone from the treasurer's desk. The register is a table.
- The daily word is gone from the member home. There is no encouragement library.
- Goal photos, confetti, and floating animations are not part of the product.

### Two doors, and a member the treasurer adds

- The front page is only two doors: Treasurer and Member. The sections that sat underneath are gone.
- The treasurer door and the member door are separate. Neither door fills in a phone number.
- A member's menu is the dashboard and goals. They can change a goal. The other member pages send them back to the dashboard.
- The sign-in code is still shown on the page. It is not sent to a phone.

### Treasurer desk

- The top row shows total savings, loans out, cash safe to lend, and what was collected against what was expected.
- After an Excel upload, the desk names that file and the Nairobi date it was added.

### Member statistics

- The member home shows the last 12 months, how many were paid on time in a row, and savings growing across those months.
- Room to borrow is three times the member's savings, less the loan still open.
- Group savings, loans out, and this month's on-time rate appear only as totals, and only when at least five members are in the chama.
- A statement can be printed or opened in WhatsApp with that member's own figures.

### Member position, daily word, and goals

- After Excel is uploaded, the treasurer opens **Member positions** and shares the books. Until then, members do not see the new payments.
- Each member's home shows their own position, their share of the group when the chama has at least five members, and a fresh line each Nairobi day.
- A member can set up to five goals. The bar uses the savings the treasurer has shared.
- The front page no longer introduces sample people. A chama starts from **Start your chama** or **Sign in**.

### Treasurer profile and Excel

- A treasurer can create their own chama at `/start`, then sign in with the PIN they chose.
- The one-time code still appears on the sign-in page. It is not sent to a phone. No text-message company is connected yet.
- The treasurer's desk has **Upload Excel**. A spreadsheet of members and monthly payments can be checked, then added to that chama. A blank file is available on the same page. A totals row named JUMLA or TOTAL is skipped.

### Brand setup

- The product name is **Pamoja IQ**, tagline **Intelligent Chama Solution**, read from `config/brand.ts`.
- Sign-in text messages and the pages a person sees use that name.
- A production server refuses to start when demo mode is on, unless `ALLOW_DEMO_IN_PROD=true`.
- Added a health check at `/api/health`, a quiet error monitor, sample Excel files, and a GitHub check that lints, type-checks, tests, and builds.

### Design

- Screens use the Pamoja colours, Bricolage Grotesque for headlines, Figtree for text, and JetBrains Mono for amounts.
- Whole shillings show as `KES 2,000`. Cents still show when they are not zero.
- A light/dark switch and an English / Kiswahili switch sit on the front page, the sign-in page, and the member home.

### Sign-in

- A correct code sometimes left you on the sign-in page. The page was opening your home screen and reloading the sign-in screen at the same time, and the reload could win. It now opens your home screen only.
- The browser tests can start on Windows. They were calling a Mac/Linux program file.
