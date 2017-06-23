# Phase 1

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
- ~~Upgrade to use Trakt.tv [device auth](http://docs.trakt.apiary.io/#reference/authentication-devices)~~
- ~~Authenticated sockets~~
- Manual download functions per episode
- Manual show data update
- R&D: Handle shows that now have less episodes in a season (i.e. Lucifer)
	- Prune superfluous episode

- Match existing folders to show
	- Might be better to have some level of manual assignment?
- ~~BUG! Ensure directories are created when adding a show~~


# Phase 3

- Rebuild DNS system
- Add proxy support
- Full Show Sync *from* trakt?
	- Use this to populate collections automatically?
- Scheduled History Sync with Trakt?
	- Unsubscribe if show is removed, but keep files
- Support multiple feeds per show (e.g. ShowRSS & TVShowsApp)
	- Optional, but TVSA *does* have more data
- Feed Parsing - seems to make things laggy
	- Use child_process?
	



# Phase 4

- Ants!
- The `Movies` Update
	- Models
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



