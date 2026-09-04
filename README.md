# Sky Dash

A small 2D flyer you play in the browser. Hold to climb, release to dive, and slip through the towers.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8765
```

Then go to [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

**Controls**

- **Space**, **W**, **Up**, or **click/hold** — climb
- **Release** — dive

Score is how many gaps you clear. Best score is stored in this browser.

## Files

- `index.html` — page shell
- `style.css` — layout
- `game.js` — canvas game loop
