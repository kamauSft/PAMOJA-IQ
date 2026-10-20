# Changelog

## Unreleased

### A new password, and two messy registers

- The sign-in page no longer fills in a password.
- The front page has two doors, and the photographs move slowly.
- The practice password for the demo member and the demo treasurer is Ab3!@cde.
- The owner in the server settings is both the treasurer and a member on that one phone. The phone is not written in the program.
- The books now allow that one phone to keep both doors.
- A treasurer is not locked after wrong passwords. A member still locks after 3.
- Two messy Excel files are on the upload page. The second file changes the October amounts.
- A messy sheet still shows each payment: the month column, or a date beside an amount, then the member it belongs to.

### The treasurer can set a PIN, lock a number, or remove a person

- A new PIN is shown in large type on the desk, once.
- The treasurer can lock a number or remove a person. Old payments stay in the books.
- The front page no longer talks about a neighbour's savings.

### The treasurer can set a PIN and unlock a number

- Adding a member shows a temporary PIN once on the desk. It is not sent to a phone.
- A person who is already an official can also be a member. Each door keeps its own PIN.
- Three wrong PINs lock both doors until the treasurer or the chair unlocks them.
- A lock notice is prepared for `OWNER_PHONE`. The number is not written in the program.

### The internet page draws itself

- The live page was white because the internet copy blocked its own script. That script is allowed now, so the page can open.

### Sign-in is the phone number and the PIN

- The sign-in page no longer talks about a code on the screen. A person enters the phone number and the PIN.
- Three wrong PINs lock the number until the treasurer or the chair unlocks it.

### The owner's member record

- The same phone can be a member and a treasurer. The member door opens the member books. The treasurer door opens the desk.
- `OWNER_PHONE` in `.env` is how that account is added. The number is not written in the program.

### Sign-in does not fill in a phone number

- The treasurer door and the member door open empty. A person types their own number.

### Start and stop on this computer

- Double-click `start-pamoja.bat` to open Pamoja IQ. Leave that window open. `stop-pamoja.bat` closes it.
- `/health` says whether the app and the records are running.
- On this computer the address stays http. The padlock, the secure cookie, and the strict transport header turn on only for the internet copy.
- An old offline worker is cleared on this computer. A problem page says what to do. It does not say the site is offline.

### A line that follows the member's own figures

- The member home opens with one sentence about that member: a cleared loan, a savings step, a goal, a streak, or a quiet proverb.
- The same idea can be shown on a phone alert. The alert does not include amounts unless the member later asks for them.
- The wording does not name other members, and it does not suggest borrowing.

### A quieter, banking look, with the photographs

- The pages use a navy, white, and deep green palette, with IBM Plex for words and figures.
- The treasurer has a left-hand menu. A member has a top bar and tabs along the bottom of the phone.
- The front page shows the meeting photograph, with Sign in and For treasurers.
- The treasurer screens show the desk photograph. The member screens show the morning photograph and that member's own line.

### The public page is only a sample

- Sign-in, PIN reset, and Excel upload are gone from the public page.
- Two buttons open sample screens. Every screen says Demo · sample data.
- The names and phone numbers on that page are made up.

### Rules, and the owner's number taken out

- The permanent rules are saved for every session. The real product is the Next.js app. The public page is a demo.
- The owner's phone number is not in the project. Sign-in does not fill in a phone number.
- The moving bubbles are gone from the public page. The daily message is wanted. Bubbles, confetti, and goal photos stay out.

### The treasurer sets the PIN and uploads Excel

- Only the treasurer can set or reset a PIN on the public page. The starting PIN is not written on the page.
- The treasurer's starting PIN still opens the door when this browser saved an older PIN or locked the number.
- The treasurer desk has Upload Excel. The official template downloads from that desk. The register stays in that browser.
- A member door opens only after the treasurer has set that member's PIN.

### The public practice page is gone

- The GitHub Pages site is unpublished. Member names, phone numbers, and balances are no longer on a page anyone can download.
- The sign-in page does not fill in a phone number. A person types their own.
- The official Excel upload file is `docs/pamoja-iq-upload-template.xlsx`. The importer does not read it yet.

### Removed by the owner

- Member circles are gone from the treasurer's desk. The register is a table.
- The random daily word is gone. The morning line uses that member's own figures.
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
