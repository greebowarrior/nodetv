# Phase 1 - Alpha

- ~~Authentication~~
- ~~Database design~~
- ~~Models/controllers~~
- ~~Scheduled feed updates~~
- ~~Automatic download of new episodes~~
- ~~Automatic renaming of new episodes~~
- ~~Automatic transcoding of new episodes~~
- ~~Mark as Collected in Trakt **per user**~~

# Phase 2

- ~~Rebuild REST API endpoints~~
- ~~Get it running on the server~~
- ~~Server-side rendering of views~~
- ~~Create basic UI~~
	- ~~UI: Search and add shows~~
	- ~~UI: Breadcrumb Service~~
	- ~~UI: Alerts Service~~
- ~~Remove *completed* torrents if they've be copied into media directory~~
- ~~Grid pagination~~
- ~~Directory rescan~~
- ~~Upgrade to use Trakt.tv device auth~~
- ~~Authenticated sockets~~
- ~~BUG! Ensure directories are created when adding a show~~

# Phase 3 - Beta

- ~~Manual download option per episode~~
- ~~Manual show data update~~
- ~~Database: Use dotenv~~
- ~~When adding a show or movie, add it to the trakt watchlist~~
- ~~Remove show: Unsubscribe, and remove from Trakt collection~~
- ~~Rebuild DNS system~~

- Add proxy support

- Full Show Sync *from* trakt?
	- ~~Fetch shows & create directories~~
	- Synchronise watch history

- Watch progress

- Better config option than the global.config object?
	- helper method?
- Installation guide
	- Guided setup page? Script?
- Add URIs to returned documents?
	- Enabled on Shows
- R&D: Handle shows that now have less episodes in a season (i.e. Lucifer)
	- How to prune superfluous episodes?


- Scheduled History Sync with Trakt?
	- Hourly, only get changes since x?
- Support multiple feeds per show (e.g. ShowRSS & TVShowsApp)
	- Optional, but TVSA *does* have more data
- R&D: Feed Parsing - seems to make things laggy
	- Use child_process?

# Phase 4

- Ants!
- User settings page improvements
- User creation flow
	- Would be nice to create a user & connect to Trakt at the same time
- The `Movies` Update
	- ~~Model~~
	- API Endpoints
	- Tasks
- Re-implement YTS API (use proxy)
- Better UI?
	- Theme support
	- Create directory structure for themes?
	- Create Express middleware to allow themes WITHOUT reloading service
- Integrated uPnP/DLNA server to replace minidlna dependency

# Eventually

- ~~Socket notifications~~
- Git-based updater & scripts?



