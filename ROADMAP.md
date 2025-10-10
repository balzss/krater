# Roadmap (subject to change)

- implement changes from the chrome extension audit
- fix: the info button on the release tiles are misplaced (should be on the bottom right but now it's overlfowing and barly visible)
- feature: implement a json editing feature for the library data. there is already a placeholder for it in the settings page. it should use https://github.com/josdejong/svelte-jsoneditor (check github page for features and usage). it should also validate the changes and only allow saving valid library data
- improvement: the modal for the release info contains the artist info on the top which is redundant because it is also listed below the cover art. only keep the one under the cover art
- chore: create a commit hook that analyzes the changes and bumps the version number in the package.json file
