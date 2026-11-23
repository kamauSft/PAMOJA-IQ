# KWAN private onboarding

The public demo and the GitHub Pages site stay untouched. KWAN lives in its own
SQLite file, `prisma/kwan.db`, which is ignored by Git (`*.db`). No real names,
phones, PINs or workbooks are committed.

## What was loaded

From the privately supplied KWAN funeral register:

- Member records from the `Summary` sheet
- Bereavement events from the wide `Detailed Data` grid
- Member/month contribution lines whose totals match the source sheet
- One treasurer post, member number T001, using a name and phone supplied privately
- All positions published, so each member dashboard is populated immediately

No member names, phones, PINs or financial figures from the register are stored in this repository.

The wide event grid is read by `lib/import/kwan.ts`. Two events in one calendar
month are folded into one member/month line; where the source gave only a year,
events are placed in consecutive months of that year in sheet order. This
assumption is recorded in the chama constitution and can be corrected by the
treasurer with a normal upload.

## Run it privately on this machine

```cmd
start-kwan.cmd
```

Open http://localhost:3001. The sign-in page has separate member and treasurer
doors. The treasurer uses the privately supplied phone and the 8-digit PIN in the
credential sheet. Members use their placeholder phone and 6-digit PIN.

The one-time load was already done. To repeat it on a clean machine:

```cmd
onboard-kwan.cmd "C:\path\to\KWAN register.xlsx" "Treasurer Name" 07xxxxxxxx
```

The name and phone are passed only on this machine; they are not defaults in the script or in this document.

The credential sheet is written to `%TEMP%\kwan-credentials.csv`, outside the
repository. Hand it to the treasurer privately; it is never sent by SMS or
email, and it is not part of the product.

## When real phone numbers arrive

Make a CSV with a header and two columns:

```csv
member_no,phone
1,0712345678
2,0712345679
```

Then run:

```cmd
set DATABASE_URL=file:./kwan.db
npx tsx scripts/swap-kwan-phones.ts --phones C:\path\to\phones.csv --out C:\path\to\new-credentials.csv
```

Every swapped member gets a fresh 6-digit PIN, old sessions are revoked, and a
new credential sheet is written outside the repository. The treasurer's number
is unchanged.

## Monthly uploads

The treasurer signs in, opens the desk, then **Import Excel**. A new KWAN sheet
in the same wide format is detected automatically; so is the standard Pamoja IQ
monthly template. Payments are matched to the existing register by member
number. Re-uploading the same month with the same amount is a no-op; a changed
amount updates that month in place. Members only see a month after the
treasurer chooses **Publish positions**.

The treasurer can reset a PIN, lock or unlock a member, remove a member and
edit their details from the desk. Old payments stay in the books when a member
is removed. Three wrong official PINs stop the treasurer for 15 minutes and
then lift by themselves; a member needs an official to unlock their number.

## Security notes

- `DEMO_MODE=false` and a separate `DATABASE_URL` are set by the launcher.
- Never run `npm run seed`, `db:reset`, `scripts/ensure-demo.mjs` or
  `scripts/refresh-demo-pins.ts` against `kwan.db`; they are demo-only and
  destructive.
- For a hosted private deployment, use a separate database and a fresh
  `SESSION_SECRET` per environment, keep preview deployments on their own
  database, and leave `ALLOW_DEMO_IN_PROD` unset.
- Commercial pricing and positioning claims stay in private sales material; they
  are deliberately not in the product, this repository, or the public site.
