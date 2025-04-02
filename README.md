[![Work in Progress](https://img.shields.io/badge/status-work%20in%20progress-yellow.svg)](https://github.com/balzss/krater/)

# Krater

Krater is a tool that brings the feeling of flipping through a physical vinyl collection to your digital library. Browse, search, and rediscover your favorite albums in a minimalist, self-hosted UI.

## Philosophy

This project is **highly opinionated** and built around the way I like to organize and interact with my music:

- **Vinyl Analogy:** To feel like you are flipping through your record collection.
- **Albums Only** No individual tracks or playlists. Just full releases.
- **Minimalism:** Store only what matters: release name, artist, cover art, and a link to listen (currently hardcoded for Spotify, but the structure allows for others).

## Key Features

- Showcase Your Collection – Browse your albums visually, just like a record shelf.
- Random Discovery – Not sure what to listen to? Get a random recommendation.
- Static & Fast – Generate a static site that loads instantly with no backend required.
- RYM Integration – Add albums from [Rate Your Music](https://rateyourmusic.com/) with a Chrome extension.
- Effortless Hosting – Easily deploy on GitHub Pages, Netlify, or Vercel.

## Live Demo

You can see an example of a deployed collection here: [https://balzss.github.io/krater/](https://balzss.github.io/krater/)

## Project Status

**Krater is an evolving project!**

- Expect frequent updates and improvements.
- Some features are still in development.
- Breaking changes may happen as it matures.

## How It Works

1.  **Data Storage:** All release and artist information is stored directly in TypeScript files:
    * `src/lib/releases.ts`
    * `src/lib/artists.ts`
2.  **Adding Releases:** You add releases manually by editing the data files. To simplify this, a Chrome extension is provided.
3.  **Chrome Extension:** Allows you to visit a release page on Rate Your Music and click a button to send the data (artist, title, cover image) to your *local* Krater dev server, which then attempts to add it to your `releases.ts` file.
4.  **Static Site Generation:** The project uses Next.js to build into a set of static HTML, CSS, and JavaScript files suitable for static hosting.
5.  **Deployment:** These static files can be hosted anywhere.

## Getting Started

### Prerequisites

* Node.js and npm (or pnpm/yarn) installed.
* Git (for cloning).
* Google Chrome (for the extension).

### Installation & Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/balzss/krater.git # Replace with your repo URL if you fork it
    cd krater
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or pnpm install / yarn install
    ```
3.  **Create local env file:**
    ```bash
    echo NEXT_PUBLIC_IS_LOCALHOST=true >> .env.local # in the project root
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the server at `http://localhost:3000/krater`.

### Adding the Extension to Chrome

1.  Open Google Chrome.
2.  Go to `chrome://extensions/`.
3.  Enable **"Developer mode"** using the toggle switch (usually in the top-right corner).
4.  Click **"Load unpacked"**.
5.  Navigate to the `chrome-extension` folder *within your cloned Krater project directory* and select it.
6.  The Krater extension icon should appear in your browser toolbar.

### Adding Releases using the Extension

1.  **IMPORTANT:** Ensure your local development server (`npm run dev` at `http://localhost:3000`) is running. The extension sends data to this local server.
2.  Navigate to a release page on `rateyourmusic.com`.
3.  Click "Add to Krater" above the release title. It should attempt to extract the data and send it.
4.  Check your `src/lib/releases.ts` file – the new release should be appended.
5.  You can also remove releases with the extension if already added

### Manual Data Entry

You can always directly edit `src/lib/releases.ts` and `src/lib/artists.ts` following the existing data structure.

### Cover arts

Cover arts are located at `public/covers/` and a reference is stored for each release. The chrome extension also downloads the image present in rateyourmusic but feel free to use something from a different source. Just make sure the file name is matching with the reference.

### Deployment

1.  **Build the static site:**
    ```bash
    npm run build
    ```
2.  **Deploy the output:** The static files will be generated in the `build` directory by default but can be changed in `next.config.js` if needed.
3.  Deploy the contents of the output directory (e.g., `build`) to your preferred static hosting provider (GitHub Pages, Netlify, Vercel, etc.).
4.  For an example of deploying to GitHub Pages using GitHub Actions, see the `.github/workflows/deploy.yml` file in this repository.

## Contributing

While this is a personal project, feel free to open issues for bugs or suggestions. Pull requests might be considered, but keep in mind the "opinionated" nature of the project.

## License

This project is licensed under the [MIT License](LICENSE).
