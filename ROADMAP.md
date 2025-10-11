# Roadmap (subject to change)

- do not display last fm stats menu option if user havent connected to lastm in settings page
- in the settings page admin login should be a button at first and clicking on it should expand it to the full form version
- some parts of the app should be disabled in static export mode like lastfm integration or the login option
- chore: the husky hook contains deprecated solutions which will be removed in the next major version, update to use the latest recommended usage
- tests: tests are failing, fix them
- the docker build is failing on github actions, investigate why
- remove the codecov badge from readme
- lint: instead of using `next lint` it should use prettier for linting and fixing linting errors, the precommit hook should also auto run the prettier fixes
