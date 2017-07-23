# NodeTV Roadmap

## Phase 1 - Pre-Alpha

- ~~Authentication~~
- ~~Database design~~
- ~~Models/controllers~~
- ~~Scheduled feed updates~~
- ~~Automatic download of new episodes~~
- ~~Automatic renaming of new episodes~~
- ~~Automatic transcoding of new episodes~~
- ~~Mark as Collected in Trakt **per user**~~


## Phase 2 - Alpha

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


## Phase 3 - Beta

- ~~Manual download option per episode~~
- ~~Manual show data update~~
- ~~Database: Use dotenv~~
- ~~When adding a show or movie, add it to the trakt watchlist~~
- ~~Remove show: Unsubscribe, and remove from Trakt collection~~
- ~~Rebuild DNS system~~
- ~~Sync shows from Trakt & create directories~~
- ~~Episode Watched functionality~~
- ~~Use .env for all configuration values~~


## Phase 4 - Release Candidate

- Ants!
- ~~Prune superfluous episodes~~
- ~~Sync from Trakt to local~~
	- ~~Collection~~
	- ~~History~~
- ~~Transcoding now sets title metadata~~
- ~~User settings page improvements~~
	- ~~Create user~~
	- ~~Update password~~
- ~~Initial user creation~~


## Phase 4.5 - Bug squashing

- Start listing bugs and enhancements in [Github issue tracker](https://github.com/greebowarrior/nodetv/issues)



## Phase 5 - Version 1.1

- The `Movies` Update
	- ~~Model~~
	- API Endpoints
	- Tasks
	- Where should we save artwork?
- ~~Update artwork module for movie support~~
- Add proxy spider support
- Re-implement YTS API (use proxy)
- Movie symlinking for Genres folder


## Phase 6 - Version 1.2

- Watch progress?
- Watch status on episodes
- Better UI?
	- Theme support
	- Create directory structure for themes?
	- Create Express middleware to allow themes WITHOUT reloading service
- Import Trakt CSV?
- Trakt Watchlist syncing
- JSON Web Token Auth?
	- Generate a unique RSA key per install?

# Eventually

- ~~Socket notifications~~
- Git-based updater & scripts?
- Installation guide
	- Guided setup page? Script?
- Add URIs to returned documents?
	- Enabled on Shows for testing

- Support multiple feeds per show (e.g. ShowRSS & TVShowsApp)
	- Optional, but TVSA *does* have more data
- R&D: Feed Parsing - seems to make things laggy
	- Use child_process?
- Integrated uPnP/DLNA server to replace minidlna dependency


