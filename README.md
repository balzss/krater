<p align="center">
    <a href="https://github.com/balzss/krater">
        <img src="public/krater-logo.png" width="300">
    </a>
</p>
<p align="center">
    <a href="https://github.com/balzss/krater/blob/main/ROADMAP.md">
        <img src="https://img.shields.io/badge/status-work%20in%20progress-yellow.svg">
    </a>
    <a href="https://github.com/balzss/krater/actions/workflows/test.yml">
        <img src="https://github.com/balzss/krater/actions/workflows/test.yml/badge.svg" alt="Tests">
    </a>
</p>

Toolset for creating and updating a static website for your music collection, designed to mimic the experience of browsing a physical vinyl collection

## Philosophy

This project is **highly opinionated** and built around the way I like to organize and interact with my music:

- **Vinyl Analogy:** To feel like you are flipping through your record collection.
- **Albums Only** No individual tracks or playlists. Just full releases.
- **Minimalism:** Store only what matters: release name, artist, cover art, and a link to listen (currently hardcoded for Spotify, but the structure allows for others).

## Key Features

- Showcase Your Collection – Browse your albums visually, just like a record shelf.
- Random Discovery – Not sure what to listen to? Get a random recommendation.
- Static & Fast – A plain static site with no backend. The whole library is one JSON file.
- RYM Integration – Add albums from [Rate Your Music](https://rateyourmusic.com/) with a browser extension (Chrome or Firefox). It adds them to your local clone and you commit the result.
- Free Hosting – Published with GitHub Pages by a GitHub Actions workflow.

## Live Demo

You can see an example of a deployed collection here: [https://krater.bsaros.com/](https://krater.bsaros.com/)

## Project Status

**Krater is a personal project.** It is built for one person's collection, so there are no accounts, logins, or servers. The repository is public because the site is public.

- See [ROADMAP](ROADMAP.md) for what is planned and [PLAN](PLAN.md) for the current work.

## How It Works

1.  **Data:** The whole library lives in `public/data/libraryData.json` (releases and artists). Cover images are in `public/covers/`.
2.  **Adding releases:** The browser extension reads a Rate Your Music release page and sends the release, its artists, and a WebP cover to your local dev server, which edits those files in your clone. It never runs git, so you review the change and commit it yourself.
3.  **Publishing:** Every push to `main` runs `.github/workflows/deploy.yml`, which validates the data, runs the tests, builds the site, and publishes it to GitHub Pages.
4.  **The site:** A [Vite](https://vite.dev) + React app that loads the JSON file in the browser.

## Getting Started

### Prerequisites

* Node.js and npm.
* Git.
* Google Chrome or Firefox (for the extension).

### Local Development

```bash
git clone https://github.com/balzss/krater.git # or your own copy
cd krater
npm install
npm run dev # http://127.0.0.1:5173
```

### Setting Up the Extension

1.  **Load the extension.**
    * Chrome: open `chrome://extensions/`, turn on **Developer mode**, click **Load unpacked**, and select the `extension` folder.
    * Firefox: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `extension/manifest.json`. Then open `about:addons`, select the extension, and allow its site access under **Permissions**. Temporary add-ons are removed when Firefox restarts.
2.  **Check the address.** Click the Krater toolbar icon. The default, `http://127.0.0.1:5173`, is where `npm run dev` listens. The extension only talks to a dev server on this machine.

There is no token and no account. The dev server only edits files in your clone.

### Adding Releases

1.  In your clone, start the dev server and leave it running:
    ```bash
    npm run dev
    ```
2.  Open a release page on `rateyourmusic.com` and click **Add to Krater**. If the button says **Krater dev server offline**, `npm run dev` isn't running. Start it and click the button again.
3.  The release and its cover are now in `public/data/libraryData.json` and `public/covers/`. A Krater tab that is already open reloads by itself and shows the new release.
4.  Review the change, then commit and push:
    ```bash
    git status
    git add -A && git commit -m "Add Alfredo 2" && git push
    ```
    The deploy workflow publishes it.
5.  The same button reads **Remove from Krater** for releases already in the library. Removing a release also removes its cover and any artist no other release uses. **Refresh data** re-reads the page and updates the entry.

The extension's endpoint (`/__krater`) exists only while the dev server runs, never in the built site. It refuses any edit that would leave the library invalid, and it only accepts requests from the extension, not from web pages.

### Manual Data Entry

You can edit `public/data/libraryData.json` directly. Artists are keyed by the slug of their Rate Your Music URL (`/artist/the-alchemist-2` becomes `the-alchemist-2`). Check your changes with:

```bash
npm run validate
```

It reports unknown artists, missing covers, duplicate IDs, and invalid links. The deploy workflow runs the same check, so a broken library is never published.

### Cover Art

Covers are in `public/covers/` and each release references its file by name. The extension converts the Rate Your Music cover to WebP. If you add one by hand, the file name must match the reference exactly (case-sensitive, Unicode-normalized).

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (also what the extension talks to) |
| `npm run build` | Type check and build the site into `dist/` |
| `npm run preview` | Serve the built site |
| `npm run validate` | Check the library data and covers |
| `npm test` | Run unit and component tests |
| `npm run test:e2e` | Run the Playwright tests |
| `npm run lint` | Check formatting with Prettier |

### Deployment

1.  In the repository settings, set **Pages > Source** to **GitHub Actions**.
2.  Push to `main`. The workflow publishes the contents of `dist/`.
3.  The site is built for the root of a domain (a custom domain, or `<user>.github.io`). To serve it from a subpath such as `/krater/`, set `VITE_BASE=/krater/` in the workflow's build step.

## Contributing

While this is a personal project, feel free to open issues for bugs or suggestions. Pull requests might be considered, but keep in mind the "opinionated" nature of the project.

## License

This project is licensed under the [MIT License](LICENSE).
