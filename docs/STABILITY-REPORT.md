# Stability report

Checked on 17 October 2026 against the app Thomas was opening at `http://192.168.100.4:3000`.

## Not secure

The browser prints **Not secure** because that address starts with `http://`. It is the home Wi-Fi address. Certificate companies will not put a padlock on `192.168.100.4`.

Checked and **not** the cause:

- Strict-Transport-Security is already sent only when the app is in production.
- The content security policy does not contain `upgrade-insecure-requests`.
- Nothing redirects `http://localhost` to `https://localhost`.

There is no stuck HSTS entry to delete for this. If a browser has ever been forced onto `https://localhost` and now refuses the page, open `chrome://net-internals/#hsts` (Edge: `edge://net-internals/#hsts`), under **Delete domain security policies** type `localhost`, and click **Delete**.

## Offline

The word offline appeared when the app on this computer had stopped. Sign-in then could not reach it and showed a connection error. The dev server only lives while its window is open. It had been stopped on purpose before tests, and it stops when that window closes.

Checked and **not** the cause:

- There is no service worker in the project, so no offline page is being cached.
- The sign-in cookie is `chama_session`, HttpOnly, SameSite=Lax. The Secure flag is added only in production. It is not an `__Host-` cookie, so http on this computer can still save the sign-in.
- No CAPTCHA script is loaded. The development content security policy allows the dev tools scripts.

One real sign-in failure in the log was different: after several codes in 15 minutes the server answered "Too many codes." While the practice code is shown on the page, that limit is now lifted so repeated tries keep working. The limit stays when a real text message is used.

## What changed

- `start-pamoja.bat` starts the app and opens the browser. `stop-pamoja.bat` frees port 3000.
- `/health` says whether the app and the records are up.
- A failed sign-in now says to double-click `start-pamoja.bat`.
- In development, the page unregisters any old service worker and clears its caches.
- The https header rule is covered by a unit test.

## Not done yet

The always-on https address needs Thomas to sign in at vercel.com. Staging is not deployed. The longer demo PINs in Step 4 (`25802580` and `258025`) are not in use. Sign-in still uses PIN `2580` and the code shown on the page. Those longer PINs stay in the later round so today's demo logins keep working.
