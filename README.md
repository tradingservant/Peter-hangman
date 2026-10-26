# Peter's Hangman

A small static Hangman vocabulary game. Each round hides one entry and you guess letters before the drawing is finished. The entries are **kill** (殺害), **knock down** (擊倒), **destroy** (摧毀), **damage** (損壞), **bring** (帶來), and **wash away** (沖走). **knock down** and **wash away** keep the space between the words. A Chinese hint sits beside the drawing. Letters on the page are lowercase. It is a phone-friendly page with no server, no account, and no API keys. After the first visit it can open offline, and it can be added to an iPhone home screen.

The footer reads **Peter's Hangman (v1.3)**.

## Play locally

Service workers need a web address, so serve the folder instead of opening the file directly:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/

## GitHub Pages

The site is meant to be published from the `main` branch, root folder.

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**.
4. Save and wait for the Pages build to finish.

The game will be at:

https://tradingservant.github.io/Peter-hangman/

Paths in the page, manifest, and service worker are relative, so the same files work in a local server and at that project URL.

## Add to an iPhone home screen

1. Open the Pages URL in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Hangman from the icon. After it has loaded once, the shell keeps working offline.

## Files

- `index.html`, `styles.css`, `game.js` — the game
- `manifest.webmanifest`, `sw.js`, `icons/` — installable / offline shell
- `.nojekyll` — publish the folder as plain files

When you ship a change, update the footer, the `?v=` on `styles.css` and `game.js` in `index.html`, and the `CACHE` name in `sw.js` together. The page, script, and stylesheet are loaded from the network when online, and from the cache when offline.
