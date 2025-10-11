# Roadmap (subject to change)

- preformance optimization: the browse page should first load the images on the top that the user sees first and later load the rest so the experience is smoother
- investigate: the browse page fetches the compact/normal layout state from localstorage every time when it's opened. it would be nice to only fetch that info before in the main menu and not refetch it until it's necessarry. i'm not sure how feseable is this but it would improve the load time of the browse page
- improvement: the action buttons on the release info modal should have pointer cursor
- investigate: what is missing from this project to make it possible to self host it on a server. currently it can be run in server mode only locally and hosted in a static mode, i want to keep these features but also add a way to deploy a docker image on a server which hosts the backend and frontend with the appropriate security features
- investigate: how to add last.fm integration? ideas: after the user connects to their last.fm profile in the settings menu, a new menu option will appear in the main menu which could navigate to a new page, displaying for example listening stats from the library. this features needs to make the connection between library data and last.fm data which i'm not sure how to do. it could display the most played released and least played released in recent time (1 or 3 months period). it could also suggest releases that you listened a lot (according to last.fm) but have not added to your library
- chore: remove the `/next` claude command which is no longer needed
- test: don't make ci tests fail if they don't reach the target coverage. coverage data is good to know but not that important of a metric
