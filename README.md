Anki Bulk Import Web App
=========================

This small Flask web app lets you import multiple vocabulary rows into an Anki deck via AnkiConnect.

Requirements
------------

- Python 3.8+
- Anki desktop with the AnkiConnect add-on installed and running (default port 8765).

Quick start
-----------

1. Install dependencies:

```powershell
# Python (original):
pip install -r requirements.txt

# Node.js (alternative):
Files
-----

- `app.py`: Flask app and AnkiConnect integration (legacy).
- `server.js`: Node.js Express server (alternative runtime).
- `templates/index.html`: server-rendered UI (legacy).
- `static/`: pure client-side JS app (recommended). See `static/index.html`, `static/app.js`, `static/styles.css`.

Static JS-only app
------------------

The recommended distribution is the pure client-side app in the `static/` folder. It is JavaScript-only and communicates directly with AnkiConnect at `http://127.0.0.1:8765`.

Run locally (recommended):

```powershell
# Serve the static folder on port 8000
python -m http.server 8000
# then open http://localhost:8000/static/
```

Or use `npx serve`:

```powershell
npx serve -s . -l 8000
# then open http://localhost:8000/static/
```

Notes
-----

- The app requires Anki desktop with the AnkiConnect add-on running locally.
- The model should contain fields named `Words`, `Type`, `Reading`, `Meaning`, `Sentence` (or edit `static/app.js` to match your model).
- Serving the page over HTTPS (GitHub Pages) may block requests to `http://127.0.0.1:8765` due to mixed-content rules — run locally to avoid this.

- `templates/index.html`: UI.
- `requirements.txt`: Python dependencies.

Publishing to GitHub Pages (static frontend)
-----------------------------------------

You can publish a static frontend of this app to GitHub Pages using the `docs/` folder. The static frontend (`docs/index.html` + `docs/app.js`) runs entirely in the browser and calls AnkiConnect at `http://127.0.0.1:8765`.

Steps:

1. Push this repository to GitHub.
2. In the repository settings on GitHub, under Pages, set the source to the `docs/` folder on the default branch and save.

Caveats and security notes:

- Modern browsers block mixed-content: an HTTPS-served page (GitHub Pages) calling an HTTP endpoint (`http://127.0.0.1:8765`) may be blocked. That means the GitHub Pages site may not be able to talk to your local AnkiConnect unless you use one of the workarounds below.
- Workarounds:
	- Run the static site locally (recommended): clone the repo and run a simple HTTP server in the repo root so the page is served over HTTP, e.g.:

		```powershell
		python -m http.server 8000
		# then open http://localhost:8000/docs/
		```

	- Use a secure tunnel (ngrok / Cloudflare Tunnel) to expose AnkiConnect over HTTPS. This can work but exposes Anki to the network — use with caution and secure the tunnel.
	- Use the Flask server (`python app.py`) for the full experience without mixed-content problems; it runs locally and can talk to AnkiConnect over HTTP.

- If your Anki model uses different field names, update the static `docs/app.js` or use the Flask UI which supports flexible server-side mapping.

