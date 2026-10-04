# SYSTEM Preview Run Doc

## How to Reproduce
No build step — pure static HTML/CSS/JS. The app source lives in `system/`;
the root `index.html` only redirects to it.

## How to Run
Start the bundled static server from the project root (no python/node needed):

```
powershell -NoProfile -ExecutionPolicy Bypass -File .freebuff/serve.ps1 -Port 8777
```

Then open `http://127.0.0.1:8777/` in a browser (it redirects to `system/`).

If Python is available instead:

```
python -m http.server 8777
```

For the preview, use port 8777 (or the next free port).
